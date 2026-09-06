# PRD — Web LMS Ekstrakurikuler Coding

- **Nama produk sementara:** CodeClub LMS
- **Versi dokumen:** 1.1 — Draft dengan Firebase
- **Tanggal:** 5 September 2026
- **Platform:** Web responsif, dioptimalkan untuk HP dan desktop
- **Status:** Usulan kebutuhan MVP untuk divalidasi sebelum pengembangan

## 1. Ringkasan produk

CodeClub LMS adalah aplikasi web untuk mengelola kegiatan ekstrakurikuler coding. Pengajar dapat mengunggah materi, mengatur pertemuan, membuat QR Code presensi, dan melihat rekap kehadiran. Siswa dapat mengakses materi, mengelola profil, memindai QR Code, dan melihat riwayat kehadiran pribadi.

**Prioritas utama produk adalah presensi menggunakan QR Code yang hanya dapat dibuat oleh pengajar berwenang dan selalu berbeda setiap kali di-generate.** QR Code terhubung ke satu pertemuan, memiliki masa berlaku, dan diverifikasi oleh server sebelum presensi dicatat.

Dalam dokumen ini, istilah “barcode” pada kebutuhan awal diimplementasikan sebagai **QR Code dua dimensi**, karena sesuai untuk pemindaian melalui kamera HP.

## 2. Masalah yang ingin diselesaikan

1. Materi coding tersebar di chat atau penyimpanan yang tidak terstruktur.
2. Presensi manual menghabiskan waktu dan rentan salah pencatatan.
3. Pengajar kesulitan melihat kehadiran siswa per pertemuan maupun per periode.
4. Siswa belum memiliki satu tempat untuk mengakses materi, profil, dan riwayat kehadiran.
5. Barcode statis berpotensi digunakan kembali di luar pertemuan yang semestinya.

## 3. Tujuan dan indikator keberhasilan

### 3.1 Tujuan

- Menyediakan pusat materi pembelajaran ekstrakurikuler coding.
- Mempercepat pencatatan presensi tanpa instalasi aplikasi.
- Memastikan QR Code unik pada setiap generate, terbatas masa berlakunya, dan hanya diterbitkan pengajar berwenang.
- Menyediakan rekap kehadiran yang dapat ditinjau dan dikoreksi secara terkontrol.
- Menyediakan profil dan riwayat kehadiran pribadi untuk siswa.

### 3.2 Target awal untuk validasi pilot

Angka berikut adalah target usulan, bukan hasil pengukuran.

| Indikator | Target awal | Cara mengukur |
|---|---|---|
| Keberhasilan presensi valid | ≥ 95% permintaan valid berhasil | Log hasil validasi server, tidak termasuk QR salah/kedaluwarsa |
| Kecepatan konfirmasi presensi | p95 ≤ 3 detik setelah QR terbaca | Waktu kirim permintaan hingga respons pada jaringan normal |
| Presensi ganda | 0 record ganda per siswa per pertemuan | Pemeriksaan constraint dan audit database |
| Penolakan QR tidak aktif | 100% pada pengujian | Uji QR kedaluwarsa, dicabut, dan milik sesi tertutup |
| Kemudahan pengajar | Generate QR dalam ≤ 3 langkah setelah membuka pertemuan | Uji penggunaan dengan pengajar |

## 4. Pengguna dan hak akses

### 4.1 Siswa

- Masuk ke akun yang terdaftar.
- Melihat kelas ekstrakurikuler yang diikuti.
- Membaca dan mengunduh materi yang sudah diterbitkan.
- Mengelola profil pribadi sesuai kolom yang diizinkan.
- Melakukan presensi melalui pemindaian QR Code.
- Melihat riwayat kehadiran pribadi.

### 4.2 Pengajar

- Mengelola kelas yang menjadi tanggung jawabnya.
- Menulis, mengunggah, mengedit, menerbitkan, dan mengarsipkan materi.
- Membuat pertemuan, membuka presensi, generate dan regenerate QR Code.
- Melihat daftar kehadiran dan mengekspor rekap kelasnya.
- Mengoreksi presensi dengan alasan yang tercatat.

### 4.3 Admin

- Mengelola akun, penetapan peran, kelas, dan keanggotaan.
- Menonaktifkan akun dan memindahkan penugasan pengajar.
- Mengakses rekap organisasi sesuai kebijakan sekolah.
- Mengakses catatan audit sesuai kewenangannya.

**Batas penting:** admin tidak otomatis memiliki hak generate QR. Endpoint generate QR memerlukan peran pengajar dan penugasan aktif pada kelas tersebut. Jika seseorang merangkap admin dan pengajar, kewenangan generate berasal dari penugasannya sebagai pengajar.

## 5. Asumsi dan keputusan awal

Keputusan berikut merupakan usulan desain agar MVP dapat diimplementasikan tanpa menunggu seluruh detail operasional sekolah.

1. MVP digunakan oleh satu sekolah/organisasi, dengan satu atau beberapa kelas ekstrakurikuler coding.
2. Akun dan keanggotaan siswa dikelola admin; pendaftaran publik belum tersedia.
3. Presensi memerlukan akun siswa aktif dan koneksi internet.
4. Pengajar menampilkan QR melalui laptop, proyektor, atau HP; siswa memindainya melalui web.
5. Setiap pertemuan memiliki satu sesi presensi dengan maksimal satu QR aktif pada satu waktu.
6. QR berlaku **60 detik secara default**; pengajar dapat memilih 30–300 detik sebelum generate.
7. Generate ulang menghasilkan token baru dan langsung mencabut token lama. Record kehadiran yang sudah berhasil tidak terhapus.
8. Satu QR aktif dapat digunakan oleh banyak siswa yang memenuhi syarat. Token bukan sekali pakai secara global; pembatasan satu kali berlaku untuk pasangan siswa–pertemuan.
9. Presensi otomatis hanya mencatat hadir atau terlambat. Status izin dan sakit dimasukkan pengajar.
10. Geolokasi, biometrik, dan pengenalan wajah tidak termasuk MVP.
11. Waktu acuan adalah waktu server; zona waktu organisasi default Asia/Jakarta.

## 6. Ruang lingkup

### 6.1 MVP / P0 — wajib tersedia

- Login, logout, pemulihan akses, dan pembatasan akses berdasarkan peran.
- Pengelolaan akun, penugasan pengajar, serta keanggotaan siswa.
- Profil siswa dan pengajar.
- Pengelolaan kelas dan pertemuan.
- LMS sederhana: materi teks, file, dan tautan.
- Presensi QR Code unik, kedaluwarsa, dan regenerate oleh pengajar.
- Validasi server, pencegahan duplikasi, dan konfirmasi hasil presensi.
- Riwayat kehadiran siswa, rekap pengajar, dan ekspor CSV.
- Koreksi presensi oleh pengajar disertai alasan dan audit.
- Antarmuka responsif untuk HP.

### 6.2 P1 — setelah MVP stabil

- Rotasi QR otomatis tanpa tombol regenerate manual.
- Pengumuman dan notifikasi kegiatan.
- Tugas coding dan pengumpulan tautan GitHub/file.
- Penilaian serta catatan umpan balik pengajar.
- Indikator progres membaca materi.
- Impor massal siswa dari CSV.

