import { state, api } from '../state.js';
import { header, empty, esc, date, time, tag, button } from '../ui.js';

export async function homeView() {
  const c = state.classes.find(x => x.id === state.cid);
  const r = await api(`/classes/${state.cid}/meetings?limit=5`);
  const next = r.data.find(m => new Date(m.closesAt) > new Date()) || r.data[0];

  const heroSection = next ? `
    <div class="hero">
      <div class="herotext">
        <p class="eyebrow">PERTEMUAN</p>
        <h2>${esc(next.title)}</h2>
        <div class="metadata">
          <span>${esc(date(next.startsAt, true))}</span>
          <span>${esc(next.location || 'Lokasi belum diisi')}</span>
        </div>
        ${state.mode === 'pengajar' 
          ? button('Kelola presensi', 'session', `data-id="${next.id}"`, 'primary') 
          : button('Scan presensi', 'nav', 'data-nav="/scan"', 'primary')}
      </div>
      <div class="heroside">
        <span class="month">${esc(new Date(next.startsAt).toLocaleDateString('id-ID', { month: 'short' }))}</span>
        <span class="day">${new Date(next.startsAt).getDate()}</span>
        <span class="tiny">${tag(next.session?.state || 'Belum dibuka')}</span>
      </div>
    </div>
  ` : empty('Pertemuan belum tersedia', state.mode === 'pengajar' ? 'Buat pertemuan pertama dari menu Pertemuan & presensi.' : 'Jadwal akan muncul setelah dibuat pengajar.');

  return header(
    c?.name || 'SECURE',
    `Halo, ${state.me.displayName.split(' ')[0]}.`,
    state.mode === 'pengajar' ? 'Materi dan kehadiran, siap untuk kelas berikutnya.' : 'Satu langkah kecil, satu hal baru yang bisa kamu buat.'
  ) + heroSection + `
    <div class="twocol">
      <div class="panel panelpad">
        <h2>Pustaka belajar</h2>
        <p class="muted">Penjelasan, contoh kode, dan lampiran materi kelas.</p>
        ${button('Buka materi', 'nav', 'data-nav="/materi"')}
      </div>
      <div class="panel panelpad">
        <h2>${state.mode === 'pengajar' ? 'Siapkan pertemuan' : 'Jejak kehadiran'}</h2>
        <p class="muted">${state.mode === 'pengajar' ? 'Atur jadwal dan jendela waktu presensi.' : 'Lihat catatan kehadiran dari seluruh kelasmu.'}</p>
        ${button(state.mode === 'pengajar' ? 'Lihat pertemuan' : 'Lihat riwayat', 'nav', `data-nav="${state.mode === 'pengajar' ? '/pertemuan' : '/riwayat'}"`)}
      </div>
    </div>
  `;
}
