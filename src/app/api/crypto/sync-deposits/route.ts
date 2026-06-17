import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

// ABI minimal untuk mendeteksi event Transfer ERC-20
const ERC20_TRANSFER_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
];

const POLYGON_RPC_DEFAULT = 'https://polygon-rpc.com';
const ALX_CONTRACT_ADDRESS = '0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd';
const USDT_CONTRACT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Parameter userId diperlukan' }, { status: 400 });
    }

    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    // 1. Ambil data user
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const userData = userSnap.data()!;
    const walletAddress = userData.walletAddress;

    if (!walletAddress || walletAddress === '0xNoWalletInitialized') {
      return NextResponse.json({ success: true, message: 'User belum memiliki wallet' });
    }

    // 2. Dapatkan konfigurasi RPC dan Kunci API
    const apiKeysSnap = await db.collection('system').doc('api_keys').get();
    const config = apiKeysSnap.exists ? apiKeysSnap.data()! : {};
    const polygonRpc = config.polygonRpcUrl || POLYGON_RPC_DEFAULT;

    const provider = new ethers.JsonRpcProvider(polygonRpc);

    // 3. Cari Block Terbaru & Tentukan Rentang Scan
    const latestBlock = await provider.getBlockNumber();
    const lastSyncedBlock = userData.lastSyncedBlockPolygon || (latestBlock - 10000); // Scan 10.000 blok ke belakang jika pertama kali
    
    // Batasi maksimum range scan per request agar tidak kelebihan beban (Max 10,000 blok)
    const startBlock = Math.max(lastSyncedBlock + 1, latestBlock - 10000);
    const endBlock = latestBlock;

    if (startBlock > endBlock) {
      return NextResponse.json({ 
        success: true, 
        message: 'Sudah sinkron dengan blok terbaru', 
        syncedBlock: endBlock 
      });
    }

    // 4. Kueri Event Transfer untuk ALX dan USDT di Polygon
    const tokens = [
      { symbol: 'ALX', address: ALX_CONTRACT_ADDRESS, decimals: 18 },
      { symbol: 'USDT', address: USDT_CONTRACT_ADDRESS, decimals: 6 }
    ];

    let newDepositsCount = 0;
    const processedTxHashes: string[] = [];

    // Ambil riwayat TxHash yang pernah diproses untuk menghindari duplikasi saldo
    const existingTxsSnap = await userRef.collection('transactions')
      .where('category', '==', 'Crypto Deposit')
      .get();
    
    const existingHashes = new Set(
      existingTxsSnap.docs.map(doc => doc.data().txHash)
    );

    for (const token of tokens) {
      const contract = new ethers.Contract(token.address, ERC20_TRANSFER_ABI, provider);
      
      // Filter Event Transfer di mana parameter 'to' adalah alamat dompet user
      const filter = contract.filters.Transfer(null, walletAddress);
      const logs = await contract.queryFilter(filter, startBlock, endBlock).catch(() => []);

      for (const log of logs) {
        if ('args' in log && log.args) {
          const from = log.args[0];
          const value = log.args[2];
          const txHash = log.transactionHash;

          // Lewati jika transaksi sudah pernah diproses sebelumnya
          if (existingHashes.has(txHash)) continue;

          // Konversi nominal
          const amount = parseFloat(ethers.formatUnits(value, token.decimals));
          if (amount <= 0) continue;

          // Eksekusi penambahan saldo di database via transaction
          await db.runTransaction(async (tx) => {
            // Re-read user balance inside transaction
            const userTxSnap = await tx.get(userRef);
            if (!userTxSnap.exists) return;
            
            const currentBalances = userTxSnap.data()!.cryptoBalances || {};
            const currentBal = currentBalances[token.symbol] || 0;

            // Update balance
            tx.update(userRef, {
              [`cryptoBalances.${token.symbol}`]: currentBal + amount
            });

            // Catat riwayat transaksi in-app
            const txLogRef = userRef.collection('transactions').doc();
            tx.set(txLogRef, {
              date: new Date().toISOString(),
              description: `Terima ${token.symbol} dari Wallet Eksternal`,
              category: 'Crypto Deposit',
              cryptoAmount: amount,
              cryptoCurrency: token.symbol,
              senderAddress: from,
              type: 'income',
              status: 'success',
              txHash: txHash,
              network: 'Polygon Mainnet',
              timestamp: FieldValue.serverTimestamp()
            });

            // Catat ke audit ledger global
            const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();
            tx.set(auditRef, {
              id: `DEP-AUTO-${Date.now()}`,
              category: 'External Inflow',
              gateway: 'Auto-Node Sync',
              amountIdr: 0,
              cryptoAmount: amount,
              cryptoCurrency: token.symbol,
              txHash: txHash,
              description: `Auto-credited deposit ${amount} ${token.symbol} to ${userData.name || 'User'}. TxHash: ${txHash.slice(0, 10)}...`,
              status: 'berhasil',
              timestamp: FieldValue.serverTimestamp(),
              userEmail: userData.email || ''
            });

            // Tambah notifikasi in-app
            const notifRef = userRef.collection('notifications').doc();
            tx.set(notifRef, {
              title: `📥 Deposit ${token.symbol} Masuk`,
              message: `Setoran ${amount} ${token.symbol} Anda telah berhasil diterima dan dikreditkan secara otomatis. Hash: ${txHash.slice(0,10)}...`,
              type: 'success',
              read: false,
              createdAt: new Date().toISOString(),
              timestamp: FieldValue.serverTimestamp()
            });
          });

          newDepositsCount++;
          processedTxHashes.push(txHash);
          // Tambahkan ke set lokal untuk mencegah double process jika ada duplikasi event dalam block log
          existingHashes.add(txHash);
        }
      }
    }

    // 5. Update block terakhir yang berhasil disinkronkan
    await userRef.update({
      lastSyncedBlockPolygon: endBlock
    });

    return NextResponse.json({
      success: true,
      newDepositsCount,
      processedTransactions: processedTxHashes,
      syncedBlock: endBlock,
      rangeScanned: `${startBlock} -> ${endBlock}`
    });

  } catch (err: any) {
    console.error('[Deposit Auto-Sync Route Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal menyinkronkan setoran' },
      { status: 500 }
    );
  }
}
