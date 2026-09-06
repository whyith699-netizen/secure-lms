// Compatibility filename retained; authentication is now Supabase Auth.
import {createClient} from '@supabase/supabase-js';
const env=import.meta.env;
const url=env.VITE_SUPABASE_URL||'https://hfaegztvozwphfonzbqj.supabase.co';
const anon=env.VITE_SUPABASE_ANON_KEY||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmYWVnenR2b3p3cGhmb256YnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzExMjMsImV4cCI6MjEwNDI0NzEyM30.160YStgueS5qkNmCrw-l2BB6qGTjTYWGRYuVnobn6DI';
export const configured=!!url&&!!anon&&!url.includes('YOUR_PROJECT');
export const supabase=configured?createClient(url,anon,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export const auth={client:supabase,currentUser:null};
export const apiBase=env.VITE_API_BASE||'/api';
