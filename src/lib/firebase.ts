import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCMxP90zUg2nKSe7FbV8ZCPkSlZSTxcST8",
  authDomain: "scam-shield-dbc38.firebaseapp.com",
  projectId: "scam-shield-dbc38",
  storageBucket: "scam-shield-dbc38.appspot.com",
  messagingSenderId: "692280836763",
  appId: "1:692280836763:web:74d57b0355453482ee7c3e",
  measurementId: "G-S6KK6T8NPH",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };
