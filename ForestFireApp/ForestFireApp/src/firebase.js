import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCmoWFcH_9xC53dT7j-XvUo74Td0J-dLv4",
  authDomain: "forestfiresysterm.firebaseapp.com",
  databaseURL: "https://forestfiresysterm-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "forestfiresysterm",
  storageBucket: "forestfiresysterm.firebasestorage.app",
  messagingSenderId: "527968292756",
  appId: "1:527968292756:web:e9324e6d41dc72c706c981",
};

const app      = initializeApp(firebaseConfig);
export const db   = getDatabase(app);
export const auth = getAuth(app);
export default app;
