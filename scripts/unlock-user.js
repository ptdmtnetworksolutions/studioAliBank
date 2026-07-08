/**
 * Utility script to unlock/unsuspend a specific user by email.
 * 
 * Run using:
 * node scripts/unlock-user.js dididedeali@gmail.com
 */

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("❌ Masukkan email pengguna. Contoh: node scripts/unlock-user.js dididedeali@gmail.com");
    process.exit(1);
  }

  const app = getAdminApp();
  const db = getFirestore(app);
  
  console.log(`🔍 Mencari pengguna dengan email: ${email}...`);
  const snapshot = await db.collection('users').where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.error("❌ Pengguna tidak ditemukan.");
    process.exit(1);
  }

  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();

  console.log(`✅ Ditemukan: ${userData.name} (UID: ${userDoc.id})`);
  console.log(`   Status saat ini: Suspended = ${userData.isSuspended ?? false}`);

  if (userData.isSuspended) {
    await userDoc.ref.update({
      isSuspended: false,
      securityLockReason: null
    });
    console.log(`🎉 Berhasil membuka suspensi (Unlocking) akun ${email}!`);
  } else {
    console.log(`ℹ️ Akun ${email} sudah aktif (tidak ditangguhkan).`);
  }
}

main().catch(console.error);
