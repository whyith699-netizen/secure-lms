import test from 'node:test';import assert from 'node:assert/strict';
import {emailKey,attendanceId} from '../src/domain.js';
const enabled=process.env.RUN_EMULATOR_TESTS==='1';
test('Firebase emulator: authorization, QR rotation, concurrent check-in, closure and admin scope',{skip:!enabled,timeout:120000},async()=>{
 // This test refuses to connect to any production endpoint.
 assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):\d+$/);
 assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):\d+$/);
 const {initializeApp}=await import('firebase-admin/app');const {getAuth}=await import('firebase-admin/auth');const {getFirestore,Timestamp}=await import('firebase-admin/firestore');
 initializeApp({projectId:process.env.GCLOUD_PROJECT||'demo-secure'});const auth=getAuth(),db=getFirestore(),prefix='t'+Date.now(),cid=prefix+'class';
 async function person(role){
 const email=`${prefix}-${role}@example.com`;
 const u=await auth.createUser({email,password:'EmulatorOnly-12345',emailVerified:true});
 await db.collection('allowedEmails').doc(emailKey(email)).set({email,active:true});
 await db.collection('users').doc(u.uid).set({email,displayName:role,roles:[role],active:true});
 const endpoint='http:'+'//127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key';
 const options={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'EmulatorOnly-12345',returnSecureToken:true})};
 const r=await fetch(endpoint,options);const j=await r.json();assert.ok(j.idToken);return {uid:u.uid,token:j.idToken};
 }
 const teacher=await person('pengajar'),student=await person('siswa'),admin=await person('admin');
 await db.collection('classes').doc(cid).set({name:'Emulator test',period:'test',archivedAt:null,membershipVersion:1});await db.doc(`classes/${cid}/teachers/${teacher.uid}`).set({teacherId:teacher.uid,active:true});await db.doc(`classes/${cid}/members/${student.uid}`).set({studentId:student.uid,active:true,displayName:'Siswa test',schoolClass:'X'});
 async function call(who,path,method='GET',body){
 const endpoint='http:'+'//127.0.0.1:5000/api'+path;
 const options={method,headers:{Authorization:'Bearer '+who.token,'Content-Type':'application/json'}};
 if(body)options.body=JSON.stringify(body);
 const r=await fetch(endpoint,options);return {status:r.status,data:await r.json()};
 }
 const at=Date.now(),iso=offset=>new Date(at+offset).toISOString();const meeting=await call(teacher,`/classes/${cid}/meetings`,'POST',{title:'Integration',location:'Emulator',startsAt:iso(-60000),endsAt:iso(3600000),opensAt:iso(-60000),closesAt:iso(1800000),lateAfter:iso(600000)});assert.equal(meeting.status,201);const mid=meeting.data.id;
 assert.equal((await call(teacher,`/meetings/${mid}/open`,'POST')).status,200);
 assert.equal((await call(student,`/meetings/${mid}/qr`,'POST',{ttl:60})).status,403);
 assert.equal((await call(admin,`/meetings/${mid}/qr`,'POST',{ttl:60})).status,403);
 const first=await call(teacher,`/meetings/${mid}/qr`,'POST',{ttl:60}),second=await call(teacher,`/meetings/${mid}/qr`,'POST',{ttl:60});assert.equal(second.status,200);assert.notEqual(first.data.payload,second.data.payload);
 assert.equal((await call(student,'/attendance/check-in','POST',{payload:first.data.payload})).status,409);
 const results=await Promise.all(Array.from({length:5},()=>call(student,'/attendance/check-in','POST',{payload:second.data.payload})));assert.ok(results.every(r=>r.status===200));assert.equal(results.filter(r=>r.data.code==='SUCCESS').length,1);
 const record=await db.collection('attendance').doc(attendanceId(mid,student.uid)).get();assert.equal(record.data().status,'hadir');
 assert.equal((await call(student,`/meetings/${mid}/attendance`)).status,403);
 assert.equal((await call(teacher,`/meetings/${mid}/close`,'POST')).status,200);assert.equal((await call(teacher,`/meetings/${mid}/qr`,'POST',{ttl:60})).status,409);
 const before=await call(admin,'/admin/emails','POST',{email:prefix+'-new@example.com'});assert.equal(before.status,201);assert.equal((await call(admin,'/admin/emails','POST',{email:prefix+'-new@example.com'})).status,409);assert.equal((await call(student,'/admin/emails','POST',{email:prefix+'-bad@example.com'})).status,403);
});