### 6.3 Di luar ruang lingkup awal

- Eksekusi kode di server, IDE online, dan penilaian kode otomatis.
- Video conference atau live streaming bawaan.
- Aplikasi Android/iOS native.
- Pembayaran atau iuran.
- Presensi offline.
- Pengenalan wajah dan pelacakan lokasi terus-menerus.
- Platform multi-sekolah dengan isolasi tenant dan billing.

## 7. Alur utama pengguna

### 7.1 Pengajar menambahkan materi

1. Pengajar login dan memilih kelas yang diajar.
2. Pengajar membuka menu Materi dan membuat draft.
3. Pengajar mengisi judul, ringkasan, topik, dan isi materi.
4. Pengajar dapat menambahkan lampiran atau tautan referensi.
5. Pengajar melakukan pratinjau lalu menerbitkan materi.
6. Materi muncul untuk siswa aktif di kelas tersebut.

### 7.2 Pengajar membuka presensi

1. Pengajar memilih pertemuan yang akan berlangsung.
2. Pengajar memeriksa waktu buka, waktu tutup, dan batas terlambat.
3. Pengajar menekan **Buka Presensi**, lalu **Generate QR**.
4. Server membuat token unik dan mengembalikan QR beserta waktu kedaluwarsa.
5. Pengajar menampilkan QR dan penghitung waktu pada layar.
6. Pengajar dapat menekan **Generate Ulang**; QR sebelumnya langsung tidak berlaku.
7. Pengajar melihat jumlah siswa yang hadir dan menutup presensi setelah selesai.

### 7.3 Siswa melakukan presensi

1. Siswa login dan memilih **Scan Presensi**.
2. Browser meminta izin kamera; kamera belakang diprioritaskan jika tersedia.
3. Siswa memindai QR yang ditampilkan pengajar.
4. Aplikasi mengirim token melalui koneksi HTTPS ke server.
5. Server memvalidasi akun, keanggotaan, token, sesi, dan waktu.
6. Jika valid, server mencatat kehadiran secara atomik.
7. Aplikasi menampilkan nama kelas, pertemuan, waktu tercatat, dan status kehadiran.
8. Jika siswa sudah melakukan presensi, aplikasi menampilkan record sebelumnya tanpa membuat duplikasi.

### 7.4 Kamera atau perangkat tidak tersedia

1. Aplikasi menjelaskan kegagalan dan cara mengaktifkan izin kamera.
2. Siswa dapat mencoba ulang atau mengganti kamera.
3. Jika tetap gagal/tidak memiliki perangkat, siswa meminta pengajar mencatat presensi manual.
4. Pengajar memverifikasi siswa, memilih status, dan mengisi alasan.
5. Sistem menandai sumber pencatatan sebagai manual dan menyimpan audit.

Tidak tersedia kode cadangan publik yang bisa diketik seluruh siswa pada MVP, untuk menghindari jalur presensi yang mudah dibagikan.

## 8. Kebutuhan fungsional

### 8.1 Autentikasi dan akun

| ID | Kebutuhan | Kriteria penerimaan |
|---|---|---|
| AUTH-01 | Login menggunakan email atau ID akun dan password | Akun aktif dengan kredensial benar dapat masuk; kegagalan tidak membocorkan keberadaan akun |
| AUTH-02 | Pembatasan akses berdasarkan peran dan kelas | Server menolak setiap operasi di luar kewenangan, meskipun URL atau request dimodifikasi |
| AUTH-03 | Logout dan sesi aman | Logout mencabut sesi terkait; sesi kedaluwarsa meminta login ulang |
| AUTH-04 | Pemulihan akses | Tersedia reset terverifikasi; token reset memiliki masa berlaku dan hanya dapat digunakan sekali |
| AUTH-05 | Pengelolaan akun oleh admin | Admin dapat mengundang/membuat dan menonaktifkan akun tanpa melihat password pengguna |

### 8.2 Profil

| ID | Kebutuhan | Kriteria penerimaan |
|---|---|---|
| PROF-01 | Profil siswa | Memuat nama, ID siswa, kelas sekolah, foto opsional, bio singkat, serta tautan GitHub opsional |
| PROF-02 | Profil pengajar | Memuat nama, foto opsional, bio, dan kelas yang diajar |
| PROF-03 | Pembaruan profil | Pengguna hanya dapat mengedit foto, bio, dan tautan pribadi; identitas resmi diubah admin |
| PROF-04 | Privasi profil | Siswa tidak dapat mengakses data akun maupun riwayat presensi siswa lain |

### 8.3 Kelas dan pertemuan

| ID | Kebutuhan | Kriteria penerimaan |
|---|---|---|
| CLS-01 | Kelola kelas | Admin dapat membuat kelas dengan nama, deskripsi, periode, dan pengajar |
| CLS-02 | Kelola keanggotaan | Hanya siswa dengan keanggotaan aktif yang dapat mengakses materi dan melakukan presensi |
| CLS-03 | Kelola pertemuan | Pengajar kelas dapat membuat pertemuan dengan judul, tanggal, jam mulai/selesai, dan topik |
| CLS-04 | Pengaturan sesi presensi | Waktu buka ≤ batas terlambat < waktu tutup; konfigurasi tidak valid ditolak |
| CLS-05 | Arsip kelas | Data historis tetap tersimpan; kelas yang diarsipkan tidak menerima materi atau presensi baru |

### 8.4 Materi pembelajaran

| ID | Kebutuhan | Kriteria penerimaan |
|---|---|---|
| LMS-01 | Buat/edit materi | Pengajar dapat menyimpan judul, ringkasan, isi teks berformat, dan blok kode |
| LMS-02 | Lampiran | Mendukung PDF, PNG/JPG, TXT, dan ZIP maksimal 20 MB per file; ZIP hanya diunduh, tidak dieksekusi server |
| LMS-03 | Tautan referensi | Mendukung URL HTTPS untuk video, dokumentasi, atau repository; skema berbahaya ditolak |
| LMS-04 | Status materi | Draft hanya terlihat pengajar berwenang; published terlihat siswa aktif; archived tidak tampil di daftar aktif |
| LMS-05 | Organisasi materi | Materi dapat dikelompokkan berdasarkan topik/modul dan diurutkan pengajar |
| LMS-06 | Pencarian | Siswa dapat mencari judul materi dalam kelas yang diikuti |
| LMS-07 | Akses file terlindungi | File tidak tersedia secara publik; otorisasi diperiksa sebelum akses atau pembuatan URL unduhan sementara |

### 8.5 Presensi QR Code — fitur prioritas tertinggi

