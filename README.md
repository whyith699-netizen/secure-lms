# SECURE — LMS Ekstrakurikuler Coding

Source project: **Vite + JavaScript, Firebase Authentication, Cloud Functions (Node.js 22), Cloud Firestore, Cloud Storage, dan Firebase Hosting**. Aplikasi utama memakai backend Firebase, bukan data demo. Tiga desain HTML lama berada terpisah di `design-reference/`.

## Status pengujian — baca dahulu

- 16 unit test logika inti telah dijalankan dan lulus.
- Pemeriksaan sintaks JavaScript lulus.
- Instalasi npm di lingkungan pembuat terblokir DNS `ENOTFOUND registry.npmjs.org`.
- Akibatnya **build dengan dependency asli, runtime Firebase SDK, integration test emulator, kamera HP nyata, dan deployment belum diuji**.
- Satu integration test disertakan tetapi dilewati sampai Anda menyalakan emulator.
- Paket ini bukan klaim 100% sesuai PRD atau siap produksi tanpa pengujian. Baca `docs/PRD-STATUS.md`.
- Tidak ada project cloud, akun, hosting, billing, atau kredensial yang dibuat/disertakan. Tidak ada node_modules atau lockfile hasil instalasi berhasil. Jalankan npm install dan simpan package-lock.json yang dihasilkan.

## Struktur

```text
web/                   Frontend aplikasi ketiga peran
functions/src/         API, transaksi presensi, scheduled job
functions/test/        Unit tests dan integration test emulator
scripts/manage.mjs     Provisioning operator: akun, peran, kelas, anggota
firebase.json          Hosting, Functions, emulator, security headers
firestore.rules        Menolak akses SDK klien langsung
storage.rules          File melalui backend terotorisasi
firestore.indexes.json
web/.env.example
.firebaserc.example
docs/                  Panduan dan status implementasi PRD
design-reference/      HTML prototipe lama; bukan app produksi
```

Lihat `docs/UPDATE-PERTEMUAN-DAN-DRIVE.md` untuk alur detail pertemuan, materi tertaut, dan izin file Drive.

## 1. Persiapan Firebase

1. Buat Firebase project dan tambahkan Web App.
2. Authentication → aktifkan Email/Password. Atur template email verifikasi/reset, nama pengirim, dan Authorized domains (domain Hosting/custom; localhost untuk dev jika diperlukan).
3. Buat Cloud Firestore Native mode dan Cloud Storage bucket. Catat nama bucket persis dari Console; bisa berakhiran `.firebasestorage.app` atau `.appspot.com`.
4. Siapkan paket billing yang diperlukan Cloud Functions generasi 2, Storage, Build, dan Scheduler. Periksa persyaratan dan harga terbaru di Console; jangan mengasumsikan gratis.
5. Functions memakai `asia-southeast2` (Jakarta). Pilih lokasi database/storage yang kompatibel. Jika mengganti region Functions, ubah `functions/src/index.js` serta rewrite pada `firebase.json` bersamaan.
6. Pasang Node.js 22 LTS. Emulator Firestore juga memerlukan Java yang kompatibel; gunakan Java 21+.

## 2. Instalasi dan konfigurasi

Dari folder `secure-project` setelah unzip:

```bash
npm install
cp web/.env.example web/.env.local
cp .firebaserc.example .firebaserc
```

Di Windows, salin file tersebut lewat Explorer jika tidak memakai shell Unix.

Isi `web/.env.local` dengan konfigurasi Web App Firebase, bukan service account:

```dotenv
VITE_FIREBASE_API_KEY=API_KEY_WEB_ANDA
VITE_FIREBASE_AUTH_DOMAIN=PROJECT_ANDA.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=PROJECT_ANDA
VITE_FIREBASE_STORAGE_BUCKET=NAMA_BUCKET_PERSIS_DARI_CONSOLE
VITE_FIREBASE_APP_ID=APP_ID_WEB_ANDA
VITE_USE_EMULATORS=false
VITE_API_BASE=/api
```

Isi `.firebaserc`:

```json
{"projects":{"default":"PROJECT_ANDA"}}
```

Environment frontend dimasukkan saat build. Perubahan konfigurasi membutuhkan build dan deploy Hosting ulang. Web API key bukan kredensial admin dan tidak menggantikan Security Rules.

## 3. Build dan deploy

```bash
npm run build
npm test
npx firebase login
npm run deploy
```

Deploy mencakup Hosting, API Functions, scheduled function, Firestore rules/indexes, dan Storage rules. Tunggu indexes siap. Deploy pertama dapat memerlukan aktivasi layanan Google Cloud dan izin IAM dari pemilik project.

Jika dependency Functions tidak ditemukan oleh proses deploy, jalankan `npm install --prefix functions`, lalu deploy ulang. Domain Hosting harus melayani `/api` lewat rewrite Functions. Hosting statis tanpa backend tidak cukup. Jangan membuka aplikasi melalui file://; buka URL HTTPS Hosting.

## 4. Admin pertama, pengajar, dan kelas

