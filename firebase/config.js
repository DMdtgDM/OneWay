// Import the functions you need from the SDKs you need

import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth"; // for web
import { Platform } from "react-native"; // ← Add this import

const firebaseConfig = {
  apiKey: "AIzaSyAxu2d92X7tXWBSNptqBK5LpsZPjvgnDa0",
  authDomain: "daniel-5b815.firebaseapp.com",
  projectId: "daniel-5b815",
  storageBucket: "daniel-5b815.firebasestorage.app",
  messagingSenderId: "959660156314",
  appId: "1:959660156314:web:4ed08c3c01ae2a5c3c0623",
  measurementId: "G-JH7ZETQ7DN"
};

const app = initializeApp(firebaseConfig);

let auth;

if (Platform.OS === "web") {
  // Web version - simple and works in browser
  auth = getAuth(app);
} else {
  // React Native / Expo mobile version - with persistence
  // @ts-ignore   (this silences the common type warning)
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { app, auth };