| ID | Kebutuhan | Kriteria penerimaan |
|---|---|---|
| ATT-01 | Generate hanya oleh pengajar kelas | Siswa, admin tanpa penugasan pengajar, dan pengajar kelas lain ditolak oleh server |
| ATT-02 | QR berbeda setiap generate | Setiap generate menghasilkan token acak baru; tidak memakai ulang token lama atau hanya mengganti gambar QR |
| ATT-03 | QR terikat pertemuan | Token hanya berlaku untuk sesi/pertemuan yang ditentukan server |
| ATT-04 | Masa berlaku | QR tidak dapat digunakan ketika waktu server mencapai/melewati expires_at |
| ATT-05 | Satu QR aktif | Regenerate mengaktifkan token baru dan mencabut token sebelumnya dalam satu transaksi |
| ATT-06 | Pemindaian web | Scanner dapat menggunakan kamera pada browser yang didukung setelah izin diberikan |
| ATT-07 | Login dan keanggotaan | Hanya siswa aktif yang menjadi anggota aktif kelas yang dapat melakukan presensi |
| ATT-08 | Anti-duplikasi | Database menyimpan maksimal satu record per siswa per pertemuan, termasuk saat request paralel |
| ATT-09 | Status otomatis | Scan valid hingga batas terlambat dicatat hadir; setelah batas tersebut dan sebelum sesi tutup dicatat terlambat |
| ATT-10 | Tutup sesi | Penutupan sesi segera menolak scan baru dan mencabut QR aktif |
| ATT-11 | Konfirmasi jelas | Hasil membedakan berhasil, sudah tercatat, QR tidak aktif, sesi tutup, akses ditolak, dan gangguan jaringan |
| ATT-12 | Koreksi manual | Pengajar dapat menambah/mengubah status dengan alasan wajib dan audit nilai lama–baru |
| ATT-13 | Daftar kehadiran pengajar | Jumlah dan daftar kehadiran diperbarui maksimal 5 detik sekali ketika halaman aktif |
| ATT-14 | Siswa belum hadir | Saat sesi ditutup, peserta yang belum memiliki record diberi status tidak hadir berdasarkan daftar peserta pertemuan |

### 8.6 Rekap dan riwayat

- Pengajar dapat memfilter rekap berdasarkan kelas, pertemuan, rentang tanggal, siswa, dan status.
- Siswa hanya dapat melihat riwayat pribadi, termasuk koreksi terbaru.
- Status akhir: **hadir, terlambat, izin, sakit, tidak hadir**. Sebelum sesi ditutup, peserta tanpa record ditampilkan sebagai **belum presensi**, bukan tidak hadir.
- Ekspor CSV memuat kelas, pertemuan, tanggal, ID siswa, nama, status, waktu check-in jika ada, dan sumber pencatatan.
- Ekspor hanya mencakup kelas yang dapat diakses pengguna; data pribadi yang tidak relevan tidak disertakan.
- Daftar peserta pertemuan disalin dari keanggotaan aktif ketika sesi pertama kali dibuka. Perubahan keanggotaan berikutnya tidak mengubah rekap historis secara diam-diam.

## 9. Aturan dan desain keamanan QR

### 9.1 Isi QR

QR berisi payload ringkas yang dapat dikenali aplikasi, misalnya penanda versi dan **token acak opaque**. QR tidak memuat nama siswa, email, password, atau data pribadi.

Rekomendasi teknis:

- Token dibuat menggunakan cryptographically secure random generator, dengan minimal 128 bit entropi.
- Token mentah hanya dikirim melalui HTTPS untuk ditampilkan/dipindai; database menyimpan hash token.
- Token mentah tidak dicatat di log aplikasi, analytics, maupun URL query string.
- Siswa memindai QR dari dalam aplikasi. Membaca QR tidak otomatis mencatat kehadiran melalui permintaan GET.
- Token dikirim sebagai payload POST ke endpoint check-in; server menentukan sesi berdasarkan token, bukan mempercayai session_id dari klien.
- Tampilan hitung mundur menggunakan expires_at dari server; jam HP tidak menentukan validitas.

### 9.2 Siklus hidup

1. Pengajar membuka sesi: `scheduled → open`.
2. Generate awal menerbitkan QR aktif dengan `expires_at`.
3. Regenerate mencabut QR aktif lama dan menerbitkan QR baru.
4. Kedaluwarsa menonaktifkan token tanpa harus menunggu pembersihan database.
5. Sesi ditutup secara manual atau mencapai waktu tutup: `open → closed`; seluruh token ditolak.
6. MVP tidak mendukung membuka ulang sesi tertutup. Koreksi setelah penutupan melalui pencatatan manual yang diaudit.

### 9.3 Validasi server saat check-in

Server harus memeriksa:

1. Sesi login dan peran siswa valid; akun tidak dinonaktifkan.
2. Permintaan memenuhi kebijakan rate limit.
3. Format token valid dan hash token dikenal.
4. Token adalah token aktif terbaru, belum dicabut, dan belum kedaluwarsa.
5. Sesi presensi terbuka serta waktu server berada dalam jendela presensi.
6. Siswa termasuk peserta pertemuan dan masih memiliki keanggotaan aktif.
7. Belum ada record kehadiran untuk pasangan siswa–pertemuan.
8. Jika valid, kehadiran disimpan dalam transaksi; retry tidak membuat record baru.

Jika record siswa sudah ada, respons hanya menampilkan record milik siswa tersebut dan tidak mengubah statusnya. Status izin/sakit/manual tidak ditimpa otomatis oleh pemindaian.

### 9.4 Kondisi bersamaan dan retry

- Regenerate, penutupan sesi, dan check-in harus menggunakan mekanisme transaksi/locking yang konsisten pada sesi terkait.
- Jika check-in selesai lebih dahulu daripada pencabutan, record tetap sah.
- Jika pencabutan selesai lebih dahulu, check-in menggunakan token lama ditolak.
- Dua pengajar yang menekan generate bersamaan tidak boleh menghasilkan dua QR aktif. QR terbaru menurut urutan commit menjadi satu-satunya QR aktif.
- Keunikan siswa–pertemuan wajib diterapkan melalui ID dokumen deterministik dan transaksi Firestore; jangan mengandalkan pemeriksaan di frontend.
- Jika koneksi terputus setelah server menyimpan presensi, aplikasi memeriksa riwayat/hasil presensi pribadi sebelum meminta scan ulang.
- Kedaluwarsa token tidak menghapus presensi yang telah tersimpan.

### 9.5 Batas perlindungan

**QR dinamis mengurangi penggunaan ulang QR lama, tetapi tidak membuktikan siswa berada di lokasi.** Screenshot atau token masih dapat diteruskan kepada siswa lain selama masa berlakunya.

Mitigasi MVP: TTL pendek, regenerate manual, akun wajib login, pembatasan keanggotaan, serta pengawasan pengajar. Validasi jaringan/lokasi dapat dievaluasi kemudian dengan mempertimbangkan akurasi dan privasi; bukan jaminan anti-titip-absen.

## 10. Halaman dan komponen antarmuka

### 10.1 Siswa

- **Login dan pemulihan akses.**
- **Dashboard:** kelas yang diikuti, materi terbaru, pertemuan terdekat, tombol utama Scan Presensi.
- **Daftar/detail materi:** pencarian, filter topik, isi materi, lampiran, tautan.
- **Scan Presensi:** preview kamera, panduan posisi QR, pilihan kamera, status izin, dan hasil scan.
- **Riwayat kehadiran:** daftar pertemuan, status, dan waktu tercatat.
- **Profil saya:** identitas dan kolom yang dapat diedit.

### 10.2 Pengajar

