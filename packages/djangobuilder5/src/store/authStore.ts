import { create } from "zustand";
import type { User } from "firebase/auth";
import { onAuth } from "@/domain/firestore/auth";

interface AuthState {
  user: User | null;
  authLoaded: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authLoaded: false,
  setUser: (user) => set({ user, authLoaded: true }),
}));

/** Wire Firebase auth state into the store. Call once at startup. */
export function initAuth(): () => void {
  return onAuth((user) => useAuthStore.getState().setUser(user));
}
