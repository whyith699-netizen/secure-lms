import { state, api, friendly } from '../state.js';
import { header, esc, button, icon } from '../ui.js';

export function adminEditClassModal() {
  return `
    <dialog id="admin-edit-class-modal">
      <div class="modalhead">
        <h2>Edit Informasi Kelas</h2>
        <button type="button" class="close" data-action="close-modal">${icon('close')}</button>
      </div>
      <div class="modalbody">
        <form id="admin-edit-class-form">
          <input type="hidden" name="cid" id="edit-class-id">
          <p class="tiny muted" id="edit-class-id-label" style="margin-bottom:12px"></p>
          <div class="field">
            <label for="edit-class-name">Nama Kelas</label>
            <input id="edit-class-name" name="name" type="text" required>
          </div>
          <div class="field">
            <label for="edit-class-period">Periode / Tahun Ajaran</label>
            <input id="edit-class-period" name="period" type="text" required>
          </div>
          <div class="field">
            <label for="edit-class-desc">Deskripsi Kelas</label>
            <textarea id="edit-class-desc" name="description" rows="3" placeholder="Deskripsi atau jadwal kelas..."></textarea>
          </div>
          <p class="error" id="edit-class-error" tabindex="-1" role="alert"></p>
          <div class="buttonrow">
            <button class="btn primary" type="submit">Simpan Perubahan</button>
            <button class="btn" type="button" data-action="close-modal">Batal</button>
          </div>
        </form>
      </div>
    </dialog>
  `;
}

