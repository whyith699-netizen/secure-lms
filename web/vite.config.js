import {defineConfig} from 'vite';
import {fileURLToPath,URL} from 'node:url';
export default defineConfig({resolve:{alias:{'firebase/auth':fileURLToPath(new URL('./src/supabase-auth-compat.js',import.meta.url))}},server:{proxy:{'/api':{target:'http://127.0.0.1:5050',changeOrigin:true}}},build:{target:'es2022',rollupOptions:{output:{manualChunks:{supabase:['@supabase/supabase-js'],markdown:['dompurify','marked'],qrcode:['qrcode','html5-qrcode']}}},chunkSizeWarningLimit:1000}});
