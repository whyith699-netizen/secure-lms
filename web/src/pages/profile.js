import { state } from '../state.js';
import { header, esc, field, button } from '../ui.js';

export function profileView() {
  const p = state.me.profile || {};
  return header('Akun', 'Profil saya', 'Identitas resmi ditetapkan pengelola; bio dan GitHub dapat diubah.') + `
    <form id="profile-form" class="panel panelpad profilecard">
      <div class="profilehead">
        <div class="avatar">${esc((state.me.displayName || 'U').slice(0, 2).toUpperCase())}</div>
        <div>
          <h2>${esc(state.me.displayName)}</h2>
          <p>${esc(state.me.email)}</p>
        </div>
      </div>
      <div class="fieldgrid">
        <div class="field">
          <label>Nomor siswa</label>
          <p>${esc(p.studentNumber || 'Belum diisi')}</p>
        </div>
        <div class="field">
          <label>Kelas sekolah</label>
          <p>${esc(p.schoolClass || 'Belum diisi')}</p>
        </div>
      </div>
      <div class="field">
        <label for="bio">Bio (maksimal 200 karakter)</label>
        <textarea id="bio" name="bio" maxlength="200">${esc(p.bio || '')}</textarea>
      </div>
      ${field('Profil GitHub', 'githubUrl', p.githubUrl || '', 'url', false)}
      <p class="error" id="form-error" tabindex="-1" role="alert"></p>
      <button class="btn primary" type="submit">Simpan profil</button>
      ${button('Keluar dari semua perangkat', 'logout-all', '', 'text spaced')}
    </form>

    <form id="change-pw-form" class="panel panelpad" style="margin-top:24px">
      <h2>Ganti Kata Sandi</h2>
      <p class="tiny muted" style="margin-bottom:16px">
        Gunakan form ini jika kamu mengingat kata sandi saat ini. Jika lupa kata sandi lama, silakan hubungi Admin untuk meminta tautan reset kata sandi baru.
      </p>
      <div class="field">
        <label for="current-password">Kata sandi lama (saat ini)</label>
        <input id="current-password" name="currentPassword" type="password" required placeholder="Masukkan kata sandi saat ini">
      </div>
      <div class="fieldgrid">
        <div class="field">
          <label for="new-password">Kata sandi baru</label>
          <input id="new-password" name="newPassword" type="password" required minlength="6" placeholder="Minimal 6 karakter">
        </div>
        <div class="field">
          <label for="confirm-password">Konfirmasi kata sandi baru</label>
          <input id="confirm-password" name="confirmPassword" type="password" required minlength="6" placeholder="Ulangi kata sandi baru">
        </div>
      </div>
      <p class="error" id="change-pw-error" tabindex="-1" role="alert"></p>
      <button class="btn primary" type="submit">Ubah Kata Sandi</button>
    </form>
  `;
}
