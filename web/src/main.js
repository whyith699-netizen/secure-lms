import './style.css';
import { auth, configured } from './firebase.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from 'firebase/auth';

import { state, api, $, toast, message, friendly, download } from './state.js';
import { esc, header, empty, brand, button, icon } from './ui.js';
import { initRouter, navigate, getPath, dispatchRoute } from './router.js';

import { showAuth, configScreen } from './pages/auth.js';
import { homeView } from './pages/home.js';
import { materialsView, detailView, editorView, materialList, renderEmbedRow } from './pages/materials.js';
import { meetingsView, meetingDetailView, meetingEditor, meetingList } from './pages/meetings.js';
import { sessionView, rosterTable, drawQR, startSessionUpdates, stopSessionUpdates } from './pages/session.js';
import { scanView, startScan, stopScan } from './pages/scan.js';
import { historyView, historyTable } from './pages/history.js';
import { profileView } from './pages/profile.js';
import { adminUsersView, adminClassesListView, adminClassDetailView } from './pages/admin.js';

const root = $('app');

function isNavActive(navPath, currentPath) {
  if (navPath === '/beranda') return currentPath === '/' || currentPath === '/beranda';
  if (navPath === '/admin/pengguna') return currentPath === '/admin' || currentPath === '/admin/pengguna';
  return currentPath.startsWith(navPath);
}

function updateNavActive() {
  const current = getPath();
  document.querySelectorAll('.nav button').forEach(b => {
    const navPath = b.dataset.nav;
    if (navPath) {
      b.classList.toggle('active', isNavActive(navPath, current));
    }
  });
}

function renderShell() {
  const teacher = state.mode === 'pengajar';
  const isAdmin = state.mode === 'admin';
  const current = getPath();

  const nav = isAdmin ? [
    ['/admin/pengguna', 'Pengguna & Akses', 'users'],
    ['/admin/kelas', 'Kelola Kelas', 'classes'],
    ['/profil', 'Profil saya', 'profile']
  ] : [
    ['/beranda', 'Beranda', 'home'],
    ['/materi', 'Materi', 'book'],
    ['/pertemuan', teacher ? 'Pertemuan & presensi' : 'Pertemuan', 'calendar'],
    ...(teacher ? [] : [['/scan', 'Scan presensi', 'scan'], ['/riwayat', 'Riwayat presensi', 'history']]),
    ['/profil', 'Profil saya', 'profile']
  ];

  const classSwitcher = isAdmin ? `
    <div class="workspace" style="margin:24px 0 20px;padding:12px;display:flex;gap:12px;align-items:center">
      ${icon('key')}
      <div>
        <strong style="font-size:14px">Panel Kontrol</strong>
        <span class="tiny muted" style="font-size:12px">Administrasi Sistem</span>
      </div>
    </div>
  ` : `
    <div class="field" style="margin-top:32px">
      <label for="class-select">Kelas aktif</label>
      <select id="class-select">
        ${state.classes.length ? state.classes.map(c => `
          <option value="${esc(c.id)}" ${state.cid === c.id ? 'selected' : ''}>${esc(c.name)}</option>
        `).join('') : '<option>Belum ada kelas</option>'}
      </select>
    </div>
  `;

  root.innerHTML = `
    <div class="app">
      <div class="menuback" id="menuback" data-action="menu-close"></div>
      <aside class="sidebar" id="sidebar">
        ${brand()}
        ${classSwitcher}
        <p class="navlabel">RUANG ${state.mode.toUpperCase()}</p>
        <nav class="nav">
          ${nav.map(([navPath, label, ic]) => `
            <button data-action="nav" data-nav="${navPath}" class="${isNavActive(navPath, current) ? 'active' : ''}">
              ${icon(ic)}
              <span>${label}</span>
            </button>
          `).join('')}
        </nav>
        <div class="sidebottom">
          ${roleSelect()}
          <div class="sidehint">
            ${esc(state.me.displayName)}<br>
            <span class="tiny">${esc(state.me.email)}</span>
          </div>
          ${button('Keluar', 'logout')}
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="crumb">
            <button class="mobilemenu" data-action="menu-open" aria-label="Buka menu">${icon('menu')}</button>
            <span>Ruang ${state.mode}</span>
          </div>
          <span class="tiny muted">SECURE LMS</span>
        </header>
        <div class="page">
          <div id="content"></div>
        </div>
      </main>
    </div>
  `;
}