- **Dashboard pengajar:** kelas, pertemuan hari ini, dan akses cepat ke presensi.
- **Kelola materi:** daftar, editor, pratinjau, dan status publikasi.
- **Detail pertemuan:** jadwal, pengaturan sesi, dan peserta.
- **Layar QR:** QR berukuran besar, kelas/pertemuan, countdown, indikator aktif, Generate Ulang, dan Tutup Presensi.
- **Rekap presensi:** filter, daftar siswa, koreksi manual, dan ekspor CSV.
- **Profil saya.**

### 10.3 Admin

- Pengelolaan pengguna dan peran.
- Pengelolaan kelas, keanggotaan siswa, serta penugasan pengajar.
- Audit perubahan sensitif.

### 10.4 Prinsip UX

- Tombol Scan Presensi mudah dijangkau pada HP.
- Status tidak dibedakan hanya melalui warna; sertakan teks dan ikon.
- QR memiliki kontras tinggi, area kosong di sekelilingnya, dan mode tampilan besar.
- QR kedaluwarsa tidak terus ditampilkan seolah masih aktif.
- Setelah berhasil, pemindai dihentikan sementara agar tidak mengirim permintaan berulang.
- Kamera dihentikan ketika pengguna keluar dari halaman.
- Pesan kegagalan menjelaskan tindakan berikutnya tanpa menampilkan detail keamanan internal.

## 11. Model data konseptual

| Entitas | Kolom utama | Catatan |
|---|---|---|
| User | uid, email, name, active, created_at | Kredensial dikelola Firebase Authentication; password/hash tidak disimpan di Firestore |
| UserRole | user_id, role | Mendukung peran rangkap yang diberikan admin |
| Profile | user_id, student_number, school_class, avatar_key, bio, github_url | Kolom siswa opsional untuk pengajar |
| ClubClass | id, name, description, period, timezone, archived_at | Kelas ekstrakurikuler |
| TeachingAssignment | class_id, teacher_id, active | Dasar otorisasi pengajar kelas |
| Enrollment | class_id, student_id, active, joined_at, ended_at | Keanggotaan siswa |
| Material | id, class_id, author_id, title, body, topic, sort_order, status, published_at | Materi LMS |
| MaterialAttachment | id, material_id, storage_key, original_name, mime_type, size | File privat |
| Meeting | id, class_id, title, starts_at, ends_at | Pertemuan pembelajaran |
| MeetingParticipant | meeting_id, student_id, enrolled_at_snapshot | Snapshot peserta untuk konsistensi rekap |
| AttendanceSession | id, meeting_id, opens_at, closes_at, late_after, state, active_token_id | Maksimal satu sesi per pertemuan pada MVP |
| QRToken | id, session_id, token_hash, generated_by, created_at, expires_at, revoked_at | Token baru untuk setiap generate |
| Attendance | id, meeting_id, student_id, status, checked_in_at, source, token_id, recorded_by | Satu record per siswa per pertemuan; token_id opsional untuk manual |
| AuditLog | id, actor_id, action, entity_type, entity_id, old_value, new_value, reason, created_at | Audit generate, penutupan, koreksi, dan perubahan akses |

### Constraint penting

- Email login dikelola Firebase Authentication. Keunikan relasi kelas–siswa, kelas–pengajar, serta pertemuan–siswa diterapkan menggunakan path/ID dokumen deterministik dan transaksi Firestore.
- ID dokumen sesi sama dengan ID pertemuan. Hash token menjadi ID dokumen token; hanya satu token aktif yang ditunjuk sesi. Firestore tidak menyediakan unique constraint atau foreign key seperti database SQL.
- Simpan timestamp dalam UTC dan tampilkan sesuai zona waktu organisasi.
- `checked_in_at` kosong untuk tidak hadir/izin/sakit yang tidak berasal dari check-in.
- Penonaktifan akun atau pengarsipan kelas tidak menghapus record historis secara otomatis.

## 12. Usulan antarmuka API

Bagian ini adalah panduan implementasi, bukan kewajiban menggunakan framework tertentu. Seluruh endpoint memerlukan autentikasi kecuali login dan alur pemulihan akses.

| Method | Endpoint | Fungsi | Otorisasi |
|---|---|---|---|
| POST | `/auth/login` | Login | Publik, dengan rate limit |
| POST | `/auth/logout` | Logout | Pengguna login |
| GET/PATCH | `/me` | Baca/edit profil sendiri | Pengguna login, field allowlist |
| GET | `/classes` | Daftar kelas yang dapat diakses | Sesuai peran/keanggotaan |
| GET | `/classes/:id/materials` | Daftar materi | Anggota aktif/pengajar kelas |
| POST | `/classes/:id/materials` | Membuat materi | Pengajar kelas |
| PATCH | `/materials/:id` | Edit/publish/arsip materi | Pengajar kelas |
| POST | `/classes/:id/meetings` | Membuat pertemuan | Pengajar kelas |
| POST | `/meetings/:id/attendance/open` | Membuka sesi dan snapshot peserta | Pengajar kelas |
| POST | `/attendance-sessions/:id/qr` | Generate atau regenerate QR | Pengajar kelas |
| POST | `/attendance/check-in` | Memvalidasi token dan mencatat presensi | Siswa peserta |
| POST | `/attendance-sessions/:id/close` | Menutup sesi | Pengajar kelas |
| GET | `/meetings/:id/attendance` | Daftar kehadiran | Pengajar kelas/admin berwenang |
| PATCH | `/meetings/:id/attendance/:studentId` | Koreksi atau catat manual | Pengajar kelas, alasan wajib |
| GET | `/me/attendance` | Riwayat pribadi | Siswa pemilik akun |
| GET | `/classes/:id/attendance/export` | Ekspor CSV | Pengajar kelas/admin berwenang |

Kategori respons check-in yang perlu didukung: `SUCCESS`, `ALREADY_RECORDED`, `QR_INVALID_OR_EXPIRED`, `SESSION_CLOSED`, `NOT_ELIGIBLE`, dan `RATE_LIMITED`. Gangguan jaringan ditangani klien sebagai status belum terkonfirmasi, bukan langsung dianggap gagal presensi.

## 13. Kebutuhan nonfungsional

### 13.1 Keamanan

- Seluruh komunikasi menggunakan HTTPS; akses kamera web memerlukan secure context.
- Password dan proses autentikasi dikelola Firebase Authentication. Aplikasi tidak menyimpan password maupun hash password sendiri di Firestore.
- Gunakan cookie sesi Secure, HttpOnly, dan kebijakan SameSite yang sesuai; sertakan perlindungan CSRF untuk sesi berbasis cookie.
- Validasi otorisasi di server pada setiap akses data dan file; menyembunyikan tombol saja tidak cukup.
- Terapkan rate limit login, reset akses, generate QR, dan check-in tanpa memblokir seluruh siswa yang memakai satu jaringan sekolah secara tidak sengaja.
- Sanitasi materi berformat dan validasi tipe/ukuran file. File unggahan tidak boleh dieksekusi server.
- Lindungi ekspor CSV dari formula injection pada input pengguna.
- Catatan audit tidak dapat diubah oleh pengajar melalui aplikasi.

### 13.2 Performa dan keandalan

