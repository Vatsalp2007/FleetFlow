import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiGhZX3DW_ajNHhEl6vuKr-rrYppYKHSM",
  authDomain: "fleet-flow-868a4.firebaseapp.com",
  projectId: "fleet-flow-868a4",
  storageBucket: "fleet-flow-868a4.firebasestorage.app",
  messagingSenderId: "947727527739",
  appId: "1:947727527739:web:eef56a1e4d0cb0d4e4911e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);