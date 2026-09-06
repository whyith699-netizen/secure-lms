# Pengujian SECURE

## Hasil saat paket dibuat

- 16 unit test logika inti: **lulus**.
- 1 integration test Firebase emulator: **disertakan tetapi dilewati** karena dependency/emulator tidak tersedia.
- Syntax check source JavaScript: lulus.
- Build Vite dengan dependency asli, deployment, kamera HP nyata, dan runtime Firebase: belum diuji karena registry npm tidak dapat diakses.

## Unit test

```bash
npm test
# Test domain murni tanpa dependency Firebase:
node --test functions/test/domain.test.js
```

Cakupan: ID presensi deterministik, 1.000 token unik, email normalization, QR lama/dicabut/kedaluwarsa, jendela sesi, batas terlambat, URL HTTPS, CSV injection, dan signature/ukuran lampiran.

## Integration test emulator

Nyalakan Auth, Firestore, Functions, Storage, dan Hosting emulator sesuai README. Lalu pada terminal lain:

```bash
export GCLOUD_PROJECT=demo-secure
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
npm run test:emulator
```

PowerShell:

```powershell
$env:GCLOUD_PROJECT="demo-secure"
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
$env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"
$env:RUN_EMULATOR_TESTS="1"
node --test functions/test/integration.test.js
```

Test menolak endpoint selain localhost dan memeriksa: siswa/admin tidak dapat generate QR, QR lama ditolak, lima check-in paralel menghasilkan satu record, siswa tidak dapat membaca roster, close menonaktifkan generate, admin dapat menambah email, serta duplikasi email ditolak.

## UAT manual wajib

- [ ] Admin dapat menambah email; siswa/pengajar tidak dapat memanggil endpoint admin.
- [ ] Email belum diizinkan, belum diverifikasi, akun nonaktif, atau token dicabut tidak dapat mengakses data.
- [ ] Pengajar tanpa assignment kelas dan siswa nonanggota ditolak.
- [ ] Materi draft/file kelas lain tidak dapat dibaca siswa.
- [ ] Markdown berbahaya tidak mengeksekusi script, event handler, atau aksi internal aplikasi.
- [ ] File >20 MB, ekstensi salah, atau signature tidak cocok ditolak.
- [ ] Pengajar membuka sesi dan generate QR; minimal dua HP memindai melalui HTTPS.
- [ ] Dua siswa boleh memakai QR aktif yang sama; scan ulang siswa yang sama tidak membuat duplikasi.
- [ ] QR sebelumnya, kedaluwarsa, atau dari sesi tertutup tidak membuat presensi baru.
- [ ] Generate/close/check-in bersamaan mengikuti urutan transaksi dan tidak menerima QR yang sudah dicabut.
- [ ] Perubahan jam HP tidak menentukan status; waktu server yang digunakan.
- [ ] Putuskan koneksi sesaat setelah scan; periksa riwayat dan pastikan tidak ada duplikasi.
- [ ] Koreksi manual menyimpan alasan/audit; finalisasi tidak menimpanya.
- [ ] Scheduled function menutup sesi; endpoint tetap menolak waktu terlambat jika job belum berjalan.
- [ ] CSV final hanya tersedia setelah finalisasi dan aman dari formula injection.
- [ ] Logout semua perangkat serta disable user mencabut akses.
- [ ] Uji Chrome Android, Safari iOS, desktop, keyboard, dialog, tabel, dan lebar 390 px.
- [ ] Load test 100 check-in/60 detik, pantau latensi, error, biaya reads/writes, dan concurrency.
- [ ] Backup Firestore/Storage/Auth dipulihkan ke lingkungan uji.

Jangan gunakan data siswa sungguhan sebelum integration test dan UAT kritis lulus.
