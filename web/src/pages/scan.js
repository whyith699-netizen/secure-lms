import { Html5Qrcode } from 'html5-qrcode';
import { state, api, $, friendly } from '../state.js';
import { header, tag, button, esc, date } from '../ui.js';

export async function stopScan() {
  if (state.scanner) {
    let old = state.scanner;
    state.scanner = null;
    try { await old.stop(); } catch {}
    try { old.clear(); } catch {}
  }
}

export function scanView() {
  return header('Presensi', 'Hadir, lalu mulai belajar.', 'Pindai QR SECURE yang ditampilkan pengajar.') + `
    <div class="scanlayout">
      <section>
        <div id="scanner" class="live-scanner"></div>
        <p id="scan-message" class="tiny muted spaced" role="status">Kamera belum aktif. Foto dan video tidak disimpan.</p>
        <div class="buttonrow">
          ${button('Aktifkan kamera', 'start-scan', '', 'primary')}
          ${button('Hentikan kamera', 'stop-scan')}
        </div>
        <div id="scan-result"></div>
      </section>
      <aside>
        <h2>Sebelum memindai</h2>
        <p class="muted">Izinkan kamera, arahkan ke QR terbaru, lalu tunggu konfirmasi dari server.</p>
        <div class="notice">
          <p>Kamera bermasalah? Minta pengajar mencatat kehadiran secara manual. Tidak tersedia kode cadangan publik.</p>
        </div>
        <div class="notice">
          <p>Jika koneksi terputus setelah scan, periksa riwayat sebelum mengulang.</p>
        </div>
        ${button('Lihat riwayat', 'nav', 'data-nav="/riwayat"', 'spaced')}
      </aside>
    </div>
  `;
}

export async function startScan() {
  await stopScan();
  if (!window.isSecureContext) {
    throw Error('Kamera memerlukan HTTPS atau localhost.');
  }
  state.scanner = new Html5Qrcode('scanner');
  let handled = false;
  try {
    await state.scanner.start(
      { facingMode: 'environment' },
      { fps: 8, qrbox: { width: 220, height: 220 } },
      async text => {
        if (handled) return;
        handled = true;
        await stopScan();
        if (!$('scan-message')) return;
        $('scan-message').textContent = 'Memvalidasi kehadiran ke server…';
        try {
          const r = await api('/attendance/check-in', { method: 'POST', body: { payload: text } });
          if (!$('scan-result')) return;
          $('scan-message').textContent = r.code === 'ALREADY_RECORDED' ? 'Presensi sudah tercatat sebelumnya.' : 'Presensi berhasil disimpan.';
          $('scan-result').innerHTML = `
            <div class="successbox spaced">
              <h2>${r.code === 'ALREADY_RECORDED' ? 'Sudah tercatat.' : 'Kehadiran tersimpan.'}</h2>
              <p>${esc(r.record.meetingTitle)}</p>
              ${tag(r.record.status)}
              <p class="tiny spaced">${esc(date(r.record.checkedInAt, true))}</p>
              ${button('Lihat riwayat', 'nav', 'data-nav="/riwayat"')}
            </div>
          `;
        } catch (e) {
          if ($('scan-message')) {
            $('scan-message').textContent = friendly(e) + ' Tekan Aktifkan kamera untuk mencoba kembali.';
          }
        }
      },
      () => {}
    );
    if ($('scan-message')) {
      $('scan-message').textContent = 'Kamera aktif. Arahkan ke QR pengajar.';
    }
  } catch (e) {
    await stopScan();
    throw Error('Kamera tidak tersedia atau izinnya ditolak. Periksa izin browser dan gunakan HTTPS.');
  }
}
