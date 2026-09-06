# SECURE LMS — Supabase + Vercel

Backend aktif telah dipindahkan dari Firebase ke **Supabase Free** dan **Vercel Hobby**.

## Arsitektur
- Vite frontend di Vercel
- Express API sebagai Vercel Function
- Supabase Auth, PostgreSQL, dan private Storage
- Google Drive/Slides untuk embed materi

## Setup Supabase
1. Buat project Supabase Free.
2. Jalankan `supabase/migrations/202609060001_initial.sql` di SQL Editor.
3. Atur Site URL dan Redirect URLs ke domain produksi serta localhost.
4. Ambil Project URL, anon/publishable key, dan service-role key.

## Environment Vercel
```dotenv
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=ANON_KEY
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_KEY
APP_URL=https://lms.domainanda.com
```
Jangan pernah memakai awalan `VITE_` untuk service-role key.

## Deploy Vercel Hobby
- Root Directory: kosong
- Install: `npm install`
- Build: `npm run build -w web`
- Output: `web/dist`
- Node.js: 22.x

Buat admin pertama:
```bash
SUPABASE_URL=https://PROJECT.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/bootstrap-admin.mjs admin@domain.com 'PasswordKuat!' 'Admin SECURE'
```

## Custom domain
Tambahkan domain di Vercel Project → Settings → Domains, pasang DNS yang diminta, lalu samakan `APP_URL` dan Supabase Site URL. Pemasangan custom domain tersedia di Hobby; biaya perpanjangan domain tetap mengikuti registrar.

## Catatan gratis
Tidak perlu Firebase Blaze, Vercel Pro, atau Supabase Pro selama penggunaan berada dalam kuota free tier. Supabase Free dapat menjeda project yang lama tidak aktif. Schema ini membuat backend baru; data Firebase lama belum disalin otomatis.
