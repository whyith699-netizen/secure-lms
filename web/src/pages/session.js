import QRCode from 'qrcode';
import { state, api, $, friendly } from '../state.js';
import { header, empty, esc, date, tag, button, icon } from '../ui.js';
import { quickNoteModal, correctionModal } from './meetings.js';

export function rosterTable(r) {
  if (!r.session) return empty('Sesi belum dibuka', 'Daftar peserta disalin saat sesi pertama kali dibuka.');
  const totalHadir = r.data.filter(x => x.status === 'hadir').length;
  const totalKas = r.data.filter(x => x.kasPaid).length;

  return `
    <div class="roster-stats-strip" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px;padding:10px 14px;background:var(--side);border:1px solid var(--line);border-radius:6px;font-size:13px">
      <span>Kehadiran: <strong>${totalHadir}</strong> / ${r.data.length} Hadir</span>
      <span style="color:var(--line)">|</span>
      <span>Kas: <strong>${totalKas}</strong> Sudah Bayar · <strong>${r.data.length - totalKas}</strong> Belum Bayar</span>
      ${r.session.state === 'closed' && !r.session.finalizedAt ? '<span style="color:var(--line)">|</span><span class="muted">Rekap difinalisasi</span>' : ''}
    </div>
    <div class="panel tablewrap">
      <table>
        <thead>
          <tr>
            <th>SISWA</th>
            <th>STATUS KEHADIRAN</th>
            <th>STATUS KAS</th>
            <th>CATATAN KEJADIAN</th>
            <th>AKSI</th>
          </tr>
        </thead>
        <tbody>
          ${r.data.map(x => `
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
              <td>${button('Ubah', 'correct', `data-uid="${esc(x.studentId)}"`, 'text')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function clearQR(note) {
  state.qrState = null;
  if ($('qr-frame')) {
    $('qr-frame').classList.add('off');
    $('qr-frame').innerHTML = '<strong>QR tidak aktif</strong>';
    $('qr-note').textContent = note;
  }
}

export async function drawQR(meetingId) {
  if (!state.qrState || !$('qr-frame')) return;
  const q = state.qrState;
  const url = await QRCode.toDataURL(q.payload, {
    margin: 4,
    width: 320,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' }
  });
  if (state.qrState !== q || (meetingId && q.meetingId !== meetingId)) return;
  $('qr-frame').classList.remove('off');
  $('qr-frame').innerHTML = `<img src="${url}" alt="QR presensi pertemuan aktif" width="264" height="264">`;
  if ($('qr-note')) {
    $('qr-note').innerHTML = `<strong>QR Presensi Aktif</strong><br>Siswa dapat memindai QR ini. QR aktif tanpa batas waktu dan akan tetap terbuka sampai pengajar menutup presensi.`;
  }
}

export function startSessionUpdates(meetingId) {
  clearInterval(state.poll);
  state.poll = setInterval(async () => {
    if (document.hidden) return;
    try {
      state.rosterCache = await api(`/meetings/${meetingId}/attendance`);
      if (!$('roster-panel')) return;
      $('roster-panel').innerHTML = rosterTable(state.rosterCache);
      $('session-status').innerHTML = tag(state.rosterCache.session?.state || 'Belum dibuka');
      if (state.qrState && state.rosterCache.session?.state !== 'open') {
        clearQR('Sesi presensi telah ditutup oleh pengajar.');
      }
      $('roster-note').textContent = 'Terakhir diperbarui ' + new Date().toLocaleTimeString('id-ID');
    } catch (e) {
      if ($('roster-note')) $('roster-note').textContent = friendly(e);
    }
  }, 15000);

  if (state.qrState?.meetingId === meetingId) {
    drawQR(meetingId);
  }
}

export function stopSessionUpdates() {
  clearInterval(state.poll);
}

export async function sessionView(meetingId) {
  state.rosterCache = await api(`/meetings/${meetingId}/attendance`);
  const r = state.rosterCache, s = r.session;

  if (s?.state === 'open' && !state.qrState) {
    try {
      const qrRes = await api(`/meetings/${meetingId}/qr`, { method: 'POST' });
      state.qrState = { ...qrRes, meetingId };
    } catch {}
  }

  return header(
    'Presensi kelas',
    r.meeting.title,
    `${date(r.meeting.startsAt, true)} · ${r.meeting.location || ''}`,
    button('← Kembali ke Pertemuan', 'nav', `data-nav="/pertemuan/${meetingId}"`)
  ) + `
    <div class="sessionlayout">
      <section class="panel qrpanel">
        <div class="sectionline">
          <span class="eyebrow">KODE PRESENSI</span>
          <span id="session-status">${tag(s?.state || 'Belum dibuka')}</span>
        </div>
        <div id="qr-frame" class="qrframe ${state.qrState ? '' : 'off'}">
          <div>
            <strong>${s?.state === 'closed' ? 'Presensi ditutup' : state.qrState ? 'QR aktif' : 'QR belum ditampilkan'}</strong>
            <p class="tiny">${s ? 'Buka atau generate QR untuk mulai menerima kehadiran siswa.' : 'Buka sesi presensi untuk mulai menerima kehadiran siswa.'}</p>
          </div>
        </div>
        <p class="tiny muted" id="qr-note" style="line-height:1.5;margin-top:12px">
          ${s?.state === 'closed' ? 'Presensi telah ditutup oleh pengajar.' : s?.state === 'open' ? 'QR presensi aktif tanpa batas waktu. Presensi akan tetap terbuka sampai Anda menekan tombol Tutup presensi di bawah.' : 'Buka sesi presensi untuk mulai menampilkan QR presensi.'}
        </p>
        <div style="margin-top:16px;display:flex;flex-direction:column;gap:10px">
          ${!s ? button('Buka sesi presensi', 'open-session', '', 'primary full') : s.state === 'open' ? `
            <div style="display:flex;flex-direction:column;gap:10px">
              ${button('Perbarui Tampilan QR', 'generate-qr', '', 'primary full')}
              ${button('Tutup presensi', 'close-session', '', 'danger full')}
            </div>
          ` : ''}
        </div>
      </section>
      <section>
        <div class="sectionline">
          <h2>Kehadiran &amp; Kas Peserta</h2>
          ${button('Unduh CSV', 'export')}
        </div>
        <p id="roster-note" class="tiny muted">Pembaruan otomatis berkala saat halaman aktif.</p>
        <div id="roster-panel">${rosterTable(r)}</div>
      </section>
    </div>
  ` + quickNoteModal() + correctionModal();
}
