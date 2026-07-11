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
  EmailAuthProvider,
  linkWithCredential,
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

// import.meta.env.BASE_URL is "/" in dev and "/db5/" in the deployed build, so
// verified/reset users return to the db5 app (not the root app) under a subpath.
const verifyActionSettings = () => ({
  url: `${window.location.origin}${import.meta.env.BASE_URL}login`,
});

export async function signUp(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user, verifyActionSettings());
  return cred.user;
}

export async function signInAnon(): Promise<User> {
  const cred = await signInAnonymously(auth);
  return cred.user;
}

/** Upgrade the current anonymous user into a permanent email/password account,
 * keeping the same uid (and all their data). Sends a verification email. */
export async function upgradeAnonymous(email: string, password: string): Promise<User> {
  if (!auth.currentUser) throw new Error("Not signed in");
  const cred = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(auth.currentUser, cred);
  await sendEmailVerification(result.user, verifyActionSettings());
  return result.user;
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

/** Refresh the current user from the server (e.g. after they click the email
 * verification link) and return the updated user. onAuthStateChanged does NOT
 * fire on an emailVerified change, so callers must push this into the store. */
export async function reloadUser(): Promise<User | null> {
  if (auth.currentUser) await auth.currentUser.reload();
  return auth.currentUser;
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
