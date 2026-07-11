import { create } from "zustand";

const KEY = "db5-analytics-consent";

/** Read the persisted consent choice: true/false if the user decided, null if not. */
function initialConsent(): boolean | null {
  const stored = localStorage.getItem(KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return null;
}

interface ConsentState {
  /** true = allowed, false = declined, null = undecided (show the snackbar). */
  analytics: boolean | null;
  accept: () => void;
  decline: () => void;
}

export const useConsentStore = create<ConsentState>((set) => ({
  analytics: initialConsent(),
  accept: () => {
    localStorage.setItem(KEY, "true");
    set({ analytics: true });
  },
  decline: () => {
    localStorage.setItem(KEY, "false");
    set({ analytics: false });
  },
}));
