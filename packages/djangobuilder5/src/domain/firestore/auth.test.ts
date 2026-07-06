import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));
const fns = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  applyActionCode: vi.fn(),
  confirmPasswordReset: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));
vi.mock("firebase/auth", () => fns);

import * as authSvc from "./auth";
import { auth } from "@/lib/firebase";

beforeEach(() => Object.values(fns).forEach((f) => f.mockReset()));

test("signUp creates the user and sends a verification email", async () => {
  fns.createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "u1" } });
  fns.sendEmailVerification.mockResolvedValue(undefined);
  const user = await authSvc.signUp("a@b.com", "pw123456");
  expect(fns.createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, "a@b.com", "pw123456");
  expect(fns.sendEmailVerification).toHaveBeenCalledOnce();
  expect(user).toEqual({ uid: "u1" });
});

test("isVerified is true for verified email, anonymous, or github", () => {
  expect(authSvc.isVerified({ providerData: [], emailVerified: true, isAnonymous: false } as never)).toBe(true);
  expect(authSvc.isVerified({ providerData: [], emailVerified: false, isAnonymous: true } as never)).toBe(true);
  expect(authSvc.isVerified({ providerData: [{ providerId: "github.com" }], emailVerified: false, isAnonymous: false } as never)).toBe(true);
  expect(authSvc.isVerified({ providerData: [], emailVerified: false, isAnonymous: false } as never)).toBe(false);
});

test("applyVerify / confirmReset forward the oobCode", async () => {
  fns.applyActionCode.mockResolvedValue(undefined);
  fns.confirmPasswordReset.mockResolvedValue(undefined);
  await authSvc.applyVerify("code1");
  await authSvc.confirmReset("code2", "newpw12345");
  expect(fns.applyActionCode).toHaveBeenCalledWith(auth, "code1");
  expect(fns.confirmPasswordReset).toHaveBeenCalledWith(auth, "code2", "newpw12345");
});
