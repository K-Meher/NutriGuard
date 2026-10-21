// ============================================================
// Firebase Configuration (SSR Safe)
// ============================================================

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyADa1NBKpf7sjCD3uVmP9SVftQyb8Zf9oI",
  authDomain: "nutriguard-ce60a.firebaseapp.com",
  projectId: "nutriguard-ce60a",
  storageBucket: "nutriguard-ce60a.firebasestorage.app",
  messagingSenderId: "148325895296",
  appId: "1:148325895296:web:cbe8fbd33517b5916caa65",
  measurementId: "G-WSK53T6228",
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
  }
  return appInstance;
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

// Flag: returns true if Firebase is properly configured
export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) &&
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.apiKey !== "";
