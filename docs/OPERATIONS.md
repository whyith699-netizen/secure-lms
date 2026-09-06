# SECURE — Panduan Operasional & Kepatuhan (Operations & Compliance)

Dokumen ini memuat panduan komprehensif untuk konfigurasi operasional, tata kelola keamanan, pemantauan anggaran, pencadangan data, serta kebijakan privasi pada SECURE LMS.

---

## 1. Cadangan & Pemulihan Bencana (Backup & Disaster Recovery)

Pencadangan SECURE harus mencakup 3 pilar: **Cloud Firestore**, **Cloud Storage**, dan **Firebase Authentication**.

### A. Cloud Firestore (Database)
1. **Managed Scheduled Backups (Rekomendasi Google Cloud Firestore):**
   - Cloud Firestore mendukung fitur *Firestore Native Scheduled Backups* dengan retensi harian/mingguan:
     ```bash
     gcloud firestore backups schedules create \
       --database='(default)' \
       --retention=14d \
       --recurrence=daily \
       --project=PROJECT_ID
     ```
2. **Ekspor Manual / Skrip Otomatis:**
   - Gunakan skrip [scripts/backup.sh](file:///home/miro/secure-project/scripts/backup.sh) secara periodik (misal via Cron server atau Cloud Build/Scheduler).
   - Simpan hasil ekspor pada Cloud Storage bucket terpisah yang dilindungi IAM khusus (misal: `gs://secure-lms-backups`).
   - Berikan role `roles/datastore.importExportAdmin` kepada Service Agent Firestore dan `roles/storage.admin` ke bucket backup.

### B. Cloud Storage (File & Lampiran Materi)
- Aktifkan **Object Versioning** pada bucket Cloud Storage produksi:
  ```bash
  gcloud storage buckets update gs://PROJECT_ID.firebasestorage.app --versioning
  ```
- Terapkan **Lifecycle Management** untuk memindahkan objek lawas ke kelas *Nearline* atau *Coldline* setelah 90 hari guna efisiensi biaya.

### C. Firebase Authentication (Akun Pengguna)
- Gunakan CLI Firebase untuk mengekspor data kredensial dan hash kata sandi:
  ```bash
  npx firebase auth:export ./backups/auth-users.json --project=PROJECT_ID --format=json
  ```
- File hasil ekspor harus dienkripsi saat disimpan (at-rest) karena memuat metadata akun siswa dan pengajar.

---

## 2. Pemantauan & Peringatan (Monitoring & Alerting)

Gunakan **Google Cloud Monitoring (Cloud Operations Suite)** untuk mengamati kesehatan sistem:

1. **Cloud Functions Health:**
   - Metrik kunci: `cloudfunctions.googleapis.com/function/execution_count`, `execution_times` (latensi p95/p99), dan `user_memory_bytes`.
   - Setup Alert Policy jika tingkat kegagalan (Error Rate 5xx) melebihi 1% selama 5 menit berturut-turut.
2. **Firestore Quota & Performance:**
   - Pantau Read/Write/Delete operations harian terhadap batas kuota yang ditentukan.
3. **Error Reporting:**
   - Integrasikan Google Cloud Error Reporting untuk menangkap uncaught exception pada runtime backend Functions (`api` dan `finalizeAttendance`).
4. **Uptime Check & Sintetis:**
   - Buat HTTPS Uptime Check ke URL root Hosting (`https://PROJECT_ID.web.app`) dengan interval 5 menit untuk mendeteksi downtime jaringan secara instan.

---

## 3. Anggaran & Batas Biaya (Budget & Cost Management)

Untuk mencegah lonjakan tagihan tak terduga (*bill shock*):

1. **Pengaturan Google Cloud Billing Budget:**
   - Buka Console: **Billing** → **Budgets & alerts** → **Create Budget**.
   - Target proyek: `codeclub-lms-56ad7c` (atau project ID produksi Anda).
   - Tentukan batas anggaran bulanan (contoh: Rp 300.000,- atau $20 USD).
2. **Threshold Rules:**
   - Kirim notifikasi email ke Admin/Owner pada ambang batas:
     - 50% dari anggaran (peringatan dini).
     - 80% dari anggaran (evaluasi kapasitas).
     - 100% dari anggaran (tindakan korektif).
     - 120% (ekskalasi kritis).
3. **Automated Cost Capping (Opsi Lanjutan via Pub/Sub):**
   - Sambungkan notifikasi anggaran ke Cloud Pub/Sub topic yang memicu Cloud Function untuk menonaktifkan billing atau membatasi kuota Cloud Functions jika anggaran 100% terlampaui.

---

## 4. Manajemen Akses & IAM (Least Privilege Principle)

Pemisahan peran IAM ketat wajib diterapkan untuk menjaga kerahasiaan data siswa:

| Entitas | Peran IAM yang Direkomendasikan | Cakupan & Batasan |
| :--- | :--- | :--- |
| **Operator CLI (Service Account)** | `roles/datastore.user`, `roles/firebaseauth.admin` | Hanya untuk menjalankan provisioning awal via CLI di luar repositori Git. |
| **Cloud Functions Default SA** | `roles/datastore.user`, `roles/storage.objectAdmin`, `roles/logging.logWriter` | Dibatasi hanya pada bucket aplikasi dan database default. |
| **Developer / CI/CD** | `roles/firebase.hostingAdmin`, `roles/cloudfunctions.developer`, `roles/artifactregistry.writer` | Hanya dapat melakukan build dan deployment; tidak memiliki akses membaca data pengguna. |
| **Project Owner / Admin Sekolah** | `roles/owner` atau `roles/resourcemanager.organizationAdmin` | Dilindungi autentikasi multi-faktor (2FA/MFA wajib). |

---

## 5. Kebijakan Retensi & Penghapusan Data (Data Retention)

1. **Data Presensi & Log Kehadiran:**
   - Disimpan aktif selama periode tahun ajaran berjalan (1 tahun).
   - Setelah tahun ajaran selesai, data diarsipkan ke CSV terproteksi dan record transaksi detail pada Firestore dapat dipangkas (*pruning*) setelah 2 tahun.
2. **Audit Logs (`auditLogs` collection):**
   - Disimpan minimal 1 tahun untuk keperluan kepatuhan operasional sekolah, kemudian dihapus secara berkala oleh scheduled task.
3. **Materi & Lampiran File:**
   - Materi arsip dipertahankan tanpa batas waktu kecuali jika pengajar menghapus atau ukuran penyimpanan melebihi kuota sekolah.
   - File attachment orphan (tidak tertaut ke materi aktif manapun) diperiksa dan dibersihkan setiap semester.
4. **Akun Siswa yang Lulus / Keluar:**
   - Operator menjalankan perintah disable akun: `npm run manage -- disable siswa@example.com`.
   - Data identitas pribadi dihapus setelah periode tenggang 6 bulan pasca kelulusan.

---

## 6. Kebijakan Privasi Siswa & Standar Perlindungan Data (Privacy Policy)

Aplikasi SECURE dirancang sesuai dengan prinsip perlindungan data pribadi siswa (UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi / standar sekolah):

1. **Minimisasi Data (Data Minimization):**
   - Sistem hanya menyimpan atribut identitas esensial: Nama Siswa, NIS/Nomor Siswa, Kelas Sekolah, dan Email.
   - **Tidak menyimpan data biometrik, lokasi geografis (GPS), riwayat perangkat pribadi, maupun rekaman kamera.** Kamera hanya digunakan oleh browser lokal untuk memproses token QR dalam RAM secara real-time.
2. **Tujuan Terbatas (Purpose Limitation):**
   - Seluruh data kehadiran dan materi hanya dipergunakan untuk keperluan administrasi ekstrakurikuler coding sekolah. Data tidak pernah dibagikan kepada pihak ketiga atau pengiklan.
3. **Kerahasiaan & Keamanan Akses:**
   - Siswa hanya dapat melihat presensi dan profil miliknya sendiri.
   - Hak penambahan izin email dibatasi hanya bagi administrator terverifikasi.
4. **Hak Koreksi & Penghapusan:**
   - Siswa berhak mengajukan koreksi kehadiran yang keliru kepada pengajar (setiap koreksi tersimpan rapi dalam log riwayat yang beralasan).
   - Orang tua/wali berhak meminta penghapusan profil siswa saat mengundurkan diri dari program ekstrakurikuler.
