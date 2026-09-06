import {defineConfig} from 'vite';
export default defineConfig({
  server:{proxy:{'/api':{target:'http://127.0.0.1:5050',changeOrigin:true}}},
  build:{
    target:'es2022',
    rollupOptions:{
      output:{
        manualChunks:{
          firebase:['firebase/app','firebase/auth'],
          markdown:['dompurify','marked'],
          qrcode:['qrcode','html5-qrcode']
        }
      }
    },
    chunkSizeWarningLimit:1000
  }
});
