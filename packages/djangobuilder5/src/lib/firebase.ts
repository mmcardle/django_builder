import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASEURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// db5 keeps users signed in across sessions (the live db4 uses session-only).
void setPersistence(auth, browserLocalPersistence);

/** Log genuine snapshot errors; stay silent for the permission error that fires
 * right after sign-out (currentUser already null). Never throws into Firestore's
 * async onSnapshot machinery. */
export function snapshotErrorHandler(error: unknown): void {
  if (auth.currentUser) console.error("[db5] snapshot error", error);
}
