#!/usr/bin/env node
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided.');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function formatName(str) {
  str = str.trim();
  if (str === str.toUpperCase() || str === str.toLowerCase()) {
    return str.toLowerCase().replace(/(^|\s|-)\S/g, l => l.toUpperCase());
  }
  return str;
}

function getCleanUsername(fullName, existingSet) {
  const words = fullName.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  let u = words[0];
  if (['muhammad', 'muh', 'moch', 'md'].includes(u) && words.length > 1) {
    u = words[1];
  }
  if (existingSet.has(u)) {
    u = words[0] + '.' + (words[1] || '2');
    if (existingSet.has(u)) {
      u = words[0] + '.' + (words[2] || '2');
    }
  }
  existingSet.add(u);
  return u;
}

async function main() {
  console.log('--- 1. Menyiapkan 3 Kelas: Production, Multimedia, Cybersecurity ---');
  const classesToEnsure = [
    { id: 'production', name: 'Production', description: 'Divisi Produksi SECURE', period: '2026/2027' },
    { id: 'multimedia', name: 'Multimedia', description: 'Divisi Multimedia SECURE', period: '2026/2027' },
    { id: 'cybersecurity', name: 'Cybersecurity', description: 'Divisi Cybersecurity SECURE', period: '2026/2027' }
  ];

  for (const c of classesToEnsure) {
    const { error } = await db.from('classes').upsert(c);
    if (error) console.error('Error creating class', c.id, error.message);
    else console.log(`✓ Kelas "${c.name}" (${c.id}) siap.`);
  }

  // Cari akun pengajar Agha untuk ditugaskan ke ketiga kelas
  const { data: teacherUser } = await db.from('users').select('id').eq('email', 'agha@secure.sch.id').maybeSingle();
  if (teacherUser) {
    for (const c of classesToEnsure) {
      await db.from('class_teachers').upsert({
        class_id: c.id,
        teacher_id: teacherUser.id,
        active: true,
        assigned_at: new Date().toISOString()
      });
    }
    console.log(`✓ Pengajar (agha@secure.sch.id) ditugaskan ke semua 3 kelas.`);
  }

  console.log('\n--- 2. Membaca & Memproses Data Siswa dari CSV ---');
  const csvPath = '/mnt/disk2/anggota secure - Sheet1.csv';
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(4);

  const rawStudents = [];
  for (const line of lines) {
    const p = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    if (p[0]) rawStudents.push({ div: 'production', name: formatName(p[0]), cls: p[2] || '', noAbsen: p[1] || '', hp: p[3] || '' });
    if (p[5]) rawStudents.push({ div: 'cybersecurity', name: formatName(p[5]), cls: p[7] || '', noAbsen: p[6] || '', hp: p[8] || '' });
    if (p[10]) rawStudents.push({ div: 'multimedia', name: formatName(p[10]), cls: p[12] || '', noAbsen: p[11] || '', hp: p[13] || '' });
  }

  // Load existing users from auth
  const existingUsersMap = new Map();
  let page = 1;
  while (true) {
    const { data: list, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !list?.users?.length) break;
    for (const u of list.users) existingUsersMap.set(u.email.toLowerCase(), u);
    if (list.users.length < 1000) break;
    page++;
  }

  const existingUsernames = new Set(['admin', 'agha', 'budi']);
  for (const [em] of existingUsersMap.entries()) {
    existingUsernames.add(em.split('@')[0]);
  }

  const students = rawStudents.map(s => {
    const username = getCleanUsername(s.name, existingUsernames);
    const email = `${username}@secure.sch.id`.toLowerCase();
    return { ...s, username, email };
  });

  console.log(`Ditemukan ${students.length} siswa untuk diproses.`);

  console.log('\n--- 3. Mendaftarkan Akun Siswa & Enrol ke Kelas ---');
  let successCount = 0;
  const enrolledByClass = { production: 0, multimedia: 0, cybersecurity: 0 };

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const password = 'Secure123!';
    let userId = null;

    try {
      if (existingUsersMap.has(s.email)) {
        userId = existingUsersMap.get(s.email).id;
      } else {
        const { data: created, error: createErr } = await db.auth.admin.createUser({
          email: s.email,
          password,
          email_confirm: true,
          user_metadata: { display_name: s.name }
        });
        if (createErr) {
          // If already registered
          if (createErr.message?.toLowerCase().includes('registered')) {
            const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
            const found = list?.users?.find(u => u.email === s.email);
            userId = found?.id;
          } else {
            throw createErr;
          }
        } else {
          userId = created.user.id;
        }
      }

      if (!userId) throw new Error('User ID tidak ditemukan.');

      // Allowlist
      await db.from('allowed_emails').upsert({
        email: s.email,
        active: true,
        added_by: teacherUser?.id || userId
      });

      // Users table
      await db.from('users').upsert({
        id: userId,
        email: s.email,
        display_name: s.name,
        roles: ['siswa'],
        active: true,
        updated_at: new Date().toISOString()
      });

      // Profiles table with school class
      await db.from('profiles').upsert({
        user_id: userId,
        school_class: s.cls,
        student_number: s.noAbsen,
        bio: s.hp ? `WhatsApp: ${s.hp}` : '',
        updated_at: new Date().toISOString()
      });

      // Enrol ke kelas divisi yang diikuti
      await db.from('class_members').upsert({
        class_id: s.div,
        student_id: userId,
        display_name: s.name,
        school_class: s.cls,
        active: true,
        joined_at: new Date().toISOString()
      });

      successCount++;
      enrolledByClass[s.div] = (enrolledByClass[s.div] || 0) + 1;
      console.log(`[${i + 1}/${students.length}] ${s.div.toUpperCase()} | @${s.username} | ${s.cls} | ${s.name} ✓`);
    } catch (err) {
      console.error(`[${i + 1}/${students.length}] GAGAL untuk ${s.name} (${s.email}):`, err.message);
    }
  }

  console.log('\n--- SELESAI ---');
  console.log(`Total berhasil diproses: ${successCount} dari ${students.length} siswa.`);
  console.log('Rincian per kelas:');
  console.log(`- Production: ${enrolledByClass.production} siswa`);
  console.log(`- Multimedia: ${enrolledByClass.multimedia} siswa`);
  console.log(`- Cybersecurity: ${enrolledByClass.cybersecurity} siswa`);
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
