import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCmoWFcH_9xC53dT7j-XvUo74Td0J-dLv4",
  authDomain: "forestfiresysterm.firebaseapp.com",
  databaseURL: "https://forestfiresysterm-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "forestfiresysterm",
  storageBucket: "forestfiresysterm.firebasestorage.app",
  messagingSenderId: "527968292756",
  appId: "1:527968292756:web:e9324e6d41dc72c706c981",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getDatabase(app);
export default app;
