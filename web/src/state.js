import { auth, configured, apiBase } from './firebase.js';

export const state = {
  me: null,
  mode: '',
  classes: [],
  cid: '',
  currentRoute: '/',
  scanner: null,
  poll: null,
  timer: null,
  qrState: null,
  toastTimer: null,
  authMode: 'login',
  adminSelectedClassId: null,
  materialCache: [],
  meetingCache: [],
  historyCache: [],
  nextCursor: null,
  currentMaterial: null,
  currentMeeting: null,
  rosterCache: null,
  cachedUsers: null,
  cachedUsersTime: 0,
  cachedClasses: null,
  cachedClassesTime: 0,
  epoch: 0
};

export const $ = id => document.getElementById(id);

export async function api(path, options = {}) {
  if (!auth?.currentUser) throw Error('Silakan masuk kembali.');
  const token = await auth.currentUser.getIdToken();
  let headers = { Authorization: `Bearer ${token}`, ...options.headers };
  let body = options.body;
  if (body && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(apiBase + path, { ...options, headers, body });
  } catch {
    throw Error('Jaringan terputus. Periksa riwayat sebelum mengulang presensi.');
  }
  if (!res.ok) {
    let data = await res.json().catch(() => ({ message: `Permintaan gagal (${res.status}).` }));
    let e = Error(data.message);
    e.code = data.code;
    throw e;
  }
  if (options.raw) return res;
  return res.json();
}

export function toast(text) {
  const el = $('toast');
  if (!el) return;
  el.textContent = text;
  el.className = 'toast show';
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    if (el) el.className = 'toast';
  }, 5000);
}

export function message(text) {
  const el = $('form-error');
  if (el) {
    el.textContent = text;
    el.focus();
  } else {
    toast(text);
  }
}

export function friendly(e) {
  if (!e) return 'Terjadi kesalahan.';
  if (e.code === 'INVALID_OLD_PASSWORD') return e.message || 'Password lama tidak sesuai.';
  if (e.code === 'INVALID_PASSWORD') return e.message || 'Password baru minimal 6 karakter.';
  if (e.code === 'SAME_PASSWORD') return e.message || 'Password baru tidak boleh sama dengan password saat ini.';
  if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') return 'Email atau password tidak cocok.';
  if (e.code === 'auth/email-already-in-use') return 'Email sudah mempunyai akun. Gunakan Masuk atau Lupa password.';
  if (e.code === 'auth/weak-password') return 'Gunakan password minimal 8 karakter.';
  if (e.code === 'auth/too-many-requests') return 'Terlalu banyak percobaan. Tunggu beberapa saat.';
  if (e.code === 'auth/network-request-failed') return 'Tidak dapat terhubung. Periksa koneksi internet.';
  return e.message || 'Terjadi kesalahan.';
}

export async function download(path, name) {
  const r = await api(path, { raw: true });
  const blob = await r.blob();
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}