function roleSelect() {
  return state.me.roles.length > 1 ? `
    <select id="role-select" aria-label="Pilih ruang akun">
      ${state.me.roles.map(r => `<option ${r === state.mode ? 'selected' : ''}>${r}</option>`).join('')}
    </select>
  ` : '';
}

async function loadPage(target, targetId = null) {
  await stopScan();
  stopSessionUpdates();
  clearInterval(state.timer);
  state.nextCursor = null;
  const e = ++state.epoch;

  if ($('sidebar')) {
    $('sidebar').classList.remove('open');
    $('menuback').classList.remove('show');
  }
  updateNavActive();

  const el = $('content');
  if (el) {
    if (!el.children.length) el.innerHTML = '<div class="empty" role="status">Memuat…</div>';
    else {
      el.style.opacity = '0.55';
      el.style.transition = 'opacity 0.12s ease';
    }
  }

  try {
    let html = '';
    const curPath = getPath();

    if (target === 'admin-users' || (state.mode === 'admin' && target === 'home')) {
      html = await adminUsersView();
    } else if (target === 'admin-classes') {
      html = await adminClassesListView();
    } else if (target === 'admin-class-detail') {
      html = await adminClassDetailView(targetId);
    } else if (!state.cid && !['/profil', '/riwayat'].includes(curPath) && state.mode !== 'admin') {
      html = header('SECURE', 'Kelas belum ditetapkan.', 'Akunmu aktif, tetapi belum terdaftar di kelas.') +
        empty('Hubungi pengelola', 'Pengelola dapat menambahkan keanggotaan melalui skrip administrasi.');
    } else if (target === 'home') {
      html = await homeView();
    } else if (target === 'materials') {
      html = await materialsView();
    } else if (target === 'material') {
      html = await detailView(targetId);
    } else if (target === 'editor') {
      html = await editorView(targetId);
    } else if (target === 'meetings') {
      html = await meetingsView();
    } else if (target === 'meeting-detail') {
      html = await meetingDetailView(targetId);
    } else if (target === 'new-meeting') {
      html = await meetingEditor(targetId);
    } else if (target === 'session') {
      html = await sessionView(targetId);
    } else if (target === 'scan') {
      html = scanView();
    } else if (target === 'history') {
      html = await historyView();
    } else if (target === 'profile') {
      html = profileView();
    }

    if (e !== state.epoch) return;
    if (el) {
      el.innerHTML = html;
      el.style.opacity = '1';
    }
    window.scrollTo(0, 0);

    if (target === 'session' && targetId) {
      startSessionUpdates(targetId);
    }
  } catch (err) {
    if (e === state.epoch && el) {
      el.style.opacity = '1';
      el.innerHTML = empty('Belum dapat memuat halaman', friendly(err)) + button('Coba lagi', 'reload');
    }
  }
}

// Router routes configuration
const routes = [
  { path: '/', handler: () => loadPage(state.mode === 'admin' ? 'admin-users' : 'home') },
  { path: '/beranda', handler: () => loadPage('home') },
  
  // Materials
  { path: '/materi', handler: () => loadPage('materials') },
  { path: '/materi/baru', handler: () => loadPage('editor') },
  { path: '/materi/:id', handler: p => loadPage('material', p.id) },
  { path: '/materi/:id/edit', handler: p => loadPage('editor', p.id) },
  
  // Meetings
  { path: '/pertemuan', handler: () => loadPage('meetings') },
  { path: '/pertemuan/baru', handler: () => loadPage('new-meeting') },
  { path: '/pertemuan/:id', handler: p => loadPage('meeting-detail', p.id) },
  { path: '/pertemuan/:id/edit', handler: p => loadPage('new-meeting', p.id) },
  { path: '/pertemuan/:id/presensi', handler: p => loadPage('session', p.id) },
  { path: '/presensi/:id', handler: p => loadPage('session', p.id) },

  // Scan & History
  { path: '/scan', handler: () => loadPage('scan') },
  { path: '/riwayat', handler: () => loadPage('history') },

  // Profile
  { path: '/profil', handler: () => loadPage('profile') },

  // Admin
  { path: '/admin', handler: () => loadPage('admin-users') },
  { path: '/admin/pengguna', handler: () => loadPage('admin-users') },
  { path: '/admin/kelas', handler: () => loadPage('admin-classes') },
  { path: '/admin/kelas/:id', handler: p => loadPage('admin-class-detail', p.id) }
];

