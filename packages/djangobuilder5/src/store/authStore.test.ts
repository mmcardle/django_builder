import { expect, test, vi } from "vitest";
let handler: ((u: unknown) => void) | null = null;
vi.mock("@/domain/firestore/auth", () => ({ onAuth: (cb: (u: unknown) => void) => { handler = cb; return () => {}; } }));
import { useAuthStore, initAuth } from "./authStore";

test("initAuth pipes firebase auth state into the store and flips authLoaded", () => {
  expect(useAuthStore.getState().authLoaded).toBe(false);
  initAuth();
  handler!({ uid: "u1" });
  expect(useAuthStore.getState().user).toEqual({ uid: "u1" });
  expect(useAuthStore.getState().authLoaded).toBe(true);
  handler!(null);
  expect(useAuthStore.getState().user).toBeNull();
});
