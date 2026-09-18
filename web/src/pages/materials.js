import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { state, api, $ } from '../state.js';
import { header, empty, esc, date, statusText, tag, button, field, parseCanvaUrl, parseDriveUrl } from '../ui.js';

export function renderEmbedRow(item = { title: '', url: '' }, idx = 0) {
  return `
    <div class="embed-item-card panel" data-embed-row style="padding:14px 16px;margin-bottom:12px;background:#ffffff;border:1px solid var(--line);border-radius:var(--radius)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="guide-badge" style="font-size:9px">Dokumen #${idx + 1}</span>
          <strong class="embed-row-title" style="font-size:13px">${esc(item.title || `Dokumen / Presentasi #${idx + 1}`)}</strong>
        </div>
        <button type="button" class="btn text" data-action="remove-embed-row" style="color:#dc2626;padding:2px 8px;font-size:12px;border:1px solid #fee2e2;border-radius:4px" title="Hapus baris embed ini">× Hapus</button>
      </div>
      <div class="embed-input-grid" style="display:grid;grid-template-columns:1fr 2fr;gap:12px">
        <div class="field" style="margin:0">
          <label style="font-size:12px;font-weight:600">Judul Dokumen / PPT</label>
          <input type="text" class="embed-title-input" placeholder="Contoh: PPT Modul 1 / PPT Studi Kasus" value="${esc(item.title || '')}">
        </div>
        <div class="field" style="margin:0">
          <label style="font-size:12px;font-weight:600">Tautan Share Google Drive / Slides / Canva</label>
          <input type="url" class="embed-url-input" placeholder="https://docs.google.com/presentation/d/... atau https://www.canva.com/design/..." value="${esc(item.url || '')}">
        </div>
      </div>
    </div>
  `;
}

export function materialList() {
  const query = $('material-search')?.value?.toLowerCase() || '';
  const data = state.materialCache.filter(m => m.title.toLowerCase().includes(query));
  return data.length ? '<div class="panel listbox">' + data.map(m => `
    <div class="row">
      <div class="fileicon mono">{ }</div>
      <div class="rowbody">
        <h3>${esc(m.title)}</h3>
        <p>${esc(m.topic)} · ${esc(date(m.updatedAt))}</p>
      </div>
      ${state.mode === 'pengajar' ? tag(m.status) : ''}
      ${button('Buka', 'nav', `data-nav="/materi/${m.id}"`)}
    </div>
  `).join('') + '</div>' : empty('Materi belum tersedia', 'Coba ubah pencarian atau tunggu pengajar menerbitkan materi.');
}

export async function materialsView() {
  const r = await api(`/classes/${state.cid}/materials`);
  state.materialCache = r.data;
  state.nextCursor = r.nextCursor;
  return header(
    'Pustaka kelas',
    'Materi belajar',
    'Materi dimuat bertahap, 25 per halaman.',
    state.mode === 'pengajar' ? button('Tambah materi', 'nav', 'data-nav="/materi/baru"', 'primary') : ''
  ) + `
    <div class="toolbar">
      <div class="search">
        <input id="material-search" placeholder="Cari pada materi yang dimuat…" aria-label="Cari materi" style="padding-left:12px">
      </div>
    </div>
    <div id="material-list">${materialList()}</div>
    <div class="loadmore">${state.nextCursor ? button('Muat lebih banyak', 'more-materials') : ''}</div>
  `;
}

export async function detailView(materialId) {
  if (materialId) {
    state.currentMaterial = await api(`/materials/${materialId}`);
  }
  let m = state.currentMaterial;
  if (!m) return empty('Materi tidak ditemukan');

  const bodyText = (m.body || '').trim();
  const body = bodyText ? `<article class="panel panelpad prose">${DOMPurify.sanitize(marked.parse(bodyText), {
    FORBID_TAGS: ['img', 'iframe', 'style', 'form', 'input', 'button', 'video', 'audio'],
    FORBID_ATTR: ['style'],
    ALLOW_DATA_ATTR: false
  })}</article>` : '';

  const embedsList = (m.embeds && Array.isArray(m.embeds) && m.embeds.length) ? m.embeds : [];
  if (!embedsList.length) {
    const canvaEmbedSrc = m.canvaEmbedUrl || (m.canvaUrl ? parseCanvaUrl(m.canvaUrl).embedUrl : '');
    if (canvaEmbedSrc) embedsList.push({ type: 'canva', title: 'Presentasi Canva', url: m.canvaUrl || canvaEmbedSrc, embedUrl: canvaEmbedSrc });
    const driveEmbedSrc = m.driveEmbedUrl || (m.driveUrl ? parseDriveUrl(m.driveUrl).embedUrl : '');
    if (driveEmbedSrc) embedsList.push({ type: 'drive', title: 'Presentasi Google Drive', url: m.driveUrl || driveEmbedSrc, embedUrl: driveEmbedSrc });
  }

  let embedsHtml = '';
  if (embedsList.length) {
    embedsHtml = embedsList.map((emb, idx) => {
      const isCanva = emb.type === 'canva' || emb.url?.includes('canva.com');
      const embedSrc = emb.embedUrl || (isCanva ? parseCanvaUrl(emb.url).embedUrl : parseDriveUrl(emb.url).embedUrl);
      const title = emb.title || (isCanva ? `Presentasi Canva ${embedsList.length > 1 ? '#' + (idx + 1) : ''}`.trim() : (emb.url?.includes('presentation') ? `Google Slides ${embedsList.length > 1 ? '#' + (idx + 1) : ''}`.trim() : `Google Drive ${embedsList.length > 1 ? '#' + (idx + 1) : ''}`.trim()));
      const badge = isCanva ? 'Canva' : (emb.url?.includes('presentation') ? 'Google Slides' : (emb.url?.includes('document') ? 'Google Docs' : 'Google Drive'));
      const openLabel = isCanva ? 'Buka di Canva ↗' : 'Buka di Drive ↗';
      const openUrl = emb.url || embedSrc;

      if (!embedSrc) {
        return `
          <section class="panel panelpad" style="margin-top:20px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
              <div style="display:flex;align-items:center;gap:10px">
                <span class="guide-badge">${badge}</span>
                <strong style="font-size:14px">${esc(title)}</strong>
              </div>
              <a class="btn" href="${esc(openUrl)}" target="_blank" rel="noopener noreferrer">${openLabel}</a>
            </div>
          </section>
        `;
      }

      return `
        <section class="drive-embed panel" style="margin-top:24px">
          <div class="embed-topbar" style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--line);background:var(--side)">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="guide-badge">${badge}</span>
              <strong style="font-size:14px">${esc(title)}</strong>
            </div>
            <span class="tiny muted" style="font-weight:600">Dokumen #${idx + 1}</span>
          </div>
          <iframe src="${esc(embedSrc)}" title="${esc(title)}" loading="lazy" allow="fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
          <div class="drive-fallback">
            <span style="font-weight:600">${esc(title)}</span>
            <a class="btn" href="${esc(openUrl)}" target="_blank" rel="noopener noreferrer">${openLabel}</a>
          </div>
        </section>
      `;
    }).join('');
  }

  return button('← Kembali', 'nav', 'data-nav="/materi"', 'back') +
    header(m.topic, m.title, m.summary, state.mode === 'pengajar' ? button('Edit materi', 'nav', `data-nav="/materi/${m.id}/edit"`) : '') +
    body +
    embedsHtml +
    (m.link ? `<div class="notice" style="margin-top:24px"><a href="${esc(m.link)}" target="_blank" rel="noopener noreferrer">Buka referensi tambahan ↗</a></div>` : '');
}

export async function editorView(materialId) {
  if (materialId && (!state.currentMaterial || state.currentMaterial.id !== materialId)) {
    try {
      state.currentMaterial = await api(`/materials/${materialId}`);
    } catch {
      state.currentMaterial = null;
    }
  } else if (!materialId) {
    state.currentMaterial = null;
  }

  let m = state.currentMaterial || {};
  let initialEmbeds = [];
  if (m.embeds && Array.isArray(m.embeds) && m.embeds.length) {
    initialEmbeds = m.embeds;
  } else {
    if (m.canvaUrl) initialEmbeds.push({ title: 'Presentasi Canva', url: m.canvaUrl });
    if (m.driveUrl) initialEmbeds.push({ title: m.driveUrl.includes('/presentation/') ? 'Google Slides' : 'Presentasi Google Drive', url: m.driveUrl });
  }
  if (!initialEmbeds.length) {
    initialEmbeds.push({ title: '', url: '' });
  }

  return header('Pustaka kelas', m.id ? 'Edit materi' : 'Tambah materi', 'Pilih metode yang sesuai: artikel Markdown, presentasi Canva, atau Google Drive.') + `
    <form id="material-form" class="panel panelpad editorform">
      ${field('Judul', 'title', m.title || '')}
      ${field('Ringkasan', 'summary', m.summary || '', 'text', false)}
      <div class="fieldgrid">
        ${field('Topik', 'topic', m.topic || 'JavaScript')}
        <div class="field">
          <label for="status">Status</label>
          <select id="status" name="status">
            ${['draft', 'published', 'archived'].map(s => `<option value="${s}" ${(m.status || 'draft') === s ? 'selected' : ''}>${statusText(s)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="body">Isi materi (Markdown)</label>
        <textarea id="body" name="body" class="mono" rows="12" placeholder="Tulis isi materi dalam format Markdown jika menggunakan artikel...">${esc(m.body || '')}</textarea>
      </div>
      <div class="embed-instructions panel">
        <div class="embed-guide-header">
          <strong>Panduan Sematkan (Embed) Dokumen &amp; Presentasi</strong>
          <p class="tiny muted" style="margin-top:4px">Bisa sematkan lebih dari 1 file presentasi (contoh: 2 file PPT di Google Drive atau Canva). Ikuti langkah berikut agar pratinjau langsung tampil:</p>
        </div>
        <div class="embed-guide-grid">
          <div class="embed-guide-card">
            <div class="embed-guide-title">
              <span class="guide-badge">Drive</span>
              <strong>Langkah Embed Google Drive / Slides:</strong>
            </div>
            <ol class="embed-steps">
              <li>Buka file PPT atau dokumen di <strong>Google Drive</strong> / <strong>Google Slides</strong>.</li>
              <li>Klik tombol <strong>Bagikan</strong> (<em>Share</em>) di pojok kanan atas.</li>
              <li>Ubah akses umum menjadi <strong>"Siapa saja yang memiliki tautan"</strong> (<em>Anyone with link</em>) dengan akses <em>Pelihat</em>.</li>
              <li>Salin tautan dan tempelkan ke kolom URL di bawah.</li>
            </ol>
          </div>
          <div class="embed-guide-card">
            <div class="embed-guide-title">
              <span class="guide-badge">Canva</span>
              <strong>Langkah Embed Canva:</strong>
            </div>
            <ol class="embed-steps">
              <li>Buka desain / slide di <strong>Canva</strong>.</li>
              <li>Klik tombol <strong>Bagikan</strong> (<em>Share</em>) di pojok kanan atas.</li>
              <li>Pilih <strong>Tautan hanya-lihat</strong> (<em>View-only link</em>) atau opsi <strong>Sematkan</strong> (<em>Embed</em>).</li>
              <li>Salin tautan atau kode embed dan tempelkan ke kolom URL di bawah.</li>
            </ol>
          </div>
        </div>
      </div>
      <div class="panel" style="margin:20px 0;padding:18px;border:1px solid var(--line);border-radius:var(--radius);background:var(--side)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:14px">
          <div>
            <strong style="font-size:14px;color:#000000;display:block">Daftar Sematan Dokumen / Presentasi (Bisa lebih dari 1)</strong>
            <p class="tiny muted" style="margin-top:2px">Tambahkan semua file PPT atau dokumen pendukung. Misalnya jika ada PPT Teori dan PPT Studi Kasus di Google Drive, keduanya bisa disematkan bersamaan.</p>
          </div>
          <button type="button" class="btn" data-action="add-embed-row" style="font-weight:600;font-size:13px;background:#000;color:#fff">+ Tambah Embed Dokumen / PPT</button>
        </div>
        <div id="embed-items-list">
          ${initialEmbeds.map((emb, i) => renderEmbedRow(emb, i)).join('')}
        </div>
      </div>
      ${field('Tautan referensi HTTPS tambahan', 'link', m.link || '', 'url', false)}
      <p class="error" id="form-error" tabindex="-1" role="alert"></p>
      <div class="buttonrow">
        ${button('Batal', 'nav', 'data-nav="/materi"')}
        <button class="btn primary" type="submit">Simpan materi</button>
      </div>
    </form>
  `;
}
