import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBN1oVgbiYOmoOvEOQrSmy98Fg2Bu8OZ5o",
  authDomain: "studypoint-b0950.firebaseapp.com",
  projectId: "studypoint-b0950",
  storageBucket: "studypoint-b0950.firebasestorage.app",
  messagingSenderId: "623531127607",
  appId: "1:623531127607:web:65130009d918b0dd8ce0b2"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with experimentalForceLongPolling to bypass AdBlocker / Brave Shield blocking
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
});

export const auth = getAuth(app);
export default app;
