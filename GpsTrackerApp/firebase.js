// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// Using your existing Firebase project (tracking-25a82)
// Same project as your Python script but different data path
const firebaseConfig = {
  apiKey: "AIzaSyBA_hINB0VnCYDkxDJdUgyuilw_Rfc4gow", // Keep the new API key
  authDomain: "tracking-25a82.firebaseapp.com", // Back to original project
  databaseURL: "https://tracking-25a82-default-rtdb.firebaseio.com", // Original database
  projectId: "tracking-25a82", // Original project ID
  storageBucket: "tracking-25a82.appspot.com", // Original storage
  messagingSenderId: "626108604318", // Keep new sender ID
  appId: "1:626108604318:web:8e546aef80378c0207c08f", // Keep new app ID
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set };