- Asumsi pilot: hingga 300 siswa terdaftar dan 100 pengguna aktif bersamaan; validasi ulang sesuai skala sekolah.
- Uji beban awal: 100 check-in dalam 60 detik tanpa duplikasi dan dengan target p95 respons ≤ 3 detik di lingkungan uji yang disepakati.
- Penutupan otomatis dijalankan dengan job terjadwal; validasi waktu sesi tetap dilakukan pada setiap request sehingga keamanan tidak bergantung pada job.
- Backup database harian dan uji pemulihan sebelum pilot.
- Retry aman untuk permintaan check-in; jangan menyatakan presensi berhasil sebelum server mengonfirmasi.

### 13.3 Kompatibilitas dan aksesibilitas

- Target pengujian: Chrome Android dan Safari iOS versi stabil saat pengujian serta satu versi mayor sebelumnya; desktop Chrome/Edge untuk pengajar.
- Layout tetap dapat digunakan pada lebar layar 360 px.
- Form memiliki label, fokus keyboard terlihat, dan teks status dapat dibaca pembaca layar.
- Sediakan fallback presensi manual oleh pengajar untuk masalah perangkat, kamera, atau aksesibilitas.

### 13.4 Privasi dan operasional

- Kumpulkan data minimum untuk pembelajaran dan presensi; foto profil bersifat opsional.
- Kamera diproses di perangkat untuk membaca QR; aplikasi tidak menyimpan atau mengunggah foto/video kamera siswa.
- Tidak mengumpulkan lokasi, biometrik, maupun fingerprint perangkat pada MVP.
- Sekolah harus menetapkan pemberitahuan privasi, dasar pemrosesan data, serta persetujuan orang tua/wali apabila diwajibkan.
- Kebijakan retensi, penghapusan data, dan retensi backup harus disepakati sebelum penggunaan produksi.
- Log error tidak memuat password, token mentah, isi kamera, atau data pribadi yang tidak diperlukan.

## 14. Skenario pengujian penerimaan utama

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| UAT-01 | Pengajar kelas generate QR pertama | QR aktif terbit dengan expires_at dan identitas pertemuan di layar |
| UAT-02 | Pengajar generate ulang | Token baru berbeda; token sebelumnya langsung ditolak |
| UAT-03 | Siswa memanggil endpoint generate secara langsung | Ditolak tanpa menerbitkan token |
| UAT-04 | Pengajar kelas lain mencoba generate | Ditolak |
| UAT-05 | Siswa aktif memindai QR valid sebelum batas terlambat | Satu record hadir tersimpan dan konfirmasi tampil |
| UAT-06 | Siswa memindai QR sama berulang/dua request paralel | Tetap satu record; retry menampilkan hasil sebelumnya |
| UAT-07 | Dua siswa berbeda memindai QR aktif yang sama | Keduanya dapat tercatat, masing-masing satu record |
| UAT-08 | QR dipindai tepat saat atau setelah expires_at | Ditolak sebagai QR tidak aktif |
| UAT-09 | Scan setelah batas terlambat tetapi sebelum tutup | Tercatat terlambat |
| UAT-10 | Scan tepat saat/setelah closes_at atau setelah tutup manual | Ditolak, meskipun gambar QR masih terlihat |
| UAT-11 | Siswa nonanggota/akun nonaktif mencoba check-in | Ditolak tanpa perubahan record |
| UAT-12 | Kamera tidak diizinkan | Ada petunjuk pemulihan dan opsi meminta pencatatan manual |
| UAT-13 | Koneksi terputus setelah penyimpanan | Pemeriksaan ulang menunjukkan record yang sudah ada; tidak duplikat |
| UAT-14 | Regenerate dan check-in bersamaan | Hasil mengikuti urutan transaksi; token yang telah dicabut tidak dapat mencatat presensi baru |
| UAT-15 | Dua pengajar regenerate bersamaan | Hanya satu QR aktif setelah kedua transaksi selesai |
| UAT-16 | Pengajar mengoreksi kehadiran | Alasan, pelaku, waktu, nilai lama, dan nilai baru tercatat |
| UAT-17 | Siswa membuka URL materi draft/file kelas lain | Server menolak akses |
| UAT-18 | Sesi ditutup dengan sebagian siswa belum scan | Peserta tanpa record menjadi tidak hadir; izin/sakit yang ada tidak tertimpa |
| UAT-19 | Jam HP siswa diubah | Keputusan presensi tetap berdasarkan waktu server |
| UAT-20 | Token dimodifikasi atau payload QR bukan milik aplikasi | Ditolak dengan pesan aman dan tanpa error tak tertangani |

## 15. Arsitektur teknis berbasis Firebase

Keputusan database untuk PRD ini: **Firebase Cloud Firestore**, bukan PostgreSQL atau Firebase Realtime Database.

- **Frontend:** Next.js/React dengan UI responsif dan scanner QR berbasis kamera browser.
- **Autentikasi:** Firebase Authentication. MVP menggunakan email dan password; ID siswa menjadi identitas profil, bukan metode login terpisah. Login menggunakan ID siswa memerlukan desain tambahan dan tidak termasuk implementasi awal.
- **Database utama:** Cloud Firestore untuk akun aplikasi, kelas, materi, pertemuan, sesi, token, presensi, dan audit.
- **Backend tepercaya:** Cloud Functions for Firebase berbasis HTTPS untuk menjalankan API pada bagian 12, memverifikasi Firebase ID token, melakukan otorisasi, dan menjalankan transaksi menggunakan Admin SDK.
- **File:** Cloud Storage for Firebase untuk lampiran materi dan foto profil; Firestore hanya menyimpan metadata/path file.
- **Hosting:** Firebase Hosting untuk hasil build statis jika frontend diekspor statis; jika membutuhkan SSR Next.js, pilih deployment yang mendukung SSR, misalnya Firebase App Hosting, setelah memvalidasi kebutuhan deployment.
- **Job terjadwal:** scheduled function untuk finalisasi sesi, pemeliharaan, dan proses operasional. Validasi presensi tetap dilakukan pada setiap request.
- **Dashboard kehadiran:** polling backend setiap 5 detik saat halaman aktif untuk MVP. Listener Firestore langsung dapat ditambahkan setelah aturan baca spesifik dirancang dan diuji.
- **Pemantauan:** log backend tanpa token mentah/data sensitif, metrik error/latensi, serta pemantauan penggunaan dan biaya.

Endpoint login/logout pada bagian 12 merupakan kontrak fungsional. Pada implementasi Firebase, login, logout lokal, dan pemulihan password memakai Firebase Auth SDK. Backend menerima Firebase ID token sebagai bearer token melalui HTTPS; setiap endpoint memverifikasi token dan memeriksa status akun aplikasi. Pencabutan sesi lintas perangkat memerlukan revocation dari backend dan pemeriksaan revocation, bukan hanya `signOut()` di browser. Cookie sesi hanya digunakan jika nantinya dipilih arsitektur SSR berbasis cookie, lengkap dengan perlindungan CSRF.

### 15.1 Prinsip model Firestore

