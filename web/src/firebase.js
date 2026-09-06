// Compatibility filename retained; authentication is now Supabase Auth.
import {createClient} from '@supabase/supabase-js';
const env=import.meta.env;
export const configured=!!env.VITE_SUPABASE_URL&&!!env.VITE_SUPABASE_ANON_KEY&&!env.VITE_SUPABASE_URL.includes('YOUR_PROJECT');
export const supabase=configured?createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export const auth={client:supabase,currentUser:null};
export const apiBase=env.VITE_API_BASE||'/api';
