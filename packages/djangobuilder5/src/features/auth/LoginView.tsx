import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard, AuthError } from "./AuthCard";
import { signIn, signInAnon } from "@/domain/firestore/auth";

export function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await signIn(email, password);
      navigate("/projects");
    } catch {
      setError("Wrong email or password.");
    } finally {
      setBusy(false);
    }
  }

  async function guest() {
    setBusy(true); setError(null);
    try {
      await signInAnon();
      navigate("/projects");
    } catch {
      setError("Could not start a guest session.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Sign in" footer={<>New here? <Link to="/signup" className="text-accent">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <AuthError message={error} />
        <Input type="email" required placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex items-center justify-between">
          <Link to="/reset" className="text-xs text-muted hover:text-text">Forgot password?</Link>
          <Button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        </div>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="ghost" className="w-full" disabled={busy} onClick={guest}>
        Continue without an account
      </Button>
      <p className="mt-2 text-center text-xs text-muted">
        Your projects stay on this device&apos;s session — you can save them to a real account at
        any time.
      </p>
    </AuthCard>
  );
}
