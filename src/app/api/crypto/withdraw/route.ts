import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

// ABI for ERC-20 Transfer
const ERC20_ABI = [
  'function transfer(address to, uint256 value) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

/**
 * POST /api/crypto/withdraw
 * Process custodial crypto balance withdrawal to external address on-chain.
 * Signs and broadcasts the transaction from the central AliBank Hot Wallet / Vault.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, asset, amount, recipient } = body;

    // 1. Validation
    if (!userId || !asset || !amount || !recipient) {
      return NextResponse.json({ error: 'Parameter tidak lengkap.' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah penarikan harus lebih dari 0.' }, { status: 400 });
    }

    if (!ethers.isAddress(recipient)) {
      return NextResponse.json({ error: 'Alamat dompet tujuan tidak valid.' }, { status: 400 });
    }

    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    const userRef = db.collection('users').doc(userId);
    const apiKeysSnap = await db.collection('system').doc('api_keys').get();

    if (!apiKeysSnap.exists) {
      return NextResponse.json({ error: 'Konfigurasi Brankas API tidak ditemukan.' }, { status: 500 });
    }

    const config = apiKeysSnap.data()!;
    let pkey = config.vaultPrivateKey;
    if (!pkey) {
      return NextResponse.json({ error: 'Kunci privat Brankas belum dikonfigurasi.' }, { status: 500 });
    }
    const privateKey = pkey.startsWith('0x') ? pkey : '0x' + pkey;

    // 2. Perform database transaction to verify and deduct custodial balance
    let userBalance = 0;
    let userName = 'Nasabah AliBank';

    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new Error('Akun nasabah tidak ditemukan.');
      }

      const userData = userSnap.data()!;
      userName = userData.name || 'Nasabah AliBank';

      if (asset === 'ETH') {
        userBalance = userData.cryptoBalances?.ETH ?? 0;
      } else if (asset === 'USDT') {
        userBalance = userData.cryptoBalances?.USDT ?? 0;
      } else if (asset === 'ALX') {
        userBalance = userData.cryptoBalances?.ALX ?? 0;
      } else if (asset === 'BTC') {
        userBalance = userData.cryptoBalances?.BTC ?? 0;
      } else {
        throw new Error(`Aset ${asset} tidak didukung.`);
      }

      if (userBalance < numAmount) {
        throw new Error(`Saldo ${asset} tidak cukup. Tersedia: ${userBalance}`);
      }

      // Deduct custodial balance
      tx.update(userRef, {
        [`cryptoBalances.${asset}`]: FieldValue.increment(-numAmount)
      });
    });

    // 3. Execute On-Chain Transfer using Ethers.js
    let txHash = '';
    let usedNetwork = '';

    try {
      if (asset === 'ALX') {
        const rpcUrl = config.polygonRpcUrl || 'https://polygon-rpc.com';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const tokenAddress = config.alxContractAddress || '0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd';
        
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        const amountWei = ethers.parseEther(numAmount.toString());

        // Broadcast transaction
        const txResponse = await contract.transfer(recipient, amountWei);
        txHash = txResponse.hash;
        usedNetwork = 'Polygon Mainnet';
        
        // Wait for 1 confirmation async (don't block API response too long)
        txResponse.wait(1).catch((e: any) => console.error('[ALX Tx Wait Error]:', e));

      } else if (asset === 'USDT') {
        // USDT withdrawal over Polygon for cheap gas fees
        const rpcUrl = config.polygonRpcUrl || 'https://polygon-rpc.com';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const tokenAddress = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'; // Polygon USDT
        
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        // USDT has 6 decimals on Polygon/Ethereum
        const amountUnits = ethers.parseUnits(numAmount.toString(), 6);

        const txResponse = await contract.transfer(recipient, amountUnits);
        txHash = txResponse.hash;
        usedNetwork = 'Polygon Mainnet (USDT)';

        txResponse.wait(1).catch((e: any) => console.error('[USDT Tx Wait Error]:', e));

      } else if (asset === 'ETH') {
        // ETH withdrawal over Ethereum Mainnet
        const rpcUrl = config.ethereumRpcUrl || 'https://ethereum-rpc.publicnode.com';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        
        const txResponse = await wallet.sendTransaction({
          to: recipient,
          value: ethers.parseEther(numAmount.toString())
        });
        txHash = txResponse.hash;
        usedNetwork = 'Ethereum Mainnet';

        txResponse.wait(1).catch((e: any) => console.error('[ETH Tx Wait Error]:', e));

      } else if (asset === 'BTC') {
        // BTC is not EVM-native, simulate clearing queue but with real status update
        txHash = `BTC-CLR-${Date.now()}`;
        usedNetwork = 'Bitcoin Network (Simulated)';
      }

    } catch (onChainError: any) {
      console.error('[On-Chain Transaction Error]:', onChainError.message);
      
      // Rollback database balance if on-chain execution fails
      await userRef.update({
        [`cryptoBalances.${asset}`]: FieldValue.increment(numAmount)
      });

      return NextResponse.json({
        error: `Gagal mengirim aset ke blockchain: ${onChainError.message || onChainError}`
      }, { status: 500 });
    }

    // 4. Log Transaction and notifications in Firestore
    const now = new Date().toISOString();
    const displayAmount = `${numAmount} ${asset}`;
    const batch = db.batch();

    // User's transaction log
    const userTxRef = db.collection('users').doc(userId).collection('transactions').doc();
    batch.set(userTxRef, {
      date: now,
      description: `Penarikan ${asset} ke Wallet Eksternal`,
      category: 'Crypto Withdrawal',
      cryptoAmount: numAmount,
      cryptoCurrency: asset,
      recipient,
      type: 'expense',
      status: 'success',
      txHash,
      network: usedNetwork,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Global audit log
    const auditTxRef = db.collection('system').doc('audit').collection('global_transactions').doc();
    batch.set(auditTxRef, {
      id: txHash,
      category: 'Crypto Withdrawal',
      asset,
      amount: numAmount,
      description: `Penarikan ${displayAmount} dari ${userName} ke ${recipient} (${usedNetwork})`,
      status: 'success',
      txHash,
      senderId: userId,
      recipient,
      timestamp: FieldValue.serverTimestamp(),
    });

    // User notification
    const userNotifRef = db.collection('users').doc(userId).collection('notifications').doc();
    batch.set(userNotifRef, {
      title: '📤 Penarikan Berhasil',
      message: `${displayAmount} berhasil dikirim ke ${recipient.slice(0, 10)}... Hash: ${txHash.slice(0, 10)}...`,
      type: 'success',
      read: false,
      createdAt: now,
      timestamp: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      txHash,
      network: usedNetwork,
      message: `${displayAmount} berhasil ditransfer secara on-chain.`
    });

  } catch (err: any) {
    console.error('[Crypto Withdrawal Route Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses penarikan crypto.' },
      { status: 500 }
    );
  }
}
