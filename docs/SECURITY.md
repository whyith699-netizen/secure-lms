# Catatan keamanan SECURE

- Backend memverifikasi Firebase ID token dengan revocation check, verified email (kecuali emulator), allowlist, dan status akun.
- Admin SDK melewati Security Rules. Semua endpoint harus mempertahankan pemeriksaan role, assignment, membership, dan ownership. Jangan membuka rules untuk mengatasi error konfigurasi.
- Token QR dibuat dengan `crypto.randomBytes(24)`, dikirim melalui HTTPS, tidak disimpan mentah, dan tidak dicatat log. Firestore menyimpan SHA-256 token serta pointer token aktif.
- Generate/revoke/check-in memakai transaksi. Record presensi memakai SHA-256 pasangan JSON `[meetingId, studentId]` untuk anti-duplikasi.
- Respons `ALREADY_RECORDED` hanya mengembalikan record pribadi yang sudah ada; tidak membuat atau memperbarui presensi lewat QR lama.
- Validitas QR dan status terlambat memakai waktu server. Cleanup/TTL bukan pengaman presensi.
- Rate limit dilakukan per UID/action/menit. Tambahkan App Check/WAF jika perlu; rate limit ini bukan perlindungan menyeluruh terhadap serangan terdistribusi.
- Browser tidak menyimpan role/presensi di localStorage untuk otorisasi. Firebase Auth mengelola persistensi sesi; logout setelah memakai perangkat bersama.
- File diunduh melalui backend dengan `attachment` dan `nosniff`. Pemeriksaan signature sederhana bukan antivirus.
- Markdown disanitasi; script, iframe, form interaktif, gambar eksternal, event handler, style, dan atribut data dibatasi.
- CSP mengizinkan layanan Firebase/Auth dan localhost Auth emulator. Sesuaikan dengan domain custom tanpa wildcard/`unsafe-eval` sembarangan.
- Jangan log atau membagikan password, ID token, refresh token, token QR mentah, maupun service account.
- Allowlist membatasi akses **data aplikasi**, tetapi tidak mencegah identitas Firebase Auth dibuat. Untuk Auth benar-benar invite-only, tambahkan Identity Platform blocking function atau provisioning-only flow.
- QR bisa diteruskan selama aktif dan tidak membuktikan lokasi fisik. Tidak ada biometrik/geolokasi.
- Service account operator harus disimpan di luar project dan memakai IAM minimum. Jangan letakkan pada folder Hosting, Git, atau ZIP publik.
- Sebelum produksi: review IAM, dependency advisories, backup/restore, privasi/retensi, App Check, abuse monitoring, dan pengujian otorisasi.

- Embed hanya menerima host/path Google Drive atau Google Slides yang tervalidasi server. Akses file tetap mengikuti izin Google; jangan membagikan materi rahasia sebagai public link.
