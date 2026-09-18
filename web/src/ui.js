export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const date = (s, time = false) => s ? new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', ...(time ? { timeStyle: 'short' } : {}) }) : '—';

export const time = s => s ? new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';

export const statusText = s => ({
  hadir: 'Hadir',
  terlambat: 'Hadir',
  izin: 'Izin',
  sakit: 'Sakit',
  tidak_hadir: 'Tidak hadir',
  belum_hadir: 'Tidak hadir',
  belum_presensi: 'Tidak hadir',
  published: 'Terbit',
  draft: 'Draft',
  archived: 'Diarsipkan',
  open: 'Dibuka',
  closed: 'Ditutup'
})[s] || s;

export const tag = s => `<span class="tag ${['hadir', 'published', 'open', 'terlambat'].includes(s) ? 'green' : ['draft'].includes(s) ? 'orange' : ''}">${esc(statusText(s))}</span>`;

export const button = (text, action, extra = '', kind = '') => `<button type="button" class="btn ${kind}" data-action="${action}" ${extra}>${text}</button>`;

export const field = (label, name, value = '', type = 'text', required = true) => `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''}></div>`;

export const header = (eyebrow, title, sub, action = '') => `<div class="heading"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>${action}</div>`;

export const empty = (title, detail = '') => `<div class="panel empty"><h2>${esc(title)}</h2><p>${esc(detail)}</p></div>`;

export function brand() {
  return '<div class="brand"><img src="/logo-secure-tight.png" alt="Logo SECURE" class="brandlogo"><span>SECURE</span></div>';
}

export const parseCanvaUrl = raw => {
  if (!raw) return { url: '', embedUrl: '' };
  let s = String(raw).trim();
  const m = s.match(/src=["']([^"']+)["']/i);
  if (m) s = m[1];
  try {
    const u = new URL(s);
    if (!u.hostname.includes('canva.com')) return { url: s, embedUrl: '' };
    if (u.searchParams.has('embed')) return { url: s, embedUrl: s };
    const p = u.pathname.split('/').filter(Boolean);
    if (p[0] === 'design' && p[1]) {
      const did = p[1], tok = (p[2] && !['view', 'watch', 'edit', 'preview'].includes(p[2])) ? p[2] : '';
      return { url: s, embedUrl: tok ? `https://www.canva.com/design/${did}/${tok}/view?embed` : `https://www.canva.com/design/${did}/view?embed` };
    }
  } catch {}
  return { url: s, embedUrl: '' };
};

export const parseDriveUrl = raw => {
  if (!raw) return { url: '', embedUrl: '' };
  let s = String(raw).trim();
  const m = s.match(/src=["']([^"']+)["']/i);
  if (m) s = m[1];
  try {
    const u = new URL(s);
    if (u.hostname === 'drive.google.com') {
      const match = u.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/);
      if (match) return { url: s, embedUrl: `https://drive.google.com/file/d/${match[1]}/preview` };
    }
    if (u.hostname === 'docs.google.com') {
      const pres = u.pathname.match(/\/presentation\/d\/([A-Za-z0-9_-]{10,})/);
      if (pres) return { url: s, embedUrl: `https://docs.google.com/presentation/d/${pres[1]}/embed?start=false&loop=false&delayms=3000` };
      const doc = u.pathname.match(/\/document\/d\/([A-Za-z0-9_-]{10,})/);
      if (doc) return { url: s, embedUrl: `https://docs.google.com/document/d/${doc[1]}/preview` };
      const sheet = u.pathname.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]{10,})/);
      if (sheet) return { url: s, embedUrl: `https://docs.google.com/spreadsheets/d/${sheet[1]}/preview` };
    }
  } catch {}
  return { url: s, embedUrl: '' };
};

export const icons = {
  users: `<svg class="icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  classes: `<svg class="icon" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`,
  teacher: `<svg class="icon" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  student: `<svg class="icon" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>`,
  home: `<svg class="icon" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  book: `<svg class="icon" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>`,
  calendar: `<svg class="icon" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  scan: `<svg class="icon" viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>`,
  history: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  profile: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`,
  menu: `<svg class="icon" viewBox="0 0 24 24"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
  close: `<svg class="icon" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  link: `<svg class="icon" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  key: `<svg class="icon" viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`,
  arrowLeft: `<svg class="icon" viewBox="0 0 24 24"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
  arrowRight: `<svg class="icon" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  userPlus: `<svg class="icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>`,
  trash: `<svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  edit: `<svg class="icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`
};

export const icon = n => icons[n] || '';
