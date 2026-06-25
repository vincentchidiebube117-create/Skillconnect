// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCAm9c9vVJhx1WQO4lmT1VNc2gpa2Np938",
  authDomain: "skillconnectrefpage.firebaseapp.com",
  projectId: "skillconnectrefpage",
  storageBucket: "skillconnectrefpage.firebasestorage.app",
  messagingSenderId: "807369765496",
  appId: "1:807369765496:web:4e1e71149dcdc7511d338d",
  measurementId: "G-9JXE9GK9E4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export these so other files can use them
export const db = getFirestore(app);
export const auth = getAuth(app);