export async function adminUsersView(force = false) {
  let users = [];
  const now = Date.now();
  if (!force && state.cachedUsers && (now - state.cachedUsersTime < 30000)) {
    users = state.cachedUsers;
  } else {
    try {
      users = await api('/admin/users');
      state.cachedUsers = users;
      state.cachedUsersTime = now;
    } catch (e) {
      console.warn('Gagal memuat pengguna:', e.message);
      users = state.cachedUsers || [];
    }
  }

  return header('Administrasi Pengguna & Akses', 'Kelola Akun, Role, dan Sandi', 'Admin dapat menambahkan akun dengan username @secure.sch.id dan membagikan link reset kata sandi.') + `
    <div class="adminlayout" style="grid-template-columns:minmax(0,1fr) 360px">
      <section>
        <div class="panel panelpad" style="margin-bottom:28px">
          <h2>Daftar Pengguna (${users.length})</h2>
          <p class="tiny muted">Pengguna berdomain <code>@secure.sch.id</code> dapat masuk langsung memakai username (tanpa perlu email asli).</p>
          <div class="panel tablewrap" style="margin-top:16px">
            <table>
              <thead>
                <tr>
                  <th>USERNAME</th>
                  <th>NAMA</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                ${users.length ? users.map(u => `
                  <tr>
                    <td>
                      <strong>${esc(u.email.endsWith('@secure.sch.id') ? u.email.replace('@secure.sch.id', '') : u.email)}</strong>
                      <small>${esc(u.email)}</small>
                    </td>
                    <td>
                      <strong>${esc(u.displayName || '—')}</strong>
                      ${u.schoolClass ? `<br><small class="muted">Kelas: ${esc(u.schoolClass)}</small>` : ''}
                    </td>
                    <td>
                      <span class="tag ${u.roles?.includes('admin') ? 'orange' : u.roles?.includes('pengajar') ? 'blue' : 'green'}">${esc(u.roles?.[0] || 'siswa')}</span>
                    </td>
                    <td>
                      <span class="tag ${u.active !== false ? 'green' : ''}">${u.active !== false ? 'Aktif' : 'Nonaktif'}</span>
                    </td>
                    <td style="white-space:nowrap">
                      <button type="button" class="btn text" data-action="admin-get-link" data-email="${esc(u.email)}" data-name="${esc(u.displayName || u.email)}" style="padding:4px 8px;font-size:13px">${icon('link')} Link Reset</button>
                      <button type="button" class="btn text" data-action="admin-change-pw" data-email="${esc(u.email)}" data-name="${esc(u.displayName || u.email)}" style="padding:4px 8px;font-size:13px">${icon('key')} Ubah PW</button>
                      ${!u.roles?.includes('admin') ? `
                        <button type="button" class="btn text" data-action="admin-toggle-role" data-uid="${esc(u.id)}" data-name="${esc(u.displayName || u.email)}" data-role="${esc(u.roles?.[0] || 'siswa')}" style="padding:4px 8px;font-size:13px">${u.roles?.includes('pengajar') ? 'Jadikan Siswa' : 'Jadikan Pengajar'}</button>
                        <button type="button" class="btn text danger" data-action="admin-toggle-active" data-uid="${esc(u.id)}" style="padding:4px 8px;font-size:13px">${u.active !== false ? 'Nonaktifkan' : 'Aktifkan'}</button>
                      ` : ''}
                    </td>
                  </tr>
                `).join('') : '<tr><td colspan="5" style="text-align:center;padding:24px" class="muted">Belum ada pengguna. Tambahkan melalui form di samping.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        <div id="added-users-result" aria-live="polite"></div>
      </section>
      <aside>
        <form class="panel adminform" id="admin-user-form">
          <h2>Tambah Pengguna Baru</h2>
          <p class="tiny muted">Akun dibuat langsung tanpa perlu verifikasi email eksternal.</p>
          <div class="field">
            <label for="admin-username">Username</label>
            <input id="admin-username" name="username" type="text" placeholder="contoh: budi atau siti" required>
            <small class="muted">Otomatis menjadi <code>username@secure.sch.id</code></small>
          </div>
          <div class="field">
            <label for="admin-name">Nama Lengkap</label>
            <input id="admin-name" name="name" type="text" placeholder="contoh: Budi Santoso" required>
          </div>
          <div class="field">
            <label for="admin-role">Peran (Role)</label>
            <select id="admin-role" name="role">
              <option value="siswa" selected>Siswa</option>
              <option value="pengajar">Pengajar (Guru)</option>
            </select>
          </div>
          <div class="field" id="admin-school-class-field">
            <label for="admin-school-class">Kelas Sekolah (khusus Siswa)</label>
            <input id="admin-school-class" name="schoolClass" type="text" placeholder="contoh: X-RPL 1 atau XI-IPA 2">
            <small class="muted">Tersimpan di profil siswa dan otomatis dipakai saat enrol kelas.</small>
          </div>
          <div class="field">
            <label for="admin-password">Password Awal</label>
            <input id="admin-password" name="password" type="text" value="Secure123!" placeholder="Minimal 6 karakter" required>
            <small class="muted">Default: <code>Secure123!</code></small>
          </div>
          <p class="error" id="form-error" tabindex="-1" role="alert"></p>
          <button class="btn primary full" type="submit">${icon('userPlus')} Buat Akun &amp; Akses</button>
        </form>
        <div class="notice" style="margin-top:20px">
          <p>
            <strong>Lupa Password?</strong><br>
            Jika siswa/pengajar lupa kata sandi, Admin cukup klik tombol <strong>Link Reset</strong> di tabel untuk menyalin link ganti password dan membagikannya via chat.
          </p>
        </div>
      </aside>
    </div>

    <dialog id="admin-link-modal">
      <div class="modalhead">
        <h2>Tautan Reset Kata Sandi</h2>
        <button type="button" class="close" data-action="close-modal">${icon('close')}</button>
      </div>
      <div class="modalbody">
        <p id="reset-modal-info" class="muted" style="margin-bottom:12px"></p>
        <div class="field">
          <textarea id="reset-link-text" readonly rows="4" style="font-family:monospace;font-size:12px;width:100%"></textarea>
        </div>
        <div class="buttonrow">
          <button class="btn primary" type="button" data-action="copy-reset-link">Salin Tautan</button>
          <button class="btn" type="button" data-action="close-modal">Tutup</button>
        </div>
      </div>
    </dialog>

    <dialog id="admin-password-modal">
      <div class="modalhead">
        <h2>Ubah Password Akun</h2>
        <button type="button" class="close" data-action="close-modal">${icon('close')}</button>
      </div>
      <div class="modalbody">
        <form id="admin-set-pw-form">
          <input type="hidden" name="email" id="setpw-email">
          <p id="setpw-target-name" style="margin-bottom:16px"></p>
          <div class="field">
            <label for="setpw-password">Password Baru</label>
            <input type="text" id="setpw-password" name="password" minlength="6" placeholder="Minimal 6 karakter" value="Secure123!" required>
          </div>
          <p class="error" id="setpw-error"></p>
          <div class="buttonrow">
            <button class="btn primary" type="submit">Simpan Password</button>
            <button class="btn" type="button" data-action="close-modal">Batal</button>
          </div>
        </form>
      </div>
    </dialog>
  `;
}

