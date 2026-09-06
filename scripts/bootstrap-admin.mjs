#!/usr/bin/env node
import {createClient} from '@supabase/supabase-js';
const [email,password='Secure123!',name='Admin SECURE']=process.argv.slice(2);
if(!email||!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY){console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then pass EMAIL [PASSWORD] [NAME].');process.exit(1)}
const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
let {data,error}=await s.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:name}});
if(error&&error.message.toLowerCase().includes('registered')){const list=await s.auth.admin.listUsers({page:1,perPage:1000});data={user:list.data.users.find(u=>u.email===email)}}
if(!data?.user){console.error(error?.message||'User not found');process.exit(1)}
await s.from('allowed_emails').upsert({email:email.toLowerCase(),active:true});
const r=await s.from('users').upsert({id:data.user.id,email:email.toLowerCase(),display_name:name,roles:['admin'],active:true,updated_at:new Date().toISOString()});
if(r.error){console.error(r.error.message);process.exit(1)}console.log('Admin ready:',email);