async function onRouteNotFound(path) {
  console.warn('Rute tidak ditemukan:', path);
  if (state.mode === 'admin') navigate('/admin/pengguna', { replace: true });
  else navigate('/beranda', { replace: true });
}

async function boot(user) {
  if (!user) {
    showAuth();
    return;
  }
  root.innerHTML = '<div class="empty">Memeriksa akses SECURE…</div>';
  try {
    state.me = await api('/me');
    state.mode = state.me.roles.includes('pengajar') ? 'pengajar' : state.me.roles.includes('admin') ? 'admin' : 'siswa';
    state.classes = state.mode === 'admin' ? [] : await api('/classes');
    state.cid = state.classes[0]?.id || '';

    renderShell();

    let initial = getPath();
    if (initial === '/') {
      initial = state.mode === 'admin' ? '/admin/pengguna' : '/beranda';
      navigate(initial, { replace: true });
    } else {
      await dispatchRoute(initial);
    }
  } catch (e) {
    root.innerHTML = `
      <header class="adminhead">${brand()}</header>
      <main class="adminmain">
        ${header('Akses akun', 'Satu langkah lagi.', friendly(e))}
        <div class="buttonrow">
          ${e.code === 'VERIFY_EMAIL' ? button('Kirim email verifikasi', 'verify', '', 'primary') : ''}
          ${button('Periksa kembali', 'recheck')}
          ${button('Keluar', 'logout')}
        </div>
        <p class="tiny muted" style="margin-top:24px">Jika email belum diizinkan atau akun dinonaktifkan, hubungi pengelola SECURE.</p>
      </main>
    `;
  }
}

function getActiveMeetingId() {
  const match = getPath().match(/\/pertemuan\/([^/]+)/);
  if (match && match[1] !== 'baru') return match[1];
  const presensiMatch = getPath().match(/\/presensi\/([^/]+)/);
  if (presensiMatch) return presensiMatch[1];
  return state.rosterCache?.meeting?.id || state.currentMeeting?.meeting?.id || null;
}