export async function adminClassesListView(force = false) {
  let classesList = [];
  const now = Date.now();
  if (!force && state.cachedClasses && (now - state.cachedClassesTime < 30000)) {
    classesList = state.cachedClasses;
  } else {
    try {
      classesList = await api('/admin/classes');
      state.cachedClasses = classesList;
      state.cachedClassesTime = now;
    } catch (e) {
      console.warn('Gagal memuat kelas:', e.message);
      classesList = state.cachedClasses || [];
    }
  }

  return header('Kelola Kelas SECURE', 'Daftar Kelas & Akses', 'Buat kelas baru, tetapkan pengajar, dan enrol siswa ke kelas.') + `
    <div class="adminlayout" style="grid-template-columns:minmax(0,1fr) 360px">
      <section>
        <div class="panel panelpad" style="margin-bottom:28px">
          <h2>Daftar Kelas (${classesList.length})</h2>
          <p class="tiny muted">Pilih <strong>Kelola Peserta &amp; Guru</strong> untuk menambah atau mengeluarkan anggota kelas.</p>
          <div class="panel tablewrap" style="margin-top:16px">
            <table>
              <thead>
                <tr>
                  <th>KODE KELAS</th>
                  <th>NAMA KELAS</th>
                  <th>PERIODE</th>
                  <th>GURU</th>
                  <th>SISWA</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                ${classesList.length ? classesList.map(c => `
                  <tr>
                    <td><code>${esc(c.id)}</code></td>
                    <td>
                      <strong>${esc(c.name)}</strong>
                      ${c.description ? `<small>${esc(c.description)}</small>` : ''}
                    </td>
                    <td>${esc(c.period || '—')}</td>
                    <td><span class="tag blue">${c.teacherCount || 0} Pengajar</span></td>
                    <td><span class="tag green">${c.studentCount || 0} Siswa</span></td>
                    <td><span class="tag ${c.archivedAt ? 'orange' : 'green'}">${c.archivedAt ? 'Arsip' : 'Aktif'}</span></td>
                    <td style="white-space:nowrap">
                      <button type="button" class="btn primary" data-action="nav" data-nav="/admin/kelas/${esc(c.id)}" style="padding:4px 10px;font-size:13px">Kelola Peserta &amp; Guru</button>
                      <button type="button" class="btn text" data-action="admin-edit-class" data-id="${esc(c.id)}" data-name="${esc(c.name)}" data-period="${esc(c.period || '')}" data-desc="${esc(c.description || '')}" style="padding:4px 8px;font-size:13px">${icon('edit')} Edit</button>
                      <button type="button" class="btn text ${c.archivedAt ? '' : 'danger'}" data-action="admin-toggle-archive-class" data-id="${esc(c.id)}" data-archived="${Boolean(c.archivedAt)}" style="padding:4px 8px;font-size:13px">${c.archivedAt ? 'Buka Arsip' : 'Arsipkan'}</button>
                      <button type="button" class="btn text danger" data-action="admin-delete-class" data-id="${esc(c.id)}" data-name="${esc(c.name)}" style="padding:4px 8px;font-size:13px">${icon('trash')} Hapus</button>
                    </td>
                  </tr>
                `).join('') : '<tr><td colspan="7" style="text-align:center;padding:24px" class="muted">Belum ada kelas. Tambahkan melalui form di samping.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <aside>
        <form class="panel adminform" id="admin-create-class-form">
          <h2>Tambah Kelas Baru</h2>
          <p class="tiny muted">Buat ruang kelas baru untuk kegiatan belajar mengajar.</p>
          <div class="field">
            <label for="new-class-name">Nama Kelas</label>
            <input id="new-class-name" name="name" type="text" placeholder="contoh: Web Dasar Angkatan 2026" required>
          </div>
          <div class="field">
            <label for="new-class-id">ID / Slug Kelas (Opsional)</label>
            <input id="new-class-id" name="id" type="text" placeholder="contoh: web-dasar-2026">
            <small class="muted">Huruf kecil &amp; tanda minus. Dibuat otomatis jika kosong.</small>
          </div>
          <div class="field">
            <label for="new-class-period">Periode / Tahun Ajaran</label>
            <input id="new-class-period" name="period" type="text" placeholder="contoh: 2026/2027 Ganjil" required>
          </div>
          <div class="field">
            <label for="new-class-desc">Deskripsi Kelas</label>
            <textarea id="new-class-desc" name="description" placeholder="Deskripsi atau jadwal..." rows="3"></textarea>
          </div>
          <p class="error" id="form-error" tabindex="-1" role="alert"></p>
          <button class="btn primary full" type="submit">Buat Kelas Baru</button>
        </form>
      </aside>
    </div>
  ` + adminEditClassModal();
}

