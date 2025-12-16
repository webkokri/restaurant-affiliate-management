import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCaM1ahcM6vJIgA8yesqEB01Dbd0My3JWI',
  authDomain: 'affiliate.tasteofindiaexpress.ca',
  projectId: 'tasteofindia-5d0b6',
  storageBucket: 'tasteofindia-5d0b6.firebasestorage.app',
  messagingSenderId: '237097141211',
  appId: '1:237097141211:web:2ae43be852ad983d0f5dfe',
  measurementId: 'G-8XP906NTY3'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Only log in development
if (import.meta.env.DEV) {
  console.log('Connected to Firebase Cloud services');
}

// Note: Firestore data will be stored in Firebase Cloud Firestore
// The 'customers' collection will be created automatically when first document is added
