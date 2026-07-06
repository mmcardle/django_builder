import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signOut,
  applyActionCode,
  confirmPasswordReset,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export function onAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export function isVerified(user: User): boolean {
  const github = user.providerData.some((p) => p.providerId === "github.com");
  return github || user.emailVerified || user.isAnonymous;
}

export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

const verifyActionSettings = () => ({ url: `${window.location.origin}/login` });

export async function signUp(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user, verifyActionSettings());
  return cred.user;
}

export async function signInAnon(): Promise<User> {
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

export function sendReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export function resendVerification(): Promise<void> {
  if (!auth.currentUser) return Promise.reject(new Error("Not signed in"));
  return sendEmailVerification(auth.currentUser, verifyActionSettings());
}

export function applyVerify(oobCode: string): Promise<void> {
  return applyActionCode(auth, oobCode);
}

export function confirmReset(oobCode: string, newPassword: string): Promise<void> {
  return confirmPasswordReset(auth, oobCode, newPassword);
}
