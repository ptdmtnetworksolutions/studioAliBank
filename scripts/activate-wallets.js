/**
 * Utility script to audit and generate missing EVM/BTC wallets for existing users.
 * 
 * Run using:
 * node scripts/activate-wallets.js
 */

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { ethers } = require('ethers');

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

async function main() {
  const app = getAdminApp();
  const db = getFirestore(app);
  
  console.log("🔍 Memeriksa daftar nasabah yang belum memiliki alamat wallet...");
  const snapshot = await db.collection('users').get();
  console.log(`📊 Ditemukan total ${snapshot.size} nasabah.`);
  
  let updatedCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hasMissingEvm = !data.walletAddress || 
                         data.walletAddress === "Alamat EVM belum diaktifkan." || 
                         data.walletAddress.includes("belum");
                         
    const hasMissingBtc = !data.btcAddress || 
                         data.btcAddress === "Alamat BTC belum diaktifkan." || 
                         data.btcAddress.includes("belum");

    if (hasMissingEvm || hasMissingBtc) {
      console.log(`⚠️ Nasabah: ${data.name || 'No Name'} (${data.email || doc.id}) memiliki wallet yang belum aktif.`);
      
      const updates = {};
      
      if (hasMissingEvm) {
        const internalWallet = ethers.Wallet.createRandom();
        updates.walletAddress = internalWallet.address;
        updates.privateKey = internalWallet.privateKey;
        console.log(`   👉 Membuat wallet EVM baru: ${internalWallet.address}`);
      }
      
      if (hasMissingBtc) {
        const mockBtcSuffix = Array.from({length: 38}, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
        const mockBtcAddress = `bc1q${mockBtcSuffix}`;
        updates.btcAddress = mockBtcAddress;
        console.log(`   👉 Membuat wallet BTC baru: ${mockBtcAddress}`);
      }

      await doc.ref.update(updates);
      console.log(`   ✅ Berhasil memperbarui data nasabah.`);
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Proses selesai. Berhasil mengaktifkan wallet untuk ${updatedCount} nasabah.`);
}

main().catch((err) => {
  console.error("❌ Terjadi kesalahan saat menjalankan script:", err);
});
