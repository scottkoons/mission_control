import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDbP5u54vFMOgEWGhSwMx2taWbsdnLH6k0",
  authDomain: "mission-control-1dd6c.firebaseapp.com",
  projectId: "mission-control-1dd6c",
  storageBucket: "mission-control-1dd6c.firebasestorage.app",
  messagingSenderId: "279190769612",
  appId: "1:279190769612:web:1bcfb16dc81b7ffc0e1769",
  measurementId: "G-JQZJRS8B76"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