- Firestore menggunakan **collection dan document**, bukan tabel relasional. Model konseptual pada bagian 11 dipetakan ke path di bawah.
- Gunakan Firebase Auth UID sebagai identitas pengguna di seluruh relasi.
- Simpan waktu sebagai Firestore `Timestamp`; gunakan waktu backend tepercaya untuk keputusan kedaluwarsa dan `serverTimestamp()` untuk metadata pencatatan.
- Simpan relasi sebagai ID yang divalidasi backend. Firestore tidak otomatis memeriksa referensi atau menghapus dokumen anak.
- Hindari array peserta, riwayat presensi, atau materi yang terus membesar dalam satu dokumen. Gunakan subcollection atau collection terpisah.
- Denormalisasi `classId`, `meetingId`, `studentId`, dan `meetingStartsAt` pada record presensi agar rekap dapat di-query tanpa join.
- Referensi dan data denormalisasi hanya ditulis backend; klien tidak menentukan nama kelas, peran, status presensi, atau waktu check-in yang dipercaya server.

### 15.2 Struktur collection dan document

| Path | Field utama | Ketentuan |
|---|---|---|
| `users/{uid}` | email, displayName, roles[], active, createdAt, updatedAt | Peran/status hanya diubah admin melalui backend; tidak berisi password |
| `profiles/{uid}` | studentNumber, schoolClass, avatarPath, bio, githubUrl | Pengguna hanya dapat mengubah field profil yang diizinkan |
| `classes/{classId}` | name, description, period, timezone, archivedAt, createdAt | Data kelas |
| `classes/{classId}/teachers/{uid}` | teacherId, active, assignedAt | Penugasan pengajar; ID UID mencegah relasi ganda |
| `classes/{classId}/members/{uid}` | studentId, active, joinedAt, endedAt | Keanggotaan siswa; ID UID mencegah relasi ganda |
| `materials/{materialId}` | classId, authorId, title, summary, body, topic, sortOrder, status, publishedAt, updatedAt | Materi published saja untuk siswa |
| `materials/{materialId}/attachments/{attachmentId}` | storagePath, originalName, contentType, size, createdAt | Metadata file, bukan isi file atau URL unduhan permanen |
| `meetings/{meetingId}` | classId, title, startsAt, endsAt, createdBy | Jadwal pertemuan |
| `meetings/{meetingId}/participants/{uid}` | studentId, enrolledAtSnapshot, snapshotVersion | Snapshot daftar peserta |
| `attendanceSessions/{meetingId}` | classId, state, opensAt, closesAt, lateAfter, activeTokenHash, qrVersion, rosterReady, finalizedAt | Satu sesi per pertemuan; sessionId = meetingId |
| `qrTokens/{tokenHash}` | meetingId, classId, version, generatedBy, createdAt, expiresAt, revokedAt, purgeAt | Backend-only; token mentah tidak disimpan |
| `attendance/{attendanceId}` | classId, meetingId, studentId, meetingStartsAt, status, checkedInAt, source, qrVersion, recordedBy, updatedAt | ID deterministik dari pasangan meetingId dan studentId |
| `auditLogs/{auditId}` | actorId, action, entityType, entityId, classId, oldValue, newValue, reason, createdAt | Append-only dari backend; tanpa token mentah |

`attendanceId` dihitung server sebagai SHA-256 dari representasi kanonik pasangan `[meetingId, studentId]`, misalnya JSON array berurutan. Jangan memakai ID acak untuk dokumen presensi atau menggabungkan ID dengan pemisah yang ambigu. Dengan ID deterministik, semua request untuk siswa–pertemuan yang sama menuju dokumen yang sama.

Jika nomor siswa harus unik, tambahkan collection privat `studentNumberReservations/{normalizedNumber}`. Backend membuat/memindahkan reservasi bersama pembaruan profil dalam transaksi. Query “apakah nomor sudah dipakai” diikuti write biasa tidak menjamin keunikan saat request bersamaan.

### 15.3 Contoh data

Contoh berikut bersifat ilustratif. String waktu pada JSON harus dikonversi menjadi Firestore `Timestamp` ketika disimpan; ID di bawah bukan ID Firebase yang telah dibuat.

**`attendanceSessions/meeting_001`**

```json
{
  "classId": "coding_dasar",
  "state": "open",
  "opensAt": "2026-09-12T08:00:00Z",
  "closesAt": "2026-09-12T08:30:00Z",
  "lateAfter": "2026-09-12T08:10:00Z",
  "activeTokenHash": "<sha256-token-aktif>",
  "qrVersion": 3,
  "rosterReady": true,
  "finalizedAt": null
}
```

**`qrTokens/{sha256-token-aktif}`**

```json
{
  "meetingId": "meeting_001",
  "classId": "coding_dasar",
  "version": 3,
  "generatedBy": "uid_pengajar",
  "createdAt": "2026-09-12T08:05:00Z",
  "expiresAt": "2026-09-12T08:06:00Z",
  "revokedAt": null,
  "purgeAt": "<Timestamp sesuai kebijakan retensi>"
}
```

**`attendance/{sha256-pasangan-meeting-dan-siswa}`**

```json
{
  "classId": "coding_dasar",
  "meetingId": "meeting_001",
  "studentId": "uid_siswa",
  "meetingStartsAt": "2026-09-12T08:00:00Z",
  "status": "hadir",
  "checkedInAt": "2026-09-12T08:05:25Z",
  "source": "qr",
  "qrVersion": 3,
  "recordedBy": "uid_siswa",
  "updatedAt": "2026-09-12T08:05:25Z"
}
```

### 15.4 Transaksi generate dan regenerate QR

1. Backend memverifikasi Firebase ID token, akun aktif, peran pengajar, dan penugasan pada kelas.
2. Buat token acak kriptografis baru; hitung hash SHA-256. Token mentah hanya dikembalikan kepada pengajar pembuat setelah transaksi berhasil.
3. Dalam transaksi Firestore, baca akun/penugasan yang relevan, sesi, dan dokumen token lama sebelum melakukan write.
4. Pastikan sesi `open`, `rosterReady = true`, dan waktu server berada dalam jendela sesi.
5. Naikkan `qrVersion`, buat dokumen token baru, tandai token lama dicabut, lalu ubah `activeTokenHash` pada sesi secara atomik. `expiresAt` adalah nilai paling awal antara waktu server + TTL QR dan `closesAt`.
6. Tulis audit tanpa token mentah. Token baru tidak boleh menimpa dokumen token yang sudah ada.
7. Jika transaksi gagal, jangan tampilkan token sebagai QR aktif. Jika respons terputus setelah commit, pengajar dapat generate ulang; langkah ini menghasilkan token baru dan mencabut token yang tidak diterima tersebut.

QR payload hanya membawa versi format dan token mentah acak, bukan hash token. Mengetahui hash yang tersimpan tidak boleh cukup untuk check-in.

### 15.5 Transaksi check-in anti-duplikasi

