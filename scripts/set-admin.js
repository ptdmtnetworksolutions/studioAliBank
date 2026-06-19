/**
 * Utility script to set Firebase Auth Custom Claims for Admin Users in AliBank V3.
 * 
 * Cara Penggunaan:
 * 1. Unduh file Service Account Key JSON dari Firebase Console:
 *    Project Settings -> Service accounts -> klik "Generate new private key".
 * 2. Simpan file tersebut dengan nama `serviceAccountKey.json` di folder `scripts/`.
 * 3. Jalankan script ini menggunakan Node.js:
 *    node scripts/set-admin.js <email_admin>
 * 
 * Contoh:
 * node scripts/set-admin.js alidzulfikar075@gmail.com
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const emailToPromote = process.argv[2];

if (!emailToPromote) {
  console.error('❌ Mohon berikan alamat email admin yang ingin didaftarkan.');
  console.error('Penggunaan: node scripts/set-admin.js <email_admin>');
  process.exit(1);
}

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ File serviceAccountKey.json tidak ditemukan di folder scripts/.');
  console.error('Silakan unduh dari Firebase Console -> Project Settings -> Service accounts dan simpan di folder ini.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log(`⏳ Mencari pengguna dengan email: ${emailToPromote}...`);

admin.auth().getUserByEmail(emailToPromote)
  .then((userRecord) => {
    console.log(`✅ Pengguna ditemukan: ${userRecord.displayName || 'No Name'} (UID: ${userRecord.uid})`);
    console.log(`⏳ Menyetel custom claim { admin: true }...`);
    
    return admin.auth().setCustomUserClaims(userRecord.uid, { admin: true })
      .then(() => userRecord.uid);
  })
  .then((uid) => {
    console.log(`🎉 SUKSES! Hak akses administrator (Custom Claims) telah aktif untuk ${emailToPromote}.`);
    console.log(`UID: ${uid}`);
    console.log(`Nasabah tersebut harus keluar (Log Out) dan masuk kembali (Log In) pada aplikasi untuk memperbarui token hak aksesnya.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Gagal menyetel Custom Claims:', error.message);
    process.exit(1);
  });
