# Catatan validasi paket

Tanggal pembuatan: 6 September 2026.

## Berhasil dijalankan

- `node --check` untuk source frontend, backend, tests, CLI, dan konfigurasi Vite.
- Parsing seluruh file JSON konfigurasi.
- Parsing graph module frontend menggunakan esbuild dengan dependency eksternal tidak di-resolve.
- 16 unit test domain: semuanya lulus.
- Visual QA layar login desktop 1440×900 dan mobile 390×844: tidak ada horizontal overflow, overlap, resource gagal, atau console error pada render statis.
- Detail pertemuan siswa telah dirender pada viewport mobile 390×844 tanpa horizontal overflow, overlap, resource gagal, atau console error. Embed Drive tetap memerlukan pengujian dengan file Google yang izin berbagiannya nyata.
- Visual QA desain referensi siswa/pengajar/admin dan layar QR telah dilakukan pada tahap desain sebelumnya.

## Belum dapat dijalankan

`npm install` gagal karena DNS registry npm tidak tersedia (`ENOTFOUND registry.npmjs.org`). Karena itu hal berikut belum divalidasi:

- resolusi versi package dan pembuatan lockfile;
- build Vite dengan library Firebase/qrcode/scanner/marked/DOMPurify asli;
- Firebase emulator integration test;
- runtime Cloud Functions/Admin SDK;
- deployment Firebase;
- scanning kamera pada perangkat nyata;
- load test dan target latensi.

Jalankan semua langkah di README dan `docs/TESTING.md` setelah unzip. Jangan menganggap paket siap produksi sebelum pengujian tersebut lulus.