1. Backend memverifikasi identitas siswa dan menghitung hash token dari payload scan.
2. Dalam transaksi Firestore, baca dokumen token, sesi, akun, kelas, keanggotaan, snapshot peserta, dan dokumen presensi deterministik; lakukan seluruh read sebelum write.
3. Validasi ulang terhadap waktu backend pada setiap eksekusi ulang callback transaksi: akun/anggota aktif, sesi terbuka, QR aktif terbaru, belum dicabut, serta `now < expiresAt` dan `now < closesAt`.
4. Jika presensi sudah ada untuk siswa tersebut, jangan mengubahnya; kembalikan record pribadi yang ada. Ketika QR sudah tidak aktif, frontend dapat mengambil record melalui endpoint riwayat pribadi, bukan menganggap scan baru diterima.
5. Jika belum ada, buat satu dokumen presensi di path deterministik dengan status dan waktu yang ditentukan backend.
6. Jangan mengirim notifikasi atau melakukan efek samping eksternal di dalam callback transaksi karena Firestore dapat mengulang callback.

Check-in membaca dokumen sesi yang diperbarui saat regenerate/tutup, sehingga konflik harus menyebabkan retry atau kegagalan, bukan penerimaan token lama. Check-in tidak perlu memperbarui counter global dalam dokumen sesi pada setiap scan; hindari titik tulis yang diperebutkan seluruh siswa. Jumlah hadir pada pilot dapat dihitung dari hasil query rekap yang diotorisasi.

### 15.6 Snapshot peserta dan penutupan sesi

- Gunakan state internal tambahan `preparing` sebelum `open` untuk menyiapkan snapshot. Generate QR ditolak sampai `rosterReady = true`.
- Perubahan keanggotaan wajib melalui backend dan ditahan selama snapshot kelas disiapkan. Backend membekukan perubahan, menyalin anggota aktif secara bertahap, lalu menandai snapshot siap dan membuka sesi. Proses harus memiliki status/progress dan mekanisme pemulihan jika gagal.
- Snapshot besar tidak ditulis sebagai satu array atau diasumsikan muat dalam satu transaksi. Gunakan batch/chunk yang dapat dilanjutkan dengan ID peserta deterministik.
- Penutupan mengubah sesi menjadi `closed` dan mencabut token aktif dalam transaksi; scan langsung ditolak setelahnya.
- Finalisasi peserta belum presensi dilakukan job idempoten per batch. Untuk setiap peserta, transaksi hanya membuat `tidak_hadir` bila record belum ada, sehingga tidak menimpa presensi atau koreksi manual yang masuk bersamaan.
- Antarmuka menampilkan “Rekap sedang difinalisasi” sampai `finalizedAt` terisi. Ekspor final menunggu finalisasi selesai.
- Jika job terlambat berjalan, endpoint check-in tetap menolak waktu di luar jendela sesi. TTL/pembersihan bukan mekanisme penutupan.

### 15.7 Hak akses Firebase dan keamanan backend

**Pilihan MVP: data aplikasi dibaca dan ditulis melalui backend tepercaya.** Browser menggunakan Firebase Auth SDK untuk login, tetapi tidak mengakses collection Firestore secara langsung. Pendekatan ini memusatkan otorisasi dan menjaga data token tetap privat.

Aturan Firestore untuk arsitektur backend-only:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- Penolakan di atas berlaku untuk SDK klien. **Admin SDK melewati Firestore Security Rules**, sehingga backend wajib memverifikasi token, peran, akun aktif, keanggotaan, kepemilikan data, dan field allowlist pada setiap request.
- Siswa hanya menerima profil dan riwayat pribadi serta materi published kelasnya.
- Pengajar hanya dapat mengelola kelas yang ditugaskan; admin tanpa penugasan pengajar tetap tidak dapat generate QR.
- Hanya backend yang dapat menulis `roles`, `activeTokenHash`, token, status/waktu kehadiran, dan audit.
- Gunakan Firebase App Check sebagai lapisan tambahan untuk endpoint yang didukung; App Check bukan pengganti login, otorisasi, atau rate limit.
- Kredensial service account tidak boleh dimasukkan ke frontend atau repository publik. Terapkan IAM dengan hak minimum.
- Jika kelak menambahkan akses Firestore langsung dari browser, rules di atas harus diganti dengan aturan spesifik dan diuji terlebih dahulu. Jangan mengubahnya menjadi `allow read, write: if request.auth != null` untuk seluruh database.

### 15.8 Penyimpanan materi di Cloud Storage

Usulan path file:

```text
class-materials/{classId}/{materialId}/{attachmentId}/{safeFileName}
avatars/{uid}/{generatedFileName}
```

- Upload/unduh melalui backend yang mengotorisasi pengguna atau signed URL berumur pendek yang diterbitkan setelah otorisasi.
- Tolak akses langsung SDK klien pada Storage dalam desain backend-only; signed URL dan Admin SDK dikontrol backend/IAM dan tidak bergantung pada Storage Rules.
- URL bertanda tangan adalah akses berbasis kepemilikan URL sampai kedaluwarsa; jangan memakainya sebagai tautan publik permanen.
- Validasi kembali ukuran, tipe, lokasi objek, serta kepemilikan sebelum menandai upload selesai. Metadata dari klien tidak dipercaya begitu saja.
- Jangan gunakan URL download bertoken berumur panjang untuk materi privat. Simpan `storagePath` di Firestore, lalu otorisasi setiap permintaan unduhan baru.
- Penghapusan materi tidak otomatis menghapus file atau subcollection; sediakan proses cleanup eksplisit dengan audit dan kebijakan retensi.

### 15.9 Query dan indeks

Indeks berikut merupakan kandidat awal yang perlu diuji dengan query implementasi. Arah pengurutan dan filter harus sesuai query aktual; simpan konfigurasi indeks di version control.

| Kebutuhan | Collection/query | Kandidat indeks komposit |
|---|---|---|
| Materi published per kelas | materials: classId, status; urut publishedAt terbaru | classId ASC, status ASC, publishedAt DESC |
| Jadwal kelas | meetings: classId; urut startsAt | classId ASC, startsAt ASC |
| Riwayat siswa | attendance: studentId; urut meetingStartsAt terbaru | studentId ASC, meetingStartsAt DESC |
| Rekap kelas per periode | attendance: classId, rentang meetingStartsAt | classId ASC, meetingStartsAt ASC |
| Rekap kelas per status/periode | attendance: classId, status, rentang meetingStartsAt | classId ASC, status ASC, meetingStartsAt ASC |
| Kelas siswa aktif | collection group members: studentId, active | studentId ASC, active ASC; scope collection group |
| Kelas pengajar aktif | collection group teachers: teacherId, active | teacherId ASC, active ASC; scope collection group |
| Audit kelas | auditLogs: classId; urut createdAt terbaru | classId ASC, createdAt DESC |

- Daftar peserta hadir per pertemuan memakai filter `meetingId`; tambahkan indeks komposit jika menggabungkan status atau pengurutan lain.
- Gunakan pagination berbasis cursor, misalnya 25–50 dokumen per halaman; jangan mengambil seluruh riwayat pada setiap polling.
- Firestore bukan mesin full-text search. MVP menggunakan pencarian awalan judul ternormalisasi pada kelas/status tertentu, atau filter lokal pada daftar kecil yang dibatasi. Pencarian substring/full-text lintas isi materi membutuhkan layanan indeks tambahan dan bukan fitur bawaan Firestore.
- Nonaktifkan indeks yang tidak digunakan untuk isi materi panjang, payload audit besar, dan field lain yang tidak di-query setelah memeriksa kebutuhan akses.

