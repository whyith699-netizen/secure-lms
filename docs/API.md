# Ringkasan API SECURE

Base path `/api`, melalui domain Firebase Hosting yang sama. Semua endpoint memerlukan `Authorization: Bearer <Firebase ID token>`. Login/reset/verifikasi memakai Firebase Auth SDK. Format error: `{code, message}`.

| Method | Path | Akses |
|---|---|---|
| GET/PATCH | `/me` | Pemilik; PATCH hanya bio/GitHub |
| POST | `/logout-all` | Pemilik akun |
| POST | `/admin/emails` | Admin; hanya tambah email |
| GET | `/classes` | Kelas anggota/assignment |
| GET/POST | `/classes/:cid/materials` | Baca anggota; tulis pengajar |
| GET/PATCH | `/materials/:id` | Baca sesuai publikasi; edit pengajar |
| POST | `/materials/:id/attachments?name=...` | Pengajar; octet-stream |
| GET | `/materials/:id/attachments/:aid` | Pembaca materi berwenang |
| GET/POST | `/classes/:cid/meetings` | Baca anggota; buat pengajar, termasuk materialIds |
| GET/PATCH | `/meetings/:id` | Detail + materi; PATCH hanya pengajar |
| POST | `/meetings/:id/open` | Pengajar kelas |
| POST | `/meetings/:id/qr` | Pengajar kelas; body `ttl` 30–300 |
| POST | `/attendance/check-in` | Siswa; body `payload` hasil scan |
| GET | `/meetings/:id/attendance` | Pengajar kelas |
| PATCH | `/meetings/:id/attendance/:uid` | Pengajar; status + alasan |
| POST | `/meetings/:id/close` | Pengajar; close/finalisasi |
| GET | `/meetings/:id/export` | Pengajar; CSV final |
| GET | `/me/attendance` | Riwayat siswa pribadi |

List materi, pertemuan, dan riwayat menerima `limit` maksimal 50 dan `cursor` dari respons sebelumnya. Format `{data, nextCursor}`. Jangan merakit cursor sendiri.

Collection utama: `allowedEmails`, `users`, `profiles`, `classes/{id}/members`, `classes/{id}/teachers`, `materials/{id}/attachments`, `meetings/{id}/participants`, `attendanceSessions`, `qrTokens`, `attendance`, `auditLogs`, dan `rateLimits`.
