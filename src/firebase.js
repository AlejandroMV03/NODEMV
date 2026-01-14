// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3yammOrn2uL3NjzMm4uvQjz1wOxwZoI0",
  authDomain: "notemv-72ca1.firebaseapp.com",
  projectId: "notemv-72ca1",
  storageBucket: "notemv-72ca1.firebasestorage.app",
  messagingSenderId: "389278295908",
  appId: "1:389278295908:web:cf2b68a1a127d88ff97c71"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, signInWithPopup, signOut, db };