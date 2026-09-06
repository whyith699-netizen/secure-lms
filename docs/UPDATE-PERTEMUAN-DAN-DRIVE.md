# Pembaruan pertemuan dan embed Drive

## Alur siswa

- Menu **Pertemuan** tetap menampilkan seluruh jadwal kelas.
- Tombol **Buka** membuka detail jadwal, lokasi, status presensi, dan materi yang ditautkan pengajar.
- Hanya materi berstatus `published` yang tampil bagi siswa.
- Materi dapat dibuka dari detail pertemuan.
- Menu **Materi** tidak berubah fungsinya: tetap menjadi pustaka seluruh materi kelas dari berbagai pertemuan.

## Alur pengajar

- **Buat pertemuan** mencakup judul, lokasi, jadwal, jendela presensi, batas tepat waktu, dan pilihan materi.
- **Kelola pertemuan** dapat mengubah detail serta pilihan materi.
- Setelah sesi presensi dibuat, jadwal tidak boleh berubah agar aturan QR tetap konsisten; judul, lokasi, dan tautan materi masih dapat diperbarui.
- Maksimal 30 materi ditautkan pada satu pertemuan. Form menampilkan 50 materi terbaru; kelas yang lebih besar memerlukan pencarian server/pagination tambahan.
- Materi tetap berada di pustaka umum walaupun tidak ditautkan atau dilepas dari pertemuan.

## Embed Google Drive / Slides

Pada form materi, tempel salah satu format berikut:

- Google Drive file: `drive.google.com/file/d/FILE_ID/view`
- Google Slides: `docs.google.com/presentation/d/FILE_ID/edit`

Backend memvalidasi host/path dan membentuk URL embed sendiri. URL arbitrer tidak dapat menjadi iframe. Atur izin file agar siswa yang memiliki tautan dapat melihatnya. UI selalu menyediakan tombol **Buka di Drive** sebagai fallback apabila browser, organisasi Google Workspace, atau pemilik file memblokir embed.

Embed cocok untuk PPT/PPTX yang diunggah ke Drive serta Google Slides. File tidak disalin ke Firebase Storage oleh fitur embed; kebijakan akses tetap mengikuti Google Drive.
