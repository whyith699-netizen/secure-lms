import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator} from 'firebase/auth';
const env=import.meta.env;
export const configured=!!env.VITE_FIREBASE_API_KEY&&!env.VITE_FIREBASE_API_KEY.startsWith('YOUR_')&&!!env.VITE_FIREBASE_PROJECT_ID;
export const firebaseApp=configured?initializeApp({apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID,storageBucket:env.VITE_FIREBASE_STORAGE_BUCKET,appId:env.VITE_FIREBASE_APP_ID}):null;
export const auth=firebaseApp?getAuth(firebaseApp):null;
if(auth&&env.VITE_USE_EMULATORS==='true')connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
export const apiBase=env.VITE_API_BASE||'/api';
