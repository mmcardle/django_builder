import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthError } from "./AuthCard";
import { upgradeAnonymous } from "@/domain/firestore/auth";
import { useAuthStore } from "@/store/authStore";

export function UpgradeAccountDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await upgradeAnonymous(email, password);
      useAuthStore.getState().setUser(user);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error && /email-already-in-use/.test(err.message)
          ? "That email is already registered."
          : "Could not save your account.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-xl border border-border bg-surface p-6"
      >
        {done ? (
          <>
            <h2 className="text-lg font-bold">Account saved</h2>
            <p className="text-sm text-muted">Account saved — check your email to verify.</p>
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <h2 className="text-lg font-bold">Save your account</h2>
            <p className="text-sm text-muted">
              Add an email and password to keep your projects. Nothing is lost.
            </p>
            <AuthError message={error} />
            <Input
              type="email"
              required
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              required
              minLength={6}
              placeholder="Password (min 6 chars)"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save account"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
