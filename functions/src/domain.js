import {createHash,randomBytes} from 'node:crypto';
export class AppError extends Error {constructor(code,message,status=400){super(message);this.code=code;this.status=status;}}
export const fail=(ok,code,message,status=400)=>{if(!ok)throw new AppError(code,message,status)};
export const hash=s=>createHash('sha256').update(s).digest('hex');
export const attendanceId=(meetingId,studentId)=>hash(JSON.stringify([meetingId,studentId]));
export const emailKey=email=>hash(normalizeEmail(email));
export function normalizeEmail(value){const s=String(value||'').trim().toLowerCase();fail(s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),'INVALID_EMAIL','Email tidak valid.');return s;}
export function str(v,name,max=200,required=true){fail(typeof v==='string','INVALID_INPUT',`${name} harus berupa teks.`);v=v.trim();fail((!required||v.length>0)&&v.length<=max,'INVALID_INPUT',`${name} wajib diisi dan maksimal ${max} karakter.`);return v;}
export function docId(v){fail(typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v),'INVALID_ID','Identitas data tidak valid.');return v;}
export const makeToken=()=>randomBytes(24).toString('hex');
export const ms=t=>t?.toMillis?t.toMillis():Number(t);
export function validateToken({token,session,tokenHash,now}){
 fail(session?.state==='open','SESSION_CLOSED','Presensi belum dibuka atau sudah ditutup.',409);
 fail(now>=ms(session.opensAt)&&now<ms(session.closesAt),'SESSION_CLOSED','Di luar waktu presensi.',409);
 fail(token&&!token.revokedAt&&session.activeTokenHash===tokenHash&&token.version===session.qrVersion&&now<ms(token.expiresAt),'QR_INVALID_OR_EXPIRED','QR tidak aktif. Pindai QR terbaru dari pengajar.',409);
}
export const automaticStatus=(now,lateAfter)=>now<=ms(lateAfter)?'hadir':'terlambat';
export const statuses=['hadir','terlambat','izin','sakit','tidak_hadir'];
export function schedule(input){let fields={};for(const k of ['startsAt','endsAt']){let n=Date.parse(input[k]);fail(Number.isFinite(n),'INVALID_TIME',`Waktu ${k} tidak valid.`);fields[k]=n;}
 fail(fields.startsAt<fields.endsAt,'INVALID_TIME','Waktu mulai kelas harus sebelum waktu selesai.');fields.opensAt=input.opensAt?Date.parse(input.opensAt):fields.startsAt;fields.lateAfter=input.lateAfter?Date.parse(input.lateAfter):fields.endsAt;fields.closesAt=input.closesAt?Date.parse(input.closesAt):(fields.endsAt+86400000);return fields;
}
export function safeCSV(rows){return '\ufeff'+rows.map(r=>r.map(v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}).join(',')).join('\r\n');}
export function safeUrl(value){if(!value)return '';let u;try{u=new URL(value)}catch{throw new AppError('INVALID_URL','URL tidak valid.')}fail(u.protocol==='https:','INVALID_URL','Tautan harus HTTPS.');return u.href;}
export function driveEmbed(value){
 if(!value)return {driveUrl:'',driveEmbedUrl:''};
 const driveUrl=safeUrl(value),u=new URL(driveUrl);let match,driveEmbedUrl='';
 if(u.hostname==='drive.google.com'&&(match=u.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]{10,})/)))driveEmbedUrl='https:'+'//drive.google.com/file/d/'+match[1]+'/preview';
 if(u.hostname==='docs.google.com'&&(match=u.pathname.match(/^\/presentation\/d\/([A-Za-z0-9_-]{10,})/)))driveEmbedUrl='https:'+'//docs.google.com/presentation/d/'+match[1]+'/embed?start=false&loop=false&delayms=3000';
 fail(driveEmbedUrl,'INVALID_DRIVE_URL','Gunakan tautan file Google Drive atau Google Slides yang valid.');return {driveUrl,driveEmbedUrl};
}
export function checkAttachment(name,buffer){
 fail(Buffer.isBuffer(buffer)&&buffer.length>0&&buffer.length<=20*1024*1024,'INVALID_FILE','File kosong atau lebih dari 20 MB.');
 const ext=name.toLowerCase().split('.').pop();let type='';
 if(ext==='pdf'&&buffer.subarray(0,5).toString()==='%PDF-')type='application/pdf';
 if(ext==='png'&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))type='image/png';
 if(['jpg','jpeg'].includes(ext)&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255)type='image/jpeg';
 if(ext==='zip'&&buffer[0]===80&&buffer[1]===75&&((buffer[2]===3&&buffer[3]===4)||(buffer[2]===5&&buffer[3]===6)))type='application/zip';
 if(ext==='txt'&&!buffer.includes(0))type='text/plain';
 fail(type,'INVALID_FILE','Format file tidak didukung atau isi tidak cocok dengan ekstensi.');return type;
}
