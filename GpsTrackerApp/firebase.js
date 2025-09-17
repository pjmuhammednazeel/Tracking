// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push } from "firebase/database";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0I_hNFT72VZFkl9yBhs_Npz7sIGEGq-o",
  authDomain: "mitsride.firebaseapp.com",
  databaseURL: "https://mitsride-default-rtdb.firebaseio.com",
  projectId: "mitsride",
  storageBucket: "mitsride.firebasestorage.app",
  messagingSenderId: "286272552061",
  appId: "1:286272552061:web:382cfad1a1ecf923760514",
  measurementId: "G-M4BYJNH8F3"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, push };
