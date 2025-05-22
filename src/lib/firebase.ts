
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMxP90zUg2nKSe7FbV8ZCPkSlZSTxcST8",
  authDomain: "scam-shield-dbc38.firebaseapp.com",
  projectId: "scam-shield-dbc38",
  storageBucket: "scam-shield-dbc38.firebasestorage.app",
  messagingSenderId: "692280836763",
  appId: "1:692280836763:web:74d57b0355453482ee7c3e",
  measurementId: "G-S6KK6T8NPH"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics if in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };
