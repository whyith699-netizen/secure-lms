#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hfaegztvozwphfonzbqj.supabase.co';

import fsSync from 'fs';
let envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!envKey && fsSync.existsSync('./.env.production')) {
  const lines = fsSync.readFileSync('./.env.production', 'utf8').split('\n');
  const found = lines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='));
  if (found) {
    envKey = found.split('=')[1].replace(/^["']|["']$/g, '').trim();
  }
}
const SUPABASE_SERVICE_ROLE_KEY = envKey || '';


const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const DEFAULT_PASSWORD = 'Secure123!';
const ADMIN_ID = '5de5872c-782f-4f93-8918-5f4fea291706';

const newTeachers = [
  { username: 'valda', name: 'Valda', email: 'valda@secure.sch.id' },
  { username: 'radith', name: 'Radith', email: 'radith@secure.sch.id' },
  { username: 'erlo', name: 'Erlo', email: 'erlo@secure.sch.id' },
  { username: 'nesya', name: 'Nesya', email: 'nesya@secure.sch.id' },
  { username: 'shafira', name: 'Shafira', email: 'shafira@secure.sch.id' },
  { username: 'fiko', name: 'Fiko', email: 'fiko@secure.sch.id' },
  { username: 'rifqi', name: 'Rifqi', email: 'rifqi@secure.sch.id' },
  { username: 'hanif', name: 'Hanif', email: 'hanif@secure.sch.id' },
  { username: 'rayhan', name: 'Rayhan', email: 'rayhan@secure.sch.id' },
  { username: 'zhyfara', name: 'Zhyfara', email: 'zhyfara@secure.sch.id' },
  { username: 'rizal', name: 'Rizal', email: 'rizal@secure.sch.id' },
  { username: 'rafa', name: 'Rafa', email: 'rafa@secure.sch.id' }
];

const classTeacherMap = {
  production: [
    'jalu@secure.sch.id',
    'agha@secure.sch.id',
    'valda@secure.sch.id',
    'radith@secure.sch.id',
    'erlo@secure.sch.id',
    'nesya@secure.sch.id'
  ],
  multimedia: [
    'shafira@secure.sch.id',
    'fiko@secure.sch.id',
    'rifqi@secure.sch.id',
    'radith@secure.sch.id'
  ],
  cybersecurity: [
    'hanif@secure.sch.id',
    'rayhan@secure.sch.id',
    'erlo@secure.sch.id',
    'zhyfara@secure.sch.id',
    'rizal@secure.sch.id',
    'rafa@secure.sch.id',
    'nesya@secure.sch.id'
  ]
};

async function main() {
  console.log('=== MEMBUAT AKUN PENGAJAR BARU ===');
  
  // List all users in Supabase auth to check existence
  const { data: authUsersData, error: listErr } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) {
    console.error('Gagal list auth users:', listErr);
    process.exit(1);
  }
  const existingAuthMap = new Map((authUsersData?.users || []).map(u => [u.email?.toLowerCase(), u]));

  for (const t of newTeachers) {
    const email = t.email.toLowerCase();
    let authUser = existingAuthMap.get(email);

    if (!authUser) {
      console.log(`Membuat akun Auth: ${t.name} (${email})...`);
      const { data: created, error: createErr } = await db.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: t.name }
      });
      if (createErr) {
        console.error(`Gagal membuat auth user ${email}:`, createErr.message);
        continue;
      }
      authUser = created.user;
    } else {
      console.log(`Akun Auth sudah ada: ${t.name} (${email}) [${authUser.id}]`);
    }

    // Upsert allowed_emails
    await db.from('allowed_emails').upsert({
      email,
      active: true,
      added_by: ADMIN_ID
    });

    // Upsert public.users
    const { error: userErr } = await db.from('users').upsert({
      id: authUser.id,
      email,
      display_name: t.name,
      roles: ['pengajar'],
      active: true,
      updated_at: new Date().toISOString()
    });

    if (userErr) {
      console.error(`Gagal update public.users untuk ${email}:`, userErr.message);
    } else {
      console.log(`✓ User ${t.name} (${email}) siap sebagai Pengajar.`);
    }
  }

  console.log('\n=== MENGAMBIL DATA SEMUA PENGAJAR UNTUK ENROL KELAS ===');
  const allEmails = [
    'jalu@secure.sch.id',
    'agha@secure.sch.id',
    ...newTeachers.map(t => t.email.toLowerCase())
  ];

  const { data: dbUsers, error: fetchErr } = await db.from('users').select('id, email, display_name').in('email', allEmails);
  if (fetchErr) {
    console.error('Gagal mengambil users:', fetchErr);
    process.exit(1);
  }
  const userMapByEmail = new Map((dbUsers || []).map(u => [u.email.toLowerCase(), u]));

  console.log('\n=== MENYINKRONKAN PENUGASAN KELAS (CLASS_TEACHERS) ===');
  for (const [classId, teacherEmails] of Object.entries(classTeacherMap)) {
    console.log(`\n-- Kelas: ${classId.toUpperCase()} --`);
    
    // Pastikan kelas ada
    const { data: cls } = await db.from('classes').select('id, name').eq('id', classId).maybeSingle();
    if (!cls) {
      console.error(`Kelas ${classId} tidak ditemukan!`);
      continue;
    }

    // Ambil pengajar saat ini di kelas ini
    const { data: currentTeachers } = await db.from('class_teachers').select('teacher_id').eq('class_id', classId);
    const currentTeacherIds = new Set((currentTeachers || []).map(ct => ct.teacher_id));

    // Kumpulkan target teacher_id untuk kelas ini
    const targetTeacherIds = new Set();
    for (const email of teacherEmails) {
      const u = userMapByEmail.get(email.toLowerCase());
      if (u) {
        targetTeacherIds.add(u.id);
        const { error: assignErr } = await db.from('class_teachers').upsert({
          class_id: classId,
          teacher_id: u.id,
          active: true,
          assigned_at: new Date().toISOString()
        });
        if (assignErr) {
          console.error(`Gagal assign ${u.display_name} (${email}) ke ${classId}:`, assignErr.message);
        } else {
          console.log(`✓ Ditugaskan: ${u.display_name} (${email}) ke kelas ${cls.name}`);
        }
      } else {
        console.error(`User dengan email ${email} tidak ditemukan di tabel users!`);
      }
    }

    // Hapus pengajar yang tidak lagi terdaftar di kelas ini
    for (const currentId of currentTeacherIds) {
      if (!targetTeacherIds.has(currentId)) {
        console.log(`Menghapus penugasan pengajar id ${currentId} dari kelas ${cls.name}...`);
        await db.from('class_teachers').delete().eq('class_id', classId).eq('teacher_id', currentId);
      }
    }
  }

  console.log('\n=== REKAP PENUGASAN PENGAJAR PER KELAS ===');
  for (const classId of Object.keys(classTeacherMap)) {
    const { data: ctRows } = await db.from('class_teachers')
      .select('class_id, teacher_id, users(id, email, display_name)')
      .eq('class_id', classId);
    console.log(`\nKelas ${classId.toUpperCase()}:`);
    (ctRows || []).forEach(row => {
      console.log(`  - ${row.users?.display_name} (${row.users?.email})`);
    });
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
