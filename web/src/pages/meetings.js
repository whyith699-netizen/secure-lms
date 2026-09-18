import { state, api } from '../state.js';
import { header, empty, esc, date, time, statusText, tag, button, field, icon } from '../ui.js';

export function localInput(d) {
  let x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function meetingList() {
  return state.meetingCache.length ? '<div class="panel listbox">' + state.meetingCache.map(m => `
    <div class="row">
      <div class="fileicon mono">${new Date(m.startsAt).getDate()}</div>
      <div class="rowbody">
        <h3>${esc(m.title)}</h3>
        <p>${esc(date(m.startsAt, true))} · ${esc(m.location || 'Lokasi belum diisi')}</p>
        <p>${(m.materialIds || []).length} materi · Jam ${esc(time(m.startsAt))}–${esc(time(m.endsAt))}</p>
      </div>
      ${tag(m.session?.state || 'Belum dibuka')}
      ${button(state.mode === 'pengajar' ? 'Kelola' : 'Buka', 'nav', `data-nav="/pertemuan/${m.id}"`)}
    </div>
  `).join('') + '</div>' : empty('Belum ada pertemuan');
}

export function quickNoteModal() {
  return `
    <dialog id="note-modal">
      <div class="modalhead">
        <h2>Catatan Kejadian Siswa</h2>
        ${button('Tutup', 'close-modal')}
      </div>
      <div class="modalbody">
        <form id="note-form">
          <input type="hidden" name="uid" id="note-uid">
          <p id="note-name" style="font-weight:600;margin-bottom:14px"></p>
          <div class="field">
            <label for="note-input">Catatan Kejadian</label>
            <textarea id="note-input" name="notes" placeholder="Tuliskan catatan kejadian khusus di sini (misal: izin sakit, dispensasi kegiatan, pulang lebih awal)..." maxlength="500"></textarea>
          </div>
          <p class="error" id="note-modal-error" tabindex="-1" role="alert"></p>
          <div style="display:flex;justify-content:flex-end;gap:10px">
            ${button('Batal', 'close-modal')}
            <button class="btn primary" type="submit">Simpan Catatan</button>
          </div>
        </form>
      </div>
    </dialog>
  `;
}

export function correctionModal() {
  return `
    <dialog id="correction">
      <div class="modalhead">
        <h2>Koreksi Presensi &amp; Kas</h2>
        ${button('Tutup', 'close-modal')}
      </div>
      <div class="modalbody">
        <form id="correction-form">
          <input type="hidden" name="uid" id="correction-uid">
          <p id="correction-name" style="font-weight:600;margin-bottom:16px"></p>
          <div class="field">
            <label for="correction-status">Status Kehadiran</label>
            <select name="status" id="correction-status">
              <option value="hadir">Hadir</option>
              <option value="tidak_hadir">Tidak hadir</option>
            </select>
          </div>
          <div class="field">
            <label for="correction-kas">Status Uang Kas</label>
            <select name="kasPaid" id="correction-kas">
              <option value="1">✓ Sudah Bayar Kas</option>
              <option value="0">Belum Bayar Kas</option>
            </select>
          </div>
          <div class="field">
            <label for="correction-notes">Catatan Kejadian Tertentu</label>
            <textarea id="correction-notes" name="notes" placeholder="Catat jika ada kejadian khusus di pertemuan ini..." maxlength="500"></textarea>
          </div>
          <p class="error" id="form-error" tabindex="-1" role="alert"></p>
          <div style="display:flex;justify-content:flex-end;gap:10px">
            ${button('Batal', 'close-modal')}
            <button class="btn primary" type="submit">Simpan Koreksi</button>
          </div>
        </form>
      </div>
    </dialog>
  `;
}

export async function meetingsView() {
  state.currentMeeting = null;
  const r = await api(`/classes/${state.cid}/meetings`);
  state.meetingCache = r.data;
  state.nextCursor = r.nextCursor;
  return header(
    'Agenda kelas',
    'Pertemuan',
    'Jadwal dan materi untuk setiap pertemuan.',
    state.mode === 'pengajar' ? button('Buat pertemuan', 'nav', 'data-nav="/pertemuan/baru"', 'primary') : ''
  ) + `
    <div id="meeting-list">${meetingList()}</div>
    <div class="loadmore">${state.nextCursor ? button('Muat lebih banyak', 'more-meetings') : ''}</div>
  `;
}

export async function meetingDetailView(meetingId) {
  state.currentMeeting = await api(`/meetings/${meetingId}`);
  const m = state.currentMeeting.meeting, materials = state.currentMeeting.materials;
  let teacherAttendanceHtml = '';

  if (state.mode === 'pengajar') {
    state.rosterCache = await api(`/meetings/${meetingId}/attendance`);
    const r = state.rosterCache;
    const totalHadir = r.data.filter(x => x.status === 'hadir').length;
    const totalKas = r.data.filter(x => x.kasPaid).length;
    const totalNotes = r.data.filter(x => (x.notes || '').trim().length > 0).length;

    teacherAttendanceHtml = `
      <section class="panel panelpad spaced" style="margin-top:28px">
        <div class="sectionline" style="flex-wrap:wrap;gap:12px">
          <div>
            <h2>Rekapitulasi Kehadiran, Kas, &amp; Catatan Kejadian</h2>
            <p class="muted" style="margin:0">Pantau kehadiran siswa, status pembayaran kas kelas, dan catatan kejadian khusus.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${button('Buka Layar Presensi (QR)', 'session', `data-id="${m.id}"`, 'primary')}
            ${button('Unduh CSV Presensi', 'export')}
          </div>
        </div>
        <div class="statstrip" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px;padding:16px 0">
          <div class="stat">
            <strong>${totalHadir} <span style="font-size:16px;color:var(--muted)">/ ${r.data.length}</span></strong>
            <span>Siswa Hadir (${r.data.length - totalHadir} Tidak Hadir)</span>
          </div>
          <div class="stat">
            <strong>${totalKas} <span style="font-size:16px;color:var(--muted)">/ ${r.data.length}</span></strong>
            <span>Sudah Bayar Kas (${r.data.length - totalKas} Belum Bayar)</span>
          </div>
          <div class="stat">
            <strong>${totalNotes}</strong>
            <span>Siswa Berstatus Catatan Khusus</span>
          </div>
        </div>
        <div class="tablewrap">
          <table>
            <thead>
              <tr>
                <th>SISWA</th>
                <th>STATUS KEHADIRAN</th>
                <th>STATUS KAS KELAS</th>
                <th>CATATAN KEJADIAN</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              ${r.data.length ? r.data.map(x => `
                <tr>
                  <td>
                    <strong>${esc(x.displayName)}</strong>
                    <small>${esc(x.schoolClass || '—')}</small>
                  </td>
                  <td>
                    <span class="tag ${x.status === 'hadir' ? 'green' : ''}">${x.status === 'hadir' ? 'Hadir' : 'Tidak hadir'}</span>
                  </td>
                  <td>
                    <button type="button" class="btn ${x.kasPaid ? 'btn-kas-paid' : 'btn-kas-unpaid'}" data-action="toggle-kas" data-uid="${esc(x.studentId)}" data-name="${esc(x.displayName)}">
                      ${x.kasPaid ? '✓ Sudah Bayar' : 'Belum Bayar'}
                    </button>
                  </td>
                  <td>
                    ${x.notes ? `
                      <div style="display:flex;align-items:center;gap:6px">
                        <span class="student-note" title="${esc(x.notes)}">${esc(x.notes)}</span>
                        <button type="button" class="btn text" data-action="edit-note" data-uid="${esc(x.studentId)}" data-name="${esc(x.displayName)}" data-note="${esc(x.notes)}" style="padding:2px 6px;font-size:12px">
                          ${icon('edit')}
                        </button>
                      </div>
                    ` : `
                      <button type="button" class="btn text" data-action="edit-note" data-uid="${esc(x.studentId)}" data-name="${esc(x.displayName)}" data-note="" style="padding:2px 6px;font-size:12px;color:var(--muted)">
                        + Tambah Catatan
                      </button>
                    `}
                  </td>
                  <td>
                    <button type="button" class="btn text" data-action="correct" data-uid="${esc(x.studentId)}" style="padding:4px 8px;font-size:13px">Ubah</button>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="5" style="text-align:center;padding:24px" class="muted">Belum ada peserta terdaftar. Buka sesi presensi untuk menyalin peserta.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  return button('← Semua pertemuan', 'nav', 'data-nav="/pertemuan"', 'back') +
    header('Pertemuan', m.title, `${date(m.startsAt, true)} · ${m.location || 'Lokasi belum diisi'}`, state.mode === 'pengajar' ? button('Kelola info pertemuan', 'nav', `data-nav="/pertemuan/${m.id}/edit"`) : '') +
    `<div class="meeting-summary panel panelpad">
      <div>
        <span class="eyebrow">JADWAL KELAS</span>
        <strong>${esc(time(m.startsAt))}–${esc(time(m.endsAt))}</strong>
      </div>
      <div>
        <span class="eyebrow">STATUS PRESENSI</span>
        ${tag(state.currentMeeting.session?.state || 'Belum dibuka')}
      </div>
    </div>` +
    teacherAttendanceHtml +
    `<section class="spaced">
      <div class="sectionline">
        <div>
          <h2>Materi pertemuan</h2>
          <p class="muted">Materi yang dipilih pengajar khusus untuk pertemuan ini.</p>
        </div>
        ${state.mode === 'pengajar' ? button('Atur materi', 'nav', `data-nav="/pertemuan/${m.id}/edit"`) : ''}
      </div>
      ${materials.length ? '<div class="panel listbox">' + materials.map(x => `
        <div class="row">
          <div class="fileicon mono">{ }</div>
          <div class="rowbody">
            <h3>${esc(x.title)}</h3>
            <p>${esc(x.topic)} · ${esc(statusText(x.status))}</p>
          </div>
          ${button('Buka materi', 'nav', `data-nav="/materi/${x.id}"`)}
        </div>
      `).join('') + '</div>' : empty('Belum ada materi pada pertemuan ini', state.mode === 'pengajar' ? 'Klik Atur materi untuk menautkan materi dari pustaka kelas.' : 'Pengajar belum menautkan materi untuk pertemuan ini.')}
    </section>
    ${state.mode !== 'pengajar' && state.currentMeeting.session?.state === 'open' ? `
      <div class="notice spaced">
        <p>Presensi sedang dibuka. Gunakan menu Scan presensi untuk melakukan check-in.</p>
      </div>
    ` : ''}` +
    quickNoteModal() +
    correctionModal();
}

export async function meetingEditor(meetingId) {
  if (meetingId && (!state.currentMeeting || state.currentMeeting.meeting?.id !== meetingId)) {
    try {
      state.currentMeeting = await api(`/meetings/${meetingId}`);
    } catch {
      state.currentMeeting = null;
    }
  } else if (!meetingId) {
    state.currentMeeting = null;
  }

  let m = state.currentMeeting?.meeting || null;
  let t = m ? new Date(m.startsAt) : new Date();
  t.setSeconds(0, 0);
  const all = await api(`/classes/${state.cid}/materials?limit=50`);
  const selected = new Set(m?.materialIds || []);

  return header(
    'Agenda kelas',
    m ? 'Kelola pertemuan' : 'Buat pertemuan',
    m ? 'Atur detail jadwal dan materi pertemuan.' : 'Tautkan materi yang akan terlihat pada detail pertemuan.'
  ) + `
    <form id="meeting-form" class="panel panelpad editorform">
      ${field('Judul pertemuan', 'title', m?.title || '')}
      ${field('Lokasi', 'location', m?.location || '', 'text', false)}
      <div class="fieldgrid">
        ${field('Mulai kelas', 'startsAt', localInput(m?.startsAt || t), 'datetime-local')}
        ${field('Selesai kelas', 'endsAt', localInput(m?.endsAt || (+t + 90 * 60000)), 'datetime-local')}
      </div>
      <fieldset class="material-picker">
        <legend>Materi pertemuan</legend>
        <p class="tiny muted">Materi tetap muncul di pustaka umum. Pilihan ini hanya menentukan materi pada halaman pertemuan.</p>
        ${all.data.length ? all.data.map(x => `
          <label class="checkrow">
            <input type="checkbox" name="materialIds" value="${esc(x.id)}" ${selected.has(x.id) ? 'checked' : ''}>
            <span><strong>${esc(x.title)}</strong><small>${esc(x.topic)} · ${esc(statusText(x.status))}</small></span>
          </label>
        `).join('') : '<p class="muted">Belum ada materi. Simpan materi terlebih dahulu.</p>'}
      </fieldset>
      ${all.nextCursor ? '<p class="notice">Hanya 50 materi terbaru yang dapat dipilih di form ini. Tambahkan pencarian server sebelum kelas melebihi batas tersebut.</p>' : ''}
      <p class="error" id="form-error" tabindex="-1" role="alert"></p>
      <div class="buttonrow">
        ${button('Batal', 'nav', m ? `data-nav="/pertemuan/${m.id}"` : 'data-nav="/pertemuan"')}
        <button class="btn primary" type="submit">${m ? 'Simpan perubahan' : 'Buat pertemuan'}</button>
      </div>
    </form>
  `;
}
