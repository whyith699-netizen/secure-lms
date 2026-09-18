import { state, api } from '../state.js';
import { header, empty, esc, date, time, tag, button } from '../ui.js';

export function historyTable() {
  return state.historyCache.length ? `
    <div class="panel tablewrap">
      <table>
        <thead>
          <tr>
            <th>PERTEMUAN</th>
            <th>TANGGAL</th>
            <th>CHECK-IN</th>
            <th>STATUS</th>
            <th>SUMBER</th>
          </tr>
        </thead>
        <tbody>
          ${state.historyCache.map(r => `
            <tr>
              <td>${esc(r.meetingTitle)}</td>
              <td>${date(r.meetingStartsAt)}</td>
              <td>${time(r.checkedInAt)}</td>
              <td>${tag(r.status)}</td>
              <td>${esc(r.source)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : empty('Belum ada catatan kehadiran', 'Catatan muncul setelah check-in atau setelah pengajar memfinalisasi pertemuan.');
}

export async function historyView() {
  const r = await api('/me/attendance');
  state.historyCache = r.data;
  state.nextCursor = r.nextCursor;
  return header('Kehadiran', 'Riwayat presensi', 'Hanya catatan milik akunmu yang ditampilkan.') + `
    <div id="history-list">${historyTable()}</div>
    <div class="loadmore">${state.nextCursor ? button('Muat lebih banyak', 'more-history') : ''}</div>
  `;
}
