import { state, $ } from '../state.js';
import { brand, header, field, button } from '../ui.js';

export function showAuth() {
  clearInterval(state.poll);
  clearInterval(state.timer);
  state.me = null;
  const root = $('app');
  if (!root) return;
  const reset = state.authMode === 'reset', signup = state.authMode === 'signup';
  root.innerHTML = `<header class="adminhead">${brand()}</header><main class="authlayout"><section><p class="eyebrow">BELAJAR. MENCOBA. MEMBUAT.</p><h1>Tempat ide kecil<br>mulai jadi nyata.</h1><p class="muted">Materi, pertemuan, dan kehadiran.<br>Satu ruang untuk belajar coding bersama.</p><div class="codepreview"><span class="comment">// mulai dari satu langkah</span><br><span class="keyword">const</span> langkah = <span class="string">"coba dulu"</span>;</div></section><form class="panel panelpad" id="auth-form"><h2>${reset ? 'Pulihkan akses' : signup ? 'Aktifkan akun' : 'Selamat datang kembali.'}</h2><p class="tiny muted">${signup ? 'Gunakan username yang sudah didaftarkan admin.' : reset ? 'Masukkan username/email untuk menerima tautan pemulihan.' : 'Masuk dengan username atau email SECURE milikmu.'}</p>${signup ? field('Nama lengkap', 'name') : ''}${field('Username atau Email', 'email', '', 'text')}${reset ? '' : field('Password', 'password', '', 'password')}<p class="error" id="form-error" tabindex="-1" role="alert"></p><button class="btn primary full" type="submit">${reset ? 'Kirim tautan reset' : signup ? 'Buat akun' : 'Masuk'}</button><div class="authlinks">${button(reset || signup ? 'Kembali masuk' : 'Aktifkan akun', reset || signup ? 'auth-login' : 'auth-signup', '', 'text')}${!reset ? button('Lupa password', 'auth-reset', '', 'text') : ''}</div><p class="tiny muted">Cukup masukkan username (misal: <code>budi</code>). Jika lupa password, hubungi Admin untuk dibuatkan link reset password.</p></form></main>`;
}

export function configScreen() {
  const root = $('app');
  if (!root) return;
  root.innerHTML = `<header class="adminhead">${brand()}</header><main class="adminmain">${header('Instalasi', 'Hubungkan Firebase dahulu.', 'Source code sudah siap dikonfigurasi.')}<div class="panel panelpad"><ol><li>Salin <code>web/.env.example</code> menjadi <code>web/.env.local</code>.</li><li>Isi konfigurasi web Firebase dari Project settings.</li><li>Jalankan <code>npm run dev</code> atau build ulang sebelum deploy.</li></ol><p class="muted">Lihat README.md dan docs/SETUP.md untuk panduan lengkap. Ini bukan halaman demo: data akan berasal dari Firebase Anda.</p></div></main>`;
}
