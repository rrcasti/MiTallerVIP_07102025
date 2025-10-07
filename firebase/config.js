import { initializeApp } from 'firebase/app';
// 👇 Importa las funciones necesarias
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBJmvrLTIEyVI4gQwewBp_7rCI1MEj0R1A",
  authDomain: "mitallervip.firebaseapp.com",
  projectId: "mitallervip",
  storageBucket: "mitallervip.firebasestorage.app",
  messagingSenderId: "1015887608367",
  appId: "1:1015887608367:web:f8a978d481086c5639a4da"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Usa getAuth (no initializeAuth)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const firestore = getFirestore(app);
export const db = firestore;
export const storage = getStorage(app);
