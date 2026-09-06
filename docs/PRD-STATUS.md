# Status implementasi terhadap PRD

PRD asli tersimpan di `PRD-reference.md`. Nama lama di dokumen historis mungkin masih CodeClub; instruksi terbaru menggunakan **SECURE** dan admin hanya boleh menambahkan email.

## Sudah diimplementasikan dalam source

- Firebase Authentication: login, aktivasi akun, verifikasi email, reset password, logout, dan pencabutan sesi seluruh perangkat.
- Allowlist email dan status akun diperiksa backend pada setiap permintaan.
- Admin hanya memiliki endpoint/form tambah email; format dan duplikasi diperiksa server.
- Kelas berdasarkan membership siswa atau assignment pengajar.
- Materi Markdown: draft, published, archived, tautan HTTPS, embed Google Drive/Slides tervalidasi, serta lampiran PDF/PNG/JPEG/TXT/ZIP maksimal 20 MB.
- Profil bio dan GitHub; identitas resmi dikelola operator CLI.
- Pertemuan, detail materi tertaut, pengelolaan detail/jadwal, jendela presensi, batas terlambat, dan snapshot peserta.
- QR acak unik setiap generate, hash token di Firestore, regenerate atomik, TTL 30–300 detik.
- Scanner kamera dan check-in ke backend.
- Satu record per siswa–pertemuan melalui ID deterministik dan transaksi Firestore.
- Rekap per pertemuan, koreksi beralasan, audit, finalisasi tidak hadir, CSV final, serta riwayat pribadi.
- Scheduled function untuk penutupan/finalisasi dan cleanup terbatas.
- Backend-only Firestore/Storage rules, validasi akses, rate limiting per UID, sanitasi Markdown, dan perlindungan CSV injection.

Fitur di atas sudah ditulis dalam source tetapi belum seluruhnya diverifikasi end-to-end karena npm/Firebase emulator tidak tersedia saat paket dibuat.

## Harus Anda konfigurasi manual

- Firebase project/Web App, Email/Password Auth, authorized domains, template email, Firestore, Storage, billing, region, IAM, Functions, indexes, Hosting/domain.
- Admin pertama, role pengajar, kelas, identitas resmi, dan membership melalui `scripts/manage.mjs`.
- Install dependency, review versi/security advisory, pembuatan `package-lock.json`, build, emulator test, UAT, load test, dan deploy.
- Backup/export/restore Firestore, Storage, dan Auth; monitoring, budget alert, retensi, penghapusan data, serta kebijakan privasi sekolah.

## Belum tersedia atau belum setara penuh dengan PRD

1. Foto/avatar profil—masih berupa inisial.
2. UI kelola role, kelas, akun, dan membership—sengaja tidak ada di admin; tindakan pokok tersedia lewat CLI. Belum ada impor CSV massal.
3. Pembatalan/penghapusan pertemuan belum tersedia. Edit detail/jadwal tersedia; jadwal dikunci setelah sesi presensi dibuat.
4. Rekap agregat lintas pertemuan, filter rentang/status/siswa, dan persentase periode. CSV saat ini per pertemuan.
5. Progress membaca materi, modul bertingkat, dan pengurutan manual.
6. Pencarian server/full-text; pencarian UI hanya pada judul materi yang sudah dimuat.
7. Editor WYSIWYG; implementasi memakai Markdown. ZIP hanya diunduh, tidak diekstrak/dieksekusi.
8. Hapus lampiran, cleanup file orphan menyeluruh, serta workflow hapus akun/data berdasarkan retensi.
9. UI audit log; audit hanya tersimpan dan diperiksa operator melalui Console/alat tepercaya.
10. App Check, antivirus upload, dan blok signup sebelum identitas Auth tercipta. Allowlist tetap mencegah akses data aplikasi, tetapi pengguna belum diizinkan masih dapat menciptakan identitas Firebase Auth.
11. Unique reservation nomor siswa dan sinkronisasi identitas otomatis. Perubahan nama tidak mengubah snapshot historis.
12. Snapshot bertahap untuk >200 peserta dan pagination untuk >100 kelas. Versi ini sengaja menolak skala tersebut.
13. Rotasi QR otomatis, mode presentasi layar penuh, dan pemilih perangkat kamera eksplisit.
14. Pengumuman, notifikasi, tugas coding, penilaian, dan integrasi GitHub (fitur P1).
15. Presensi offline, geolokasi, biometrik, dan aplikasi mobile native (di luar cakupan).
16. Backup harian otomatis, restore otomatis, serta bukti target performa/latensi—harus dikonfigurasi dan diuji.

## Perbedaan teknis yang disengaja

- Frontend menggunakan Vite + JavaScript, bukan Next.js; tidak membutuhkan SSR.
- Browser hanya memakai Firebase Auth SDK. Seluruh data/file melewati backend; rules menolak akses langsung.
- Admin menambah email ke `allowedEmails/{sha256(email)}`; role tetap di `users/{uid}` dan tidak dapat dipilih pengguna.
- Snapshot maksimal 200 peserta dibuat dalam satu transaksi, bukan proses chunked `preparing`.
- Waktu disimpan UTC; UI mengikuti zona perangkat, bukan memaksa Asia/Jakarta.
- Koreksi manual hadir/terlambat tidak mengarang waktu check-in.
- Admin tidak dapat melihat seluruh daftar email dari UI; hanya email yang baru ditambahkan pada sesi UI.

## Prioritas tindak lanjut

1. Jalankan install, build, integration test emulator, dan UAT.
2. Uji dua HP nyata untuk generate/scan, regenerate, kedaluwarsa, dan koneksi terputus.
3. Review authorization/IAM, backup, privasi, biaya, serta keamanan signup/upload.
4. Tambahkan fitur wajib dari daftar kekurangan sebelum memperluas pilot.
