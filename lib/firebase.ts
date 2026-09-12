import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDL78QGp9xylWTT8Doe-eKxqhgNr7ND-BY",
  authDomain: "qoqostore-627ad.firebaseapp.com",
  projectId: "qoqostore-627ad",
  storageBucket: "qoqostore-627ad.firebasestorage.app",
  messagingSenderId: "531311444415",
  appId: "1:531311444415:web:cdbdbcabd25b6745ace10a"
};

// Inisialisasi Firebase app secara aman agar tidak double-init
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firestore tanpa konfigurasi cache eksperimental yang memicu BloomFilter error
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };