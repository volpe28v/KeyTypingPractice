import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUwJMnCXCFCkycURKyLOHvs3WwNJW1-EI",
  authDomain: "spellingmaster-49b44.firebaseapp.com",
  projectId: "spellingmaster-49b44",
  storageBucket: "spellingmaster-49b44.firebasestorage.app",
  messagingSenderId: "141415038506",
  appId: "1:141415038506:web:b757675267dd5e1e994d53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;