const actionHandlers = {
  'auth-login': () => { state.authMode = 'login'; showAuth(); },
  'auth-signup': () => { state.authMode = 'signup'; showAuth(); },
  'auth-reset': () => { state.authMode = 'reset'; showAuth(); },
  logout: () => signOut(auth),
  'logout-all': async () => { await api('/logout-all', { method: 'POST' }); await signOut(auth); },
  verify: async () => { await sendEmailVerification(auth.currentUser); toast('Email verifikasi dikirim. Periksa inbox dan folder spam.'); },
  recheck: async () => { await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); await boot(auth.currentUser); },
  nav: b => {
    if (b.dataset.nav) navigate(b.dataset.nav);
    else if (b.dataset.page) {
      const pageMap = {
        home: '/beranda',
        materials: '/materi',
        meetings: '/pertemuan',
        scan: '/scan',
        history: '/riwayat',
        profile: '/profil',
        'admin-users': '/admin/pengguna',
        'admin-classes': '/admin/kelas'
      };
      navigate(pageMap[b.dataset.page] || '/beranda');
    }
  },
  reload: () => dispatchRoute(getPath()),
  'menu-open': () => { $('sidebar').classList.add('open'); $('menuback').classList.add('show'); },
  'menu-close': () => { $('sidebar').classList.remove('open'); $('menuback').classList.remove('show'); },
  material: b => navigate(`/materi/${b.dataset.id}`),
  'new-material': () => navigate('/materi/baru'),
  'edit-material': () => navigate(`/materi/${state.currentMaterial?.id || ''}/edit`),
  'add-embed-row': () => {
    const container = $('embed-items-list');
    if (!container) return;
    const count = container.querySelectorAll('[data-embed-row]').length;
    container.insertAdjacentHTML('beforeend', renderEmbedRow({ title: '', url: '' }, count));
  },
  'remove-embed-row': b => {
    const row = b.closest('[data-embed-row]');
    if (row) row.remove();
    const container = $('embed-items-list');
    if (container) {
      const rows = container.querySelectorAll('[data-embed-row]');
      if (!rows.length) {
        container.innerHTML = renderEmbedRow({ title: '', url: '' }, 0);
      } else {
        rows.forEach((r, i) => {
          const badge = r.querySelector('.guide-badge');
          if (badge) badge.textContent = `Dokumen #${i + 1}`;
        });
      }
    }
  },
  'meeting-detail': b => b.dataset.id ? navigate(`/pertemuan/${b.dataset.id}`) : navigate('/pertemuan'),
  'new-meeting': () => navigate('/pertemuan/baru'),
  'edit-meeting': () => navigate(`/pertemuan/${state.currentMeeting?.meeting?.id || ''}/edit`),
  session: b => navigate(`/pertemuan/${b.dataset.id}/presensi`),
  'open-session': async () => {
    const mId = getActiveMeetingId();
    if (!mId) return;
    await api(`/meetings/${mId}/open`, { method: 'POST' });
    const r = await api(`/meetings/${mId}/qr`, { method: 'POST' });
    state.qrState = { ...r, meetingId: mId };
    await dispatchRoute(getPath());
    toast('Sesi presensi dibuka & QR aktif.');
  },
  'generate-qr': async () => {
    const mId = getActiveMeetingId();
    if (!mId) return;
    const r = await api(`/meetings/${mId}/qr`, { method: 'POST' });
    state.qrState = { ...r, meetingId: mId };
    await drawQR(mId);
    toast('QR berhasil diperbarui.');
  },
  'close-session': async () => {
    const mId = getActiveMeetingId();
    if (!confirm('Tutup presensi? Sesi tidak dapat dibuka ulang. Peserta yang belum tercatat akan diberi status tidak hadir.')) return;
    await api(`/meetings/${mId}/close`, { method: 'POST' });
    state.qrState = null;
    await dispatchRoute(getPath());
    toast('Sesi ditutup dan rekap difinalisasi.');
  },
  'toggle-kas': async b => {
    const sId = b.dataset.uid;
    const mId = getActiveMeetingId();
    if (!mId) return;
    const res = await api(`/meetings/${mId}/attendance/${sId}/toggle-kas`, { method: 'POST' });
    toast(`Status kas ${b.dataset.name}: ${res.kasPaid ? 'Sudah Bayar' : 'Belum Bayar'}`);
    if (getPath().includes('/presensi')) {
      state.rosterCache = await api(`/meetings/${mId}/attendance`);
      if ($('roster-panel')) $('roster-panel').innerHTML = rosterTable(state.rosterCache);
    } else {
      await dispatchRoute(getPath());
    }
  },
  'edit-note': b => {
    const sId = b.dataset.uid, name = b.dataset.name, currentNote = b.dataset.note || '';
    $('note-uid').value = sId;
    $('note-name').textContent = `Siswa: ${name}`;
    $('note-input').value = currentNote;
    if ($('note-modal-error')) $('note-modal-error').textContent = '';
    $('note-modal').showModal();
  },
  correct: b => {
    const r = state.rosterCache.data.find(x => x.studentId === b.dataset.uid);
    $('correction-uid').value = r.studentId;
    $('correction-name').textContent = `${r.displayName} (${r.schoolClass || '—'})`;
    $('correction-status').value = r.status === 'hadir' ? 'hadir' : 'tidak_hadir';
    $('correction-kas').value = r.kasPaid ? '1' : '0';
    $('correction-notes').value = r.notes || '';
    if ($('form-error')) $('form-error').textContent = '';
    $('correction').showModal();
  },
  'close-modal': () => document.querySelectorAll('dialog[open]').forEach(d => d.close()),
  export: () => {
    const mId = getActiveMeetingId();
    if (mId) download(`/meetings/${mId}/export`, 'presensi-secure.csv');
  },
  'start-scan': startScan,
  'stop-scan': async () => {
    await stopScan();
    if ($('scan-message')) $('scan-message').textContent = 'Kamera dihentikan.';
  },
  'more-materials': async () => {
    const r = await api(`/classes/${state.cid}/materials?cursor=${encodeURIComponent(state.nextCursor)}`);
    state.materialCache.push(...r.data);
    state.nextCursor = r.nextCursor;
    $('material-list').innerHTML = materialList();
    document.querySelector('.loadmore').innerHTML = state.nextCursor ? button('Muat lebih banyak', 'more-materials') : '';
  },
  'more-meetings': async () => {
    const r = await api(`/classes/${state.cid}/meetings?cursor=${encodeURIComponent(state.nextCursor)}`);
    state.meetingCache.push(...r.data);
    state.nextCursor = r.nextCursor;
    $('meeting-list').innerHTML = meetingList();
    document.querySelector('.loadmore').innerHTML = state.nextCursor ? button('Muat lebih banyak', 'more-meetings') : '';
  },
  'more-history': async () => {
    const r = await api(`/me/attendance?cursor=${encodeURIComponent(state.nextCursor)}`);
    state.historyCache.push(...r.data);
    state.nextCursor = r.nextCursor;
    $('history-list').innerHTML = historyTable();
    document.querySelector('.loadmore').innerHTML = state.nextCursor ? button('Muat lebih banyak', 'more-history') : '';
  },
  'admin-get-link': async b => {
    const res = await api('/admin/reset-link', { method: 'POST', body: { username: b.dataset.email } });
    $('reset-modal-info').textContent = `Tautan reset kata sandi untuk ${b.dataset.name} (${b.dataset.email}):`;
    $('reset-link-text').value = res.link;
    $('admin-link-modal').showModal();
  },
  'copy-reset-link': async () => {
    const link = $('reset-link-text').value;
    try {
      await navigator.clipboard.writeText(link);
      toast('Tautan reset berhasil disalin!');
    } catch {
      const el = $('reset-link-text');
      el.select();
      document.execCommand('copy');
      toast('Tautan berhasil disalin!');
    }
  },
  'admin-change-pw': b => {
    $('setpw-email').value = b.dataset.email;
    $('setpw-target-name').textContent = `Ubah password akun: ${b.dataset.name} (${b.dataset.email})`;
    $('setpw-error').textContent = '';
    $('admin-password-modal').showModal();
  },
  'admin-toggle-active': async b => {
    await api('/admin/toggle-user', { method: 'POST', body: { uid: b.dataset.uid } });
    state.cachedUsers = null;
    toast('Status akun berhasil diubah.');
    await dispatchRoute(getPath());
  },
  'admin-toggle-role': async b => {
    const nextRole = b.dataset.role === 'pengajar' ? 'siswa' : 'pengajar';
    const label = nextRole === 'pengajar' ? 'Pengajar (Guru)' : 'Siswa';
    if (!confirm(`Ubah peran pengguna "${b.dataset.name}" menjadi "${label}"?`)) return;
    await api('/admin/change-role', { method: 'POST', body: { uid: b.dataset.uid, role: nextRole } });
    state.cachedUsers = null;
    toast(`Peran ${b.dataset.name} berhasil diubah menjadi ${label}.`);
    await dispatchRoute(getPath());
  },
  'admin-toggle-archive-class': async b => {
    const isArchived = b.dataset.archived === 'true';
    const msg = isArchived ? 'Buka arsip kelas ini agar aktif kembali untuk siswa dan guru?' : 'PERHATIAN: Mengarsipkan kelas akan menyembunyikan kelas dari siswa dan guru. Yakin ingin mengarsipkan kelas ini?';
    if (!confirm(msg)) return;
    await api(`/admin/classes/${b.dataset.id}/archive`, { method: 'POST', body: { archive: !isArchived } });
    state.cachedClasses = null;
    toast('Status kelas berhasil diubah.');
    await dispatchRoute(getPath());
  },
  'admin-edit-class': b => {
    $('edit-class-id').value = b.dataset.id;
    $('edit-class-id-label').textContent = `Kode Kelas: ${b.dataset.id}`;
    $('edit-class-name').value = b.dataset.name || '';
    $('edit-class-period').value = b.dataset.period || '';
    $('edit-class-desc').value = b.dataset.desc || '';
    if ($('edit-class-error')) $('edit-class-error').textContent = '';
    $('admin-edit-class-modal').showModal();
  },
  'admin-delete-class': async b => {
    const name = b.dataset.name || b.dataset.id;
    if (!confirm(`Yakin ingin menghapus kelas "${name}" secara permanen? Seluruh data keanggotaan kelas ini akan dihapus.`)) return;
    await api(`/admin/classes/${b.dataset.id}`, { method: 'DELETE' });
    state.cachedClasses = null;
    toast(`Kelas "${name}" berhasil dihapus.`);
    navigate('/admin/kelas');
  },
  'admin-remove-teacher': async b => {
    if (!confirm('Hapus penugasan pengajar ini dari kelas?')) return;
    await api(`/admin/classes/${b.dataset.cid}/remove-teacher`, { method: 'POST', body: { teacherId: b.dataset.uid } });
    state.cachedClasses = null;
    toast('Pengajar dikeluarkan dari kelas.');
    await dispatchRoute(getPath());
  },
  'admin-unenroll-student': async b => {
    if (!confirm('Keluarkan siswa ini dari kelas?')) return;
    await api(`/admin/classes/${b.dataset.cid}/unenroll`, { method: 'POST', body: { studentId: b.dataset.uid } });
    state.cachedClasses = null;
    toast('Siswa dikeluarkan dari kelas.');
    await dispatchRoute(getPath());
  }
};

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const fn = actionHandlers[b.dataset.action];
  if (!fn) return;
  b.disabled = true;
  try {
    await fn(b);
  } catch (err) {
    message(friendly(err));
  } finally {
    b.disabled = false;
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'material-search') $('material-list').innerHTML = materialList();
});