**Admin UI hanya menambah email.** Provisioning peran/kelas dijalankan operator terpercaya melalui CLI.

Gunakan Application Default Credentials berwenang atau service account khusus. Simpan JSON kredensial **di luar folder project**. Jangan masukkan ke frontend, Git, ZIP publik, atau chat.

macOS/Linux:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/lokasi-privat/service-account.json"
export GCLOUD_PROJECT="PROJECT_ANDA"
npm run manage -- bootstrap-admin admin@example.com "Admin SECURE"
npm run manage -- set-role pengajar@example.com pengajar
npm run manage -- create-class coding-dasar "Coding Dasar" "Ganjil 2026"
npm run manage -- assign-teacher coding-dasar pengajar@example.com
```

PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\privat\service-account.json"
$env:GCLOUD_PROJECT="PROJECT_ANDA"
npm run manage -- bootstrap-admin admin@example.com "Admin SECURE"
```

CLI membuat akun Auth jika belum ada tanpa password yang dibagikan. Pengguna memakai **Lupa password** untuk menetapkan password sendiri, masuk, lalu memverifikasi email. Akun yang sudah ada mempertahankan passwordnya. Perubahan peran mencabut token sehingga perlu login ulang.

## 5. Alur tambah siswa

1. Admin login → tambahkan email siswa ke allowlist.
2. Siswa klik Aktifkan akun, isi nama/email/password, verifikasi email, dan masuk kembali.
3. Operator menjalankan:

```bash
npm run manage -- profile siswa@example.com "Nama Siswa" "2026001" "X RPL 1"
npm run manage -- enroll coding-dasar siswa@example.com "X RPL 1"
```

Alternatif provisioning awal melalui CLI: `npm run manage -- set-role siswa@example.com siswa`, kemudian profile/enroll. Role siswa diberikan otomatis pada aktivasi akun. Pengguna tidak dapat memilih sendiri role pengajar/admin.

## 6. Pertemuan pertama

1. Pengajar memilih kelas, menambah materi dan menerbitkannya. Lampiran diunggah setelah materi tersimpan.
2. Buat pertemuan: tanggal, lokasi, waktu buka/tutup presensi, dan batas tepat waktu.
3. Buka sesi untuk membuat snapshot peserta aktif (maksimal 200).
4. Pada jendela presensi, generate QR. Regenerate mengganti token aktif dan mencabut yang lama.
5. Siswa buka Scan presensi, izinkan kamera, dan pindai QR. Konfirmasi hanya tampil setelah respons server.
6. Tutup sesi. Peserta tanpa record difinalisasi sebagai tidak hadir. CSV final tersedia setelah finalisasi.
7. Jika koneksi terputus setelah scan, periksa riwayat dahulu sebelum mengulang.

Waktu disimpan UTC; UI mengikuti zona perangkat. Kamera memerlukan HTTPS/localhost. QR dapat diteruskan selama masih aktif, sehingga tidak membuktikan lokasi fisik siswa.

## 7. Emulator dan development

Gunakan project `demo-secure` agar tidak menyentuh produksi. Isi env frontend dengan project `demo-secure`, API key `demo-key`, auth domain `demo-secure.firebaseapp.com`, app ID `demo-app`, bucket `demo-secure.appspot.com`, dan `VITE_USE_EMULATORS=true`.

```bash
npm run build
npx firebase emulators:start --project demo-secure --only auth,firestore,storage,functions,hosting
# Terminal kedua untuk hot reload:
npm run dev
```

Vite mem-proxy `/api` ke Hosting emulator port 5000. Jangan deploy hasil build emulator ke produksi. Untuk CLI lokal dan test:

```bash
export GCLOUD_PROJECT=demo-secure
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
npm run manage -- bootstrap-admin admin@example.com "Admin Lokal"
npm run test:emulator
```

PowerShell: set `$env:GCLOUD_PROJECT`, `$env:FIRESTORE_EMULATOR_HOST`, `$env:FIREBASE_AUTH_EMULATOR_HOST`, dan `$env:RUN_EMULATOR_TESTS="1"`, kemudian `node --test functions/test/integration.test.js`.

Tautan reset/verifikasi Auth emulator muncul di log terminal emulator. Backend melewati verified-email check hanya saat `FUNCTIONS_EMULATOR=true`.

## 8. Sebelum memakai data siswa sungguhan

- Jalankan integration test dan checklist `docs/TESTING.md`.
- Tinjau IAM: Admin SDK melewati Firestore/Storage rules.
- Atur backup Firestore, Storage, serta export Auth; uji restore. Backup database saja tidak mencakup file dan akun Auth.
- Atur budget alerts, monitoring, retensi, penghapusan data, serta pemberitahuan privasi sekolah.
- Review dependency dan security advisories setelah install.
- Pertimbangkan App Check dan blocking signup jika perlu invite-only pada level Firebase Auth.

Batas versi ini: satu organisasi, maksimum 100 kelas dan 200 peserta per pertemuan. Ini pembatas implementasi, bukan kapasitas yang sudah dibuktikan dengan load test.