export async function adminClassDetailView(classId) {
  let cData = null, allUsers = [];
  try {
    const usersPromise = (state.cachedUsers && (Date.now() - state.cachedUsersTime < 30000)) ? Promise.resolve(state.cachedUsers) : api('/admin/users');
    const [cd, users] = await Promise.all([api(`/admin/classes/${classId}`), usersPromise]);
    cData = cd;
    allUsers = users;
    state.cachedUsers = users;
    state.cachedUsersTime = Date.now();
  } catch (e) {
    return `
      <div class="panel empty">
        <h2>Gagal memuat detail kelas</h2>
        <p>${esc(friendly(e))}</p>
        <div class="buttonrow" style="margin-top:16px">
          <button type="button" class="btn" data-action="nav" data-nav="/admin/kelas">${icon('arrowLeft')} Kembali ke Daftar Kelas</button>
        </div>
      </div>
    `;
  }

  const cls = cData.class;
  const teachers = cData.teachers || [];
  const members = cData.members || [];
  const assignedTeacherIds = new Set(teachers.filter(t => t.active !== false).map(t => t.id));
  const availableTeachers = allUsers.filter(u => u.roles?.includes('pengajar') && !assignedTeacherIds.has(u.id));
  const enrolledStudentIds = new Set(members.filter(m => m.active !== false).map(m => m.studentId || m.id));
  const availableStudents = allUsers.filter(u => u.roles?.includes('siswa') && !enrolledStudentIds.has(u.id));

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <button type="button" class="btn" data-action="nav" data-nav="/admin/kelas">${icon('arrowLeft')} Kembali ke Daftar Kelas</button>
      <div style="display:flex;gap:8px">
        <button type="button" class="btn text" data-action="admin-edit-class" data-id="${esc(cls.id)}" data-name="${esc(cls.name)}" data-period="${esc(cls.period || '')}" data-desc="${esc(cls.description || '')}" style="display:inline-flex;align-items:center;gap:6px">
          ${icon('edit')} Edit Info Kelas
        </button>
        <button type="button" class="btn text danger" data-action="admin-delete-class" data-id="${esc(cls.id)}" data-name="${esc(cls.name)}" style="display:inline-flex;align-items:center;gap:6px">
          ${icon('trash')} Hapus Kelas
        </button>
      </div>
    </div>
  ` +
  header('Kelola Kelas & Peserta', cls.name, `Kode: ${cls.id} · Periode: ${cls.period || '—'} · Status: ${cls.archivedAt ? 'Diarsipkan' : 'Aktif'}`) + `
    <div class="adminlayout" style="grid-template-columns:minmax(0,1.3fr) minmax(320px,1fr);gap:24px">
      <section>
        <div class="panel panelpad" style="margin-bottom:28px">
          <div class="sectionline">
            <h2 style="display:flex;align-items:center;gap:8px">${icon('teacher')} <span>Pengajar Kelas (${teachers.filter(t => t.active !== false).length})</span></h2>
          </div>
          <div class="panel tablewrap">
            <table>
              <thead>
                <tr>
                  <th>NAMA PENGAJAR</th>
                  <th>USERNAME / EMAIL</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                ${teachers.length ? teachers.map(t => `
                  <tr style="${t.active === false ? 'opacity:0.6' : ''}">
                    <td><strong>${esc(t.displayName || '—')}</strong></td>
                    <td><code>${esc(t.email || t.id)}</code></td>
                    <td><span class="tag ${t.active !== false ? 'green' : ''}">${t.active !== false ? 'Aktif' : 'Dihapus'}</span></td>
                    <td>${t.active !== false ? `<button type="button" class="btn text danger" data-action="admin-remove-teacher" data-cid="${esc(cls.id)}" data-uid="${esc(t.id)}" style="padding:4px 8px;font-size:13px">Hapus Penugasan</button>` : '—'}</td>
                  </tr>
                `).join('') : '<tr><td colspan="4" class="muted" style="text-align:center;padding:16px">Belum ada pengajar di kelas ini.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel panelpad">
          <div class="sectionline">
            <h2 style="display:flex;align-items:center;gap:8px">${icon('student')} <span>Siswa Terdaftar (${members.filter(m => m.active !== false).length})</span></h2>
          </div>
          <div class="panel tablewrap">
            <table>
              <thead>
                <tr>
                  <th>NAMA SISWA</th>
                  <th>USERNAME / EMAIL</th>
                  <th>KELAS SEKOLAH</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                ${members.length ? members.map(m => `
                  <tr style="${m.active === false ? 'opacity:0.6' : ''}">
                    <td><strong>${esc(m.displayName || '—')}</strong></td>
                    <td><code>${esc(m.email || m.studentId || m.id)}</code></td>
                    <td>${esc(m.schoolClass || '—')}</td>
                    <td><span class="tag ${m.active !== false ? 'green' : ''}">${m.active !== false ? 'Aktif' : 'Keluar'}</span></td>
                    <td>${m.active !== false ? `<button type="button" class="btn text danger" data-action="admin-unenroll-student" data-cid="${esc(cls.id)}" data-uid="${esc(m.studentId || m.id)}" style="padding:4px 8px;font-size:13px">Keluarkan</button>` : '—'}</td>
                  </tr>
                `).join('') : '<tr><td colspan="5" class="muted" style="text-align:center;padding:16px">Belum ada siswa terdaftar di kelas ini. Enrol melalui form di samping.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside>
        <form class="panel adminform" id="admin-assign-teacher-form" style="margin-bottom:24px">
          <input type="hidden" name="cid" value="${esc(cls.id)}">
          <h2>Tugaskan / Enrol Guru</h2>
          <p class="tiny muted">Tugaskan akun guru untuk mengampu kelas ini. Akun harus memiliki peran Pengajar.</p>
          <div class="field">
            <label for="assign-teacher-select">Pilih Guru (Pengajar)</label>
            <select id="assign-teacher-select" name="teacherId" required>
              <option value="">-- Pilih Guru --</option>
              ${availableTeachers.map(u => `<option value="${esc(u.id)}">${esc(u.displayName)} (${esc(u.email.replace('@secure.sch.id', ''))})</option>`).join('')}
            </select>
            ${!availableTeachers.length ? '<small class="muted">Tidak ada guru lain yang tersedia. Pastikan akun sudah dibuat dengan peran "Pengajar" di menu Pengguna & Akses.</small>' : ''}
          </div>
          <button class="btn primary full" type="submit" ${!availableTeachers.length ? 'disabled' : ''}>Tugaskan Guru ke Kelas</button>
        </form>

        <form class="panel adminform" id="admin-enroll-student-form">
          <input type="hidden" name="cid" value="${esc(cls.id)}">
          <h2>Enrol Siswa ke Kelas</h2>
          <p class="tiny muted">Daftarkan akun siswa ke kelas ini. Data kelas otomatis diambil dari profil siswa.</p>
          <div class="field">
            <label for="enroll-student-select">Pilih Siswa</label>
            <select id="enroll-student-select" name="studentId" required>
              <option value="">-- Pilih Siswa --</option>
              ${availableStudents.map(u => `<option value="${esc(u.id)}">${esc(u.displayName)} (${esc(u.email.replace('@secure.sch.id', ''))})${u.schoolClass ? ` · Kelas: ${esc(u.schoolClass)}` : ''}</option>`).join('')}
            </select>
            ${!availableStudents.length ? '<small class="muted">Tidak ada siswa lain yang tersedia. Buat akun siswa baru di menu Pengguna & Akses.</small>' : ''}
          </div>
          <button class="btn primary full" type="submit" ${!availableStudents.length ? 'disabled' : ''}>Enrol Siswa</button>
        </form>
      </aside>
    </div>
  ` + adminEditClassModal();
}