document.addEventListener('change', async e => {
  if (e.target.id === 'class-select') {
    state.cid = e.target.value;
    state.qrState = null;
    await dispatchRoute(getPath());
  }
  if (e.target.id === 'role-select') {
    state.mode = e.target.value;
    state.classes = state.mode === 'admin' ? [] : await api('/classes');
    state.cid = state.classes[0]?.id || '';
    state.qrState = null;
    renderShell();
    const defaultPath = state.mode === 'admin' ? '/admin/pengguna' : '/beranda';
    navigate(defaultPath);
  }
});

document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, b = f.querySelector('[type="submit"]');
  if (b) b.disabled = true;
  const data = Object.fromEntries(new FormData(f));
  if ($('form-error')) $('form-error').textContent = '';
  if ($('change-pw-error')) $('change-pw-error').textContent = '';

  try {
    if (f.id === 'auth-form') {
      let loginId = data.email.trim().toLowerCase();
      if (!loginId.includes('@')) loginId = `${loginId}@secure.sch.id`;
      if (state.authMode === 'reset') {
        await sendPasswordResetEmail(auth, loginId);
        toast('Jika akun terdaftar, tautan reset dikirim. Jika akun username, hubungi Admin.');
        state.authMode = 'login';
        showAuth();
      } else if (state.authMode === 'signup') {
        if (data.password.length < 6) throw Error('Gunakan password minimal 6 karakter.');
        const u = await createUserWithEmailAndPassword(auth, loginId, data.password);
        await updateProfile(u.user, { displayName: data.name.trim() });
        toast('Akun berhasil dibuat.');
        await boot(u.user);
      } else {
        await signInWithEmailAndPassword(auth, loginId, data.password);
      }
    }

    if (f.id === 'admin-user-form') {
      const r = await api('/admin/users', { method: 'POST', body: data });
      state.cachedUsers = null;
      let resetBtn = r.resetLink ? `<div style="margin-top:10px"><button type="button" class="btn text" data-action="admin-get-link" data-email="${esc(r.email)}" data-name="${esc(r.name)}" style="padding:0;font-size:13px;display:inline-flex;align-items:center;gap:6px">${icon('link')} Salin Tautan Reset Kata Sandi</button></div>` : '';
      $('added-users-result').insertAdjacentHTML('afterbegin', `
        <div class="notice">
          <p>
            <strong>Akun ${esc(r.role.toUpperCase())} Berhasil Dibuat:</strong><br>
            Username: <strong>${esc(r.username)}</strong> (<code>${esc(r.email)}</code>)<br>
            Nama: ${esc(r.name)}${r.schoolClass ? `<br>Kelas: <strong>${esc(r.schoolClass)}</strong>` : ''}<br>
            Password Awal: <code>${esc(r.initialPassword)}</code>
          </p>
          ${resetBtn}
        </div>
      `);
      f.reset();
      if ($('admin-password')) $('admin-password').value = 'Secure123!';
      toast(`Akun ${r.username} (${r.role}) siap digunakan!`);
      setTimeout(() => dispatchRoute(getPath()), 2500);
    }

    if (f.id === 'admin-set-pw-form') {
      await api('/admin/set-password', { method: 'POST', body: data });
      state.cachedUsers = null;
      document.querySelectorAll('dialog[open]').forEach(d => d.close());
      toast(`Password baru untuk ${data.email} berhasil disimpan!`);
    }

    if (f.id === 'admin-create-class-form') {
      const r = await api('/admin/classes', { method: 'POST', body: data });
      state.cachedClasses = null;
      toast(`Kelas ${data.name} berhasil dibuat!`);
      navigate(`/admin/kelas/${r.id}`);
    }

    if (f.id === 'admin-edit-class-form') {
      await api(`/admin/classes/${data.cid}`, { method: 'PATCH', body: { name: data.name, period: data.period, description: data.description } });
      state.cachedClasses = null;
      document.querySelectorAll('dialog[open]').forEach(d => d.close());
      toast('Informasi kelas berhasil diperbarui!');
      await dispatchRoute(getPath());
    }

    if (f.id === 'admin-assign-teacher-form') {
      await api(`/admin/classes/${data.cid}/assign-teacher`, { method: 'POST', body: { teacherId: data.teacherId } });
      state.cachedClasses = null;
      toast('Pengajar berhasil ditugaskan!');
      await dispatchRoute(getPath());
    }

    if (f.id === 'admin-enroll-student-form') {
      await api(`/admin/classes/${data.cid}/enroll`, { method: 'POST', body: { studentId: data.studentId } });
      state.cachedClasses = null;
      toast('Siswa berhasil dienrol ke kelas!');
      await dispatchRoute(getPath());
    }

    if (f.id === 'profile-form') {
      await api('/me', { method: 'PATCH', body: data });
      state.me = await api('/me');
      toast('Profil disimpan.');
    }

    if (f.id === 'change-pw-form') {
      if (!data.currentPassword) throw Error('Masukkan kata sandi lama saat ini.');
      if (!data.newPassword || data.newPassword.length < 6) throw Error('Kata sandi baru minimal 6 karakter.');
      if (data.newPassword !== data.confirmPassword) throw Error('Konfirmasi kata sandi baru tidak cocok.');
      if (data.currentPassword === data.newPassword) throw Error('Kata sandi baru tidak boleh sama dengan kata sandi lama.');
      await api('/me/change-password', { method: 'POST', body: { currentPassword: data.currentPassword, newPassword: data.newPassword } });
      f.reset();
      toast('Kata sandi berhasil diubah! Gunakan kata sandi baru saat masuk berikutnya.');
    }

    if (f.id === 'material-form') {
      const embedTitles = Array.from(f.querySelectorAll('.embed-title-input')).map(i => i.value.trim());
      const embedUrls = Array.from(f.querySelectorAll('.embed-url-input')).map(i => i.value.trim());
      const embeds = [];
      for (let i = 0; i < embedUrls.length; i++) {
        const rawU = embedUrls[i];
        if (!rawU) continue;
        const lines = rawU.split(/[\n\r]+/).map(s => s.trim()).filter(Boolean);
        if (lines.length > 1) {
          lines.forEach((l, subIdx) => {
            embeds.push({ title: embedTitles[i] ? `${embedTitles[i]} (Bagian ${subIdx + 1})` : '', url: l });
          });
        } else {
          embeds.push({ title: embedTitles[i] || '', url: rawU });
        }
      }
      if (data.canvaUrl?.trim() && !embeds.some(e => e.url === data.canvaUrl.trim())) {
        embeds.push({ title: 'Presentasi Canva', url: data.canvaUrl.trim() });
      }
      if (data.driveUrl?.trim() && !embeds.some(e => e.url === data.driveUrl.trim())) {
        embeds.push({ title: 'Presentasi Google Drive', url: data.driveUrl.trim() });
      }
      data.embeds = embeds;
      if (!data.body?.trim() && !embeds.length && !data.link?.trim()) {
        throw Error('Pilih minimal salah satu metode materi: isi Markdown, tautan presentasi embed, atau tautan referensi.');
      }
      const r = state.currentMaterial?.id
        ? await api(`/materials/${state.currentMaterial.id}`, { method: 'PATCH', body: data })
        : await api(`/classes/${state.cid}/materials`, { method: 'POST', body: data });
      const targetId = state.currentMaterial?.id || r.id;
      navigate(`/materi/${targetId}`);
      toast('Materi disimpan.');
    }

    if (f.id === 'meeting-form') {
      data.materialIds = new FormData(f).getAll('materialIds');
      for (const k of ['startsAt', 'endsAt']) data[k] = new Date(data[k]).toISOString();
      let targetMeetingId;
      if (state.currentMeeting?.meeting?.id) {
        await api(`/meetings/${state.currentMeeting.meeting.id}`, { method: 'PATCH', body: data });
        targetMeetingId = state.currentMeeting.meeting.id;
        toast('Pertemuan dan tautan materi diperbarui.');
      } else {
        const r = await api(`/classes/${state.cid}/meetings`, { method: 'POST', body: data });
        targetMeetingId = r.id;
        toast('Pertemuan dibuat.');
      }
      state.currentMeeting = null;
      navigate(`/pertemuan/${targetMeetingId}`);
    }

    if (f.id === 'correction-form') {
      const mId = getActiveMeetingId();
      if (!mId) throw Error('ID pertemuan tidak ditemukan.');
      await api(`/meetings/${mId}/attendance/${data.uid}`, {
        method: 'PATCH',
        body: { status: data.status, kasPaid: data.kasPaid === '1', notes: data.notes }
      });
      document.querySelectorAll('dialog[open]').forEach(d => d.close());
      if (getPath().includes('/presensi')) {
        state.rosterCache = await api(`/meetings/${mId}/attendance`);
        if ($('roster-panel')) $('roster-panel').innerHTML = rosterTable(state.rosterCache);
      } else {
        await dispatchRoute(getPath());
      }
      toast('Presensi dan status kas berhasil disimpan.');
    }

    if (f.id === 'note-form') {
      const mId = getActiveMeetingId();
      if (!mId) throw Error('ID pertemuan tidak ditemukan.');
      await api(`/meetings/${mId}/attendance/${data.uid}`, {
        method: 'PATCH',
        body: { notes: data.notes }
      });
      document.querySelectorAll('dialog[open]').forEach(d => d.close());
      if (getPath().includes('/presensi')) {
        state.rosterCache = await api(`/meetings/${mId}/attendance`);
        if ($('roster-panel')) $('roster-panel').innerHTML = rosterTable(state.rosterCache);
      } else {
        await dispatchRoute(getPath());
      }
      toast('Catatan kejadian berhasil disimpan.');
    }
  } catch (err) {
    if (f.id === 'change-pw-form' && $('change-pw-error')) $('change-pw-error').textContent = friendly(err);
    else message(friendly(err));
  } finally {
    if (b) b.disabled = false;
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopScan();
});
window.addEventListener('pagehide', stopScan);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('sidebar')) {
    $('sidebar').classList.remove('open');
    $('menuback').classList.remove('show');
  }
});

// Initialize router
initRouter(routes, onRouteNotFound);

if (configured) onAuthStateChanged(auth, user => boot(user));
else configScreen();
