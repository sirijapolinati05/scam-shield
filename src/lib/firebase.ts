
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyA8B1gjrBinlonA0qBSQdIOY33-JTQxmEk",
  authDomain: "scamshield-app.firebaseapp.com",
  projectId: "scamshield-app",
  storageBucket: "scamshield-app.appspot.com",
  messagingSenderId: "246812186983",
  appId: "1:246812186983:web:a85b4ef9b4d7cbeb53a6a4"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
