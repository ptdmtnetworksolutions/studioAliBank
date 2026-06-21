import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

const POLYGON_RPC_DEFAULT = 'https://polygon-rpc.com';
const ETH_RPC_DEFAULT = 'https://cloudflare-eth.com';
const ALX_CONTRACT_DEFAULT = '0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd';
const USDT_CONTRACT_DEFAULT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const VAULT_CONTRACT_DEFAULT = '0x56268032A3B3E64CFeF1916d591087CF8dF40945';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const OWNER_EMAIL = 'alidzulfikar075@gmail.com';
const OWNER_UID = 'IJOuQpjEOMgvlYfzvQ1yfp976Oa2';

// Safe helper to authenticate admin
async function verifyAdminAuth(req: NextRequest, adminApp: App): Promise<boolean> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    const token = authHeader.substring(7);
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    
    // Check if the user is the owner or has admin claim
    if (decodedToken.email === OWNER_EMAIL || decodedToken.uid === OWNER_UID || decodedToken.admin === true) {
      return true;
    }
  } catch (err) {
    console.error('[Reconciliation Auth Error]:', err);
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    // 1. Verify Admin Credentials
    const isAuthorized = await verifyAdminAuth(req, adminApp);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Akses ditolak. Endpoint ini memerlukan hak administratif.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const autoSuspend = body.autoSuspend ?? false;

    // 2. Fetch system configuration
    const apiKeysSnap = await db.collection('system').doc('api_keys').get();
    const config = apiKeysSnap.exists ? apiKeysSnap.data()! : {};
    
    const polygonRpc = config.polygonRpcUrl || POLYGON_RPC_DEFAULT;
    const ethereumRpc = config.ethereumRpcUrl || ETH_RPC_DEFAULT;
    const alxContract = config.alxContractAddress || ALX_CONTRACT_DEFAULT;
    const usdtContract = config.usdtContractAddress || USDT_CONTRACT_DEFAULT;
    const vaultContract = config.vaultContractAddress || VAULT_CONTRACT_DEFAULT;

    // 3. Scan all users and audit their balances
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    let totalUsersAudited = 0;
    const flaggedUsers: any[] = [];
    
    // Cumulative custodian balances in DB
    const totalCustody = {
      IDR: 0,
      ALX: 0,
      USDT: 0,
      ETH: 0,
      BTC: 0
    };

    const isNeutralCategory = (cat: string) => 
      ['Legalization', 'Adjustment', 'Debt Recovery', 'Debt Restructuring'].includes(cat || '');

    for (const user of users) {
      totalUsersAudited++;
      const userRef = db.collection('users').doc(user.id);
      
      // Accumulate DB balances
      const userBalIdr = (user.totalBalance || 0) + (user.savings || 0);
      const userBalAlx = user.cryptoBalances?.ALX || 0;
      const userBalUsdt = user.cryptoBalances?.USDT || 0;
      const userBalEth = user.cryptoBalances?.ETH || 0;
      const userBalBtc = user.cryptoBalances?.BTC || 0;

      totalCustody.IDR += userBalIdr;
      totalCustody.ALX += userBalAlx;
      totalCustody.USDT += userBalUsdt;
      totalCustody.ETH += userBalEth;
      totalCustody.BTC += userBalBtc;

      // Fetch user's local transactions
      const txsSnap = await userRef.collection('transactions').get();
      const txs = txsSnap.docs.map(d => d.data());

      let idrInflow = 0;
      let idrOutflow = 0;
      const cryptoInflows: Record<string, number> = { ALX: 0, USDT: 0, ETH: 0, BTC: 0 };
      const cryptoOutflows: Record<string, number> = { ALX: 0, USDT: 0, ETH: 0, BTC: 0 };

      txs.forEach(t => {
        if (isNeutralCategory(t.category)) return;
        const isIncome = t.type === 'income';
        const isExpense = t.type === 'expense';
        
        if (t.cryptoCurrency) {
          const cryptoAmt = t.cryptoAmount || t.toAmount || t.fromAmount || 0;
          if (isIncome) {
            cryptoInflows[t.cryptoCurrency] = (cryptoInflows[t.cryptoCurrency] || 0) + cryptoAmt;
          } else if (isExpense) {
            cryptoOutflows[t.cryptoCurrency] = (cryptoOutflows[t.cryptoCurrency] || 0) + cryptoAmt;
          }
        } else if (t.asset) {
          const amt = t.amount || 0;
          if (isIncome) {
            if (t.asset === 'IDR') idrInflow += amt;
            else cryptoInflows[t.asset] = (cryptoInflows[t.asset] || 0) + amt;
          } else if (isExpense) {
            if (t.asset === 'IDR') idrOutflow += amt;
            else cryptoOutflows[t.asset] = (cryptoOutflows[t.asset] || 0) + amt;
          }
        } else {
          // Fallback to IDR fiat
          const amt = t.amount || 0;
          if (isIncome) idrInflow += amt;
          else if (isExpense) idrOutflow += amt;
        }
      });

      const idrLedgerBal = idrInflow - idrOutflow;
      const idrDiff = userBalIdr - idrLedgerBal;

      const userFlaggedAssets: any[] = [];

      // Discrepancy check: if actual balance > transaction history sum
      if (idrDiff > 1000) { // Tolerance of 1000 IDR
        userFlaggedAssets.push({
          asset: 'IDR',
          actual: userBalIdr,
          ledger: idrLedgerBal,
          diff: idrDiff
        });
      }

      ['ALX', 'USDT', 'ETH', 'BTC'].forEach(coin => {
        const ledgerBal = (cryptoInflows[coin] || 0) - (cryptoOutflows[coin] || 0);
        const actualBal = coin === 'ALX' ? userBalAlx : (coin === 'USDT' ? userBalUsdt : (coin === 'ETH' ? userBalEth : userBalBtc));
        const diff = actualBal - ledgerBal;
        if (diff > 0.0001) { // 0.0001 tolerance
          userFlaggedAssets.push({
            asset: coin,
            actual: actualBal,
            ledger: ledgerBal,
            diff: diff
          });
        }
      });

      if (userFlaggedAssets.length > 0) {
        const flaggedInfo = {
          userId: user.id,
          name: user.name || 'Pengguna Tanpa Nama',
          email: user.email || 'N/A',
          tier: user.tier || 'Regular',
          isSuspended: user.isSuspended ?? false,
          flaggedAssets: userFlaggedAssets
        };
        flaggedUsers.push(flaggedInfo);

        // Auto-suspend account if enabled and user not already suspended
        if (autoSuspend && !user.isSuspended) {
          await userRef.update({
            isSuspended: true,
            securityLockReason: 'Auto-Suspended: Ledger reconciliation discrepancy detected.'
          });

          // Record in transactions log
          await userRef.collection('transactions').add({
            date: new Date().toISOString(),
            description: 'Security Freeze: Saldo Ditangguhkan (Rekonsiliasi Mismatch)',
            category: 'Security Lock',
            amount: 0,
            type: 'expense',
            status: 'success',
            timestamp: FieldValue.serverTimestamp()
          });

          // Add notifications
          await userRef.collection('notifications').add({
            title: '⚠️ Pembekuan Akun Keamanan',
            message: 'Akun Anda ditangguhkan secara otomatis oleh sistem keamanan AliBank karena adanya selisih saldo di luar riwayat mutasi sah Anda.',
            type: 'warning',
            read: false,
            createdAt: new Date().toISOString(),
            timestamp: FieldValue.serverTimestamp()
          });

          // Add to system global audit log
          await db.collection('system').doc('audit').collection('global_transactions').add({
            id: `SUSP-AUTO-${user.id}-${Date.now()}`,
            category: 'Security Alert',
            gateway: 'System Reconciler',
            amountIdr: 0,
            status: 'success',
            timestamp: FieldValue.serverTimestamp(),
            userEmail: user.email || '',
            description: `Auto-suspended user ${user.email} (UID: ${user.id}) due to reconciliation discrepancy of IDR ${idrDiff.toFixed(2)}.`
          });
        }
      }
    }

    // 4. Fetch Actual On-Chain Wallet Balances
    const totalVault = {
      ALX: 0,
      USDT: 0,
      ETH: 0,
      BTC: 0, // BTC is fully custodial, no RPC check
      IDR: 0  // Read from injected total/liquidity as fallback
    };

    let rpcErrors = [];

    // Check Polygon
    try {
      const providerPolygon = new ethers.JsonRpcProvider(polygonRpc, undefined, { staticNetwork: true });
      
      // Get Admin Wallet Address from vaultPrivateKey if available
      let adminWalletAddress = '';
      if (config.vaultPrivateKey) {
        const pkey = config.vaultPrivateKey.trim();
        const finalKey = pkey.startsWith('0x') ? pkey : '0x' + pkey;
        const wallet = new ethers.Wallet(finalKey, providerPolygon);
        adminWalletAddress = wallet.address;
      }

      if (adminWalletAddress) {
        const alxContractObj = new ethers.Contract(alxContract, ERC20_ABI, providerPolygon);
        const usdtContractObj = new ethers.Contract(usdtContract, ERC20_ABI, providerPolygon);

        const [alxWei, usdtUnits] = await Promise.all([
          alxContractObj.balanceOf(adminWalletAddress).catch(() => BigInt(0)),
          usdtContractObj.balanceOf(adminWalletAddress).catch(() => BigInt(0))
        ]);

        totalVault.ALX = parseFloat(ethers.formatUnits(alxWei, 18));
        totalVault.USDT = parseFloat(ethers.formatUnits(usdtUnits, 6));
      }
    } catch (err: any) {
      console.warn('[Reconcile Polygon RPC Error]:', err.message);
      rpcErrors.push(`Polygon RPC error: ${err.message}`);
    }

    // Check Ethereum
    try {
      const providerEth = new ethers.JsonRpcProvider(ethereumRpc, undefined, { staticNetwork: true });
      const ethWei = await providerEth.getBalance(vaultContract).catch(() => BigInt(0));
      totalVault.ETH = parseFloat(ethers.formatEther(ethWei));
    } catch (err: any) {
      console.warn('[Reconcile Ethereum RPC Error]:', err.message);
      rpcErrors.push(`Ethereum RPC error: ${err.message}`);
    }

    // Read Fiat Gateway total liquidity as vault IDR reference
    const liquiditySnap = await db.collection('system').doc('liquidity').get();
    if (liquiditySnap.exists) {
      const liqData = liquiditySnap.data()!;
      totalVault.IDR = liqData.totalFiatInjected || 0;
    }

    // Calculate system deficiencies
    const deficiencies = {
      IDR: Math.max(0, totalCustody.IDR - totalVault.IDR),
      ALX: Math.max(0, totalCustody.ALX - totalVault.ALX),
      USDT: Math.max(0, totalCustody.USDT - totalVault.USDT),
      ETH: Math.max(0, totalCustody.ETH - totalVault.ETH)
    };

    const isSystemDeficit = deficiencies.ALX > 0.01 || deficiencies.USDT > 0.01 || deficiencies.ETH > 0.01 || deficiencies.IDR > 10000;

    // 5. Save run results to DB
    const runId = `RUN-${Date.now()}`;
    const runRef = db.collection('system').doc('reconciliation').collection('runs').doc(runId);
    
    const runData = {
      runId,
      timestamp: FieldValue.serverTimestamp(),
      totalUsersAudited,
      flaggedUsersCount: flaggedUsers.length,
      flaggedUsers,
      totalCustody,
      totalVault,
      deficiencies,
      rpcErrors,
      status: isSystemDeficit || flaggedUsers.length > 0 ? 'anomalies_detected' : 'clean'
    };

    await runRef.set(runData);

    // Update global reconciliation status summary
    await db.collection('system').doc('reconciliation').set({
      latestRunId: runId,
      latestRunTimestamp: FieldValue.serverTimestamp(),
      status: runData.status,
      flaggedUsersCount: flaggedUsers.length,
      isSystemDeficit,
      rpcErrors: rpcErrors.length > 0 ? rpcErrors : null
    }, { merge: true });

    return NextResponse.json({
      success: true,
      runId,
      status: runData.status,
      totalUsersAudited,
      flaggedUsersCount: flaggedUsers.length,
      flaggedUsers,
      totalCustody,
      totalVault,
      deficiencies,
      rpcErrors
    });

  } catch (err: any) {
    console.error('[Reconciliation API Error]:', err.message);
    return NextResponse.json({ error: err.message || 'Gagal menjalankan audit rekonsiliasi.' }, { status: 500 });
  }
}
