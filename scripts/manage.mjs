#!/usr/bin/env node
/** Trusted operator CLI. Never bundle this file into frontend assets. */
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,Timestamp} from 'firebase-admin/firestore';
import {emailKey,normalizeEmail,docId,fail} from '../functions/src/domain.js';
const [command,...args]=process.argv.slice(2);
const help=`SECURE trusted operator CLI

Set GOOGLE_APPLICATION_CREDENTIALS and GCLOUD_PROJECT first (see docs/SETUP.md).
Use Node.js 22 and run from the project root after npm install.

npm run manage -- allow EMAIL
npm run manage -- bootstrap-admin EMAIL "Nama Admin"
npm run manage -- set-role EMAIL siswa|pengajar|admin [additional comma-separated roles]
npm run manage -- create-class CLASS_ID "Nama kelas" "Periode"
npm run manage -- assign-teacher CLASS_ID EMAIL
npm run manage -- enroll CLASS_ID EMAIL "Kelas sekolah"
npm run manage -- unenroll CLASS_ID EMAIL
npm run manage -- profile EMAIL "Nama resmi" "Nomor siswa" "Kelas sekolah"
npm run manage -- disable EMAIL
npm run manage -- archive-class CLASS_ID

Role/class setup is intentionally CLI-only: the application admin only adds emails.
No command prints passwords or credential contents. Existing accounts keep passwords.
`;
if(!command||command==='help'){console.log(help);process.exit(0)}
const emulator=!!process.env.FIRESTORE_EMULATOR_HOST;
fail(process.env.GCLOUD_PROJECT,'CONFIG','Set GCLOUD_PROJECT to your project ID.');
initializeApp({projectId:process.env.GCLOUD_PROJECT,...(emulator?{}:{credential:applicationDefault()})});
const auth=getAuth(),db=getFirestore(),now=()=>Timestamp.now();
async function user(email,name){email=normalizeEmail(email);let u;try{u=await auth.getUserByEmail(email)}catch(e){if(e.code!=='auth/user-not-found')throw e;u=await auth.createUser({email,displayName:name||email.split('@')[0],emailVerified:false})}const r=db.collection('users').doc(u.uid);await db.runTransaction(async tx=>{const d=await tx.get(r);if(!d.exists)tx.create(r,{email,displayName:name||u.displayName||email.split('@')[0],roles:['siswa'],active:true,createdAt:now(),updatedAt:now()})});return {u,r,email}}
async function allow(email){email=normalizeEmail(email);await db.collection('allowedEmails').doc(emailKey(email)).set({email,active:true,addedBy:'operator-cli',createdAt:now()},{merge:true})}
const audit=(tx,action,entityId,classId=null)=>tx.create(db.collection('auditLogs').doc(),{actorId:'operator-cli',action,entityType:'setup',entityId,classId,createdAt:now()});
async function main(){
 if(command==='allow'){await allow(args[0]);return}
 if(command==='bootstrap-admin'||command==='set-role'){
  const email=normalizeEmail(args[0]);let roles=command==='bootstrap-admin'?['admin']:String(args[1]||'').split(',').concat(args[2]?String(args[2]).split(','):[]);roles=[...new Set(roles)];fail(roles.length&&roles.every(r=>['siswa','pengajar','admin'].includes(r)),'ROLE','Role must be siswa, pengajar, or admin.');const {u,r}=await user(email,command==='bootstrap-admin'?args[1]:undefined);await allow(email);await db.runTransaction(async tx=>{await tx.get(r);tx.update(r,{roles,active:true,updatedAt:now()});audit(tx,'set_roles',u.uid)});await auth.updateUser(u.uid,{disabled:false});await auth.revokeRefreshTokens(u.uid);console.log('Akun siap. Pengguna dapat memakai Lupa password, lalu verifikasi email.');return;
 }
 if(command==='create-class'){const id=docId(args[0]);fail(args[1]&&args[2],'INPUT','Name and period required.');const r=db.collection('classes').doc(id);await db.runTransaction(async tx=>{const d=await tx.get(r);fail(!d.exists,'EXISTS','Class already exists.');tx.create(r,{name:args[1],description:'Ekstrakurikuler coding SECURE',period:args[2],timezone:'Asia/Jakarta',membershipVersion:0,archivedAt:null,createdAt:now()});audit(tx,'create_class',id,id)});return}
 if(['assign-teacher','enroll','unenroll'].includes(command)){
  const id=docId(args[0]),email=normalizeEmail(args[1]);const u=await auth.getUserByEmail(email),c=db.collection('classes').doc(id),ur=db.collection('users').doc(u.uid),m=c.collection(command==='assign-teacher'?'teachers':'members').doc(u.uid);
  await db.runTransaction(async tx=>{const [cs,us,old]=await Promise.all([tx.get(c),tx.get(ur),tx.get(m)]);fail(cs.exists&&!cs.data().archivedAt,'CLASS','Class not found or archived.');const wanted=command==='assign-teacher'?'pengajar':'siswa';fail(us.exists&&us.data().active&&us.data().roles?.includes(wanted),'ROLE',`Assign role ${wanted} first.`);let data=command==='assign-teacher'?{teacherId:u.uid,active:true,assignedAt:now()}:{studentId:u.uid,displayName:us.data().displayName,schoolClass:args[2]||old.data()?.schoolClass||'',active:command!=='unenroll',joinedAt:old.data()?.joinedAt||now(),endedAt:command==='unenroll'?now():null};tx.set(m,data,{merge:true});tx.update(c,{membershipVersion:(cs.data().membershipVersion||0)+1});audit(tx,command,u.uid,id)});return;
 }
 if(command==='profile'){const email=normalizeEmail(args[0]),u=await auth.getUserByEmail(email);fail(args[1],'INPUT','Official name required.');await db.runTransaction(async tx=>{const r=db.collection('users').doc(u.uid);const d=await tx.get(r);fail(d.exists,'USER','User document not found.');tx.update(r,{displayName:args[1],updatedAt:now()});tx.set(db.collection('profiles').doc(u.uid),{studentNumber:args[2]||'',schoolClass:args[3]||'',updatedAt:now()},{merge:true});audit(tx,'update_identity',u.uid)});await auth.updateUser(u.uid,{displayName:args[1]});console.log('Identitas profil diperbarui; snapshot pertemuan lama tidak diubah. Jalankan enroll kembali jika nama keanggotaan juga perlu diperbarui.');return}
 if(command==='disable'){const email=normalizeEmail(args[0]),u=await auth.getUserByEmail(email);await db.collection('users').doc(u.uid).update({active:false,updatedAt:now()});await db.collection('allowedEmails').doc(emailKey(email)).set({email,active:false},{merge:true});await auth.updateUser(u.uid,{disabled:true});await auth.revokeRefreshTokens(u.uid);await db.collection('auditLogs').add({actorId:'operator-cli',action:'disable_user',entityId:u.uid,createdAt:now()});return}
 if(command==='archive-class'){const id=docId(args[0]);await db.collection('classes').doc(id).update({archivedAt:now()});await db.collection('auditLogs').add({actorId:'operator-cli',action:'archive_class',classId:id,createdAt:now()});return}
 throw Error('Unknown command. Run npm run manage -- help');
}
main().then(()=>{console.log('Selesai.');process.exit(0)}).catch(e=>{console.error('Gagal:',e.message);process.exit(1)});