### 15.10 TTL, retensi, biaya, dan operasional

- Validasi kedaluwarsa memakai `expiresAt` pada setiap request. **Firestore TTL tidak menghapus dokumen tepat pada waktu kedaluwarsa** dan tidak boleh menjadi pengaman presensi.
- Jika menggunakan TTL untuk cleanup `qrTokens`, gunakan `purgeAt` berdasarkan kebijakan retensi. Jangan menghapus presensi/audit bersama token hanya karena QR kedaluwarsa.
- Tentukan retensi presensi, audit, materi, dan backup bersama sekolah sebelum produksi.
- Pilih lokasi Firestore, Functions, dan Storage yang kompatibel, berdekatan dengan pengguna, dan sesuai kebijakan data sebelum provisioning.
- Pisahkan project development/staging dan production. Gunakan Firebase Emulator Suite untuk uji backend dan aturan akses sebelum deploy.
- Verifikasi kebutuhan billing layanan yang dipilih, kuota, serta harga saat deployment. Jangan mengasumsikan Functions, Storage, hosting, atau backup akan selalu gratis.
- Pasang budget alert dan monitoring penggunaan. Budget alert bukan hard spending cap; kendalikan biaya juga melalui pagination, pembatasan upload, rate limit, dan penghentian polling saat tab tidak aktif.
- Konfigurasikan backup/export yang sesuai dan uji restore; backup Firestore saja tidak otomatis mencakup file Storage atau pengguna Firebase Auth.

### 15.11 Kriteria penerimaan khusus Firebase

- [ ] Kredensial pengguna ditangani Firebase Authentication; tidak ada password/hash dalam Firestore.
- [ ] Satu UID memiliki satu dokumen akun/profil dan relasi kelas memakai ID deterministik.
- [ ] Dua check-in paralel untuk siswa–pertemuan yang sama menghasilkan satu dokumen presensi.
- [ ] Regenerate/tutup dan check-in bersamaan tidak menerima token yang telah dicabut menurut urutan transaksi.
- [ ] Klien tidak dapat membaca token/audit atau menulis data aplikasi langsung melalui SDK Firestore.
- [ ] Backend menolak role spoofing, perubahan identitas siswa, waktu palsu, dan akses lintas kelas.
- [ ] Sesi tidak dapat dibuka untuk check-in sebelum snapshot peserta siap.
- [ ] Finalisasi bisa diulang tanpa menimpa hadir, terlambat, izin, sakit, atau koreksi manual.
- [ ] Kedaluwarsa ditolak meskipun dokumen token belum dihapus TTL.
- [ ] Seluruh query MVP berhasil dengan indeks yang disimpan di repository.
- [ ] File materi tidak dapat diakses melalui URL publik permanen.
- [ ] Uji beban, pemulihan, dan audit keamanan dilakukan di staging sebelum pilot.

## 16. Tahapan implementasi

Urutan berikut bersifat relatif; estimasi durasi ditentukan setelah ukuran tim dan detail kebutuhan disepakati.

1. **Validasi dan desain:** konfirmasi kebijakan presensi, jenis akun, aturan profil, serta wireframe alur QR.
2. **Fondasi:** autentikasi, peran, kelas, keanggotaan, profil, dan skema database.
3. **Presensi inti:** pertemuan, sesi, generate/regenerate, scanner, validasi atomik, dan status kehadiran.
4. **LMS:** editor materi, publikasi, lampiran privat, dan akses siswa.
5. **Rekap dan operasional:** riwayat siswa, koreksi manual, audit, CSV, serta backup.
6. **QA dan pilot:** pengujian lintas perangkat, concurrency, keamanan akses, pemulihan, serta uji satu kelas nyata.

## 17. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| QR aktif diteruskan kepada siswa di luar lokasi | Titip presensi | TTL pendek, regenerate, pengawasan; komunikasikan batas QR |
| Internet sekolah tidak stabil | Hasil presensi tidak terkonfirmasi | Pemeriksaan status/retry idempoten dan pencatatan manual diaudit |
| Kamera atau browser bermasalah | Siswa tidak bisa scan | Pengujian perangkat umum, panduan izin, fallback pengajar |
| QR kedaluwarsa saat antre | Siswa perlu memindai ulang | Countdown jelas dan tombol regenerate yang mudah |
| Permintaan bersamaan | Record ganda/QR lama diterima | ID dokumen deterministik dan transaksi Firestore yang memvalidasi sesi |
| Materi/file diakses dari luar kelas | Kebocoran konten | Otorisasi server dan penyimpanan privat |
| Koreksi presensi disalahgunakan | Rekap tidak dapat dipercaya | Alasan wajib dan audit yang tidak dapat diedit pengajar |
| Pergantian anggota mengubah riwayat | Rekap historis keliru | Snapshot peserta pertemuan |

## 18. Keputusan yang perlu dikonfirmasi

Hal berikut tidak menghalangi pembuatan draft, tetapi perlu diputuskan sebelum produksi:

- Apakah nama produk tetap CodeClub LMS atau menggunakan nama ekstrakurikuler sekolah?
- Apakah login email melalui Firebase Authentication dapat digunakan seluruh siswa? Jika login ID siswa wajib, desain pemetaan dan pemulihan akses perlu ditambahkan.
- Berapa jumlah kelas, siswa, dan pengajar pada peluncuran awal?
- Apakah TTL 60 detik dan rentang pengaturan 30–300 detik sesuai kondisi kelas?
- Berapa batas terlambat dan jendela presensi yang digunakan sekolah?
- Apakah tugas coding dan penilaian perlu dipindahkan dari P1 ke MVP?
- Bagaimana kebijakan penyimpanan data siswa, ekspor, dan penghapusan akun?
- Siapa yang bertanggung jawab atas hosting, backup, dukungan pengguna, dan pemulihan akses?

## 19. Definition of Done MVP

MVP dinyatakan siap pilot apabila:

- [ ] Siswa, pengajar, dan admin dapat login dengan batas akses yang benar.
- [ ] Pengajar dapat menerbitkan materi dan siswa aktif dapat mengaksesnya.
- [ ] Profil dapat dilihat dan diedit sesuai kewenangan.
- [ ] Hanya pengajar kelas berwenang yang dapat membuat QR.
- [ ] Setiap generate menghasilkan token berbeda dan regenerate mencabut token lama.
- [ ] QR kedaluwarsa/sesi tertutup selalu ditolak oleh server.
- [ ] Check-in tercatat maksimal satu kali per siswa per pertemuan, termasuk request paralel.
- [ ] Status hadir, terlambat, izin, sakit, dan tidak hadir tercatat sesuai aturan.
- [ ] Kamera, retry jaringan, serta fallback manual sudah diuji.
- [ ] Riwayat pribadi, rekap, ekspor CSV, dan audit koreksi berfungsi.
- [ ] Pengujian otorisasi materi/file dan presensi lintas kelas lulus.
- [ ] Tidak ada bug kritis yang belum diselesaikan pada alur presensi.
- [ ] Backup, pemulihan, dan kebijakan privasi dasar siap digunakan.
- [ ] Pengajar dan perwakilan siswa menyelesaikan uji coba satu pertemuan nyata.
