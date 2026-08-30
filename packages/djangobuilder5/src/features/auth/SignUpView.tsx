import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard, AuthError } from "./AuthCard";
import { signUp } from "@/domain/firestore/auth";

export function SignUpView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await signUp(email, password); setDone(true); }
    catch (err) { setError(err instanceof Error && /email-already-in-use/.test(err.message) ? "That email is already registered." : "Could not create the account."); }
    finally { setBusy(false); }
  }

  if (done) {
    return <AuthCard title="Check your email" footer={<Link to="/login" className="text-accent">Back to sign in</Link>}>
      <p className="text-sm text-muted">We sent a verification link to <span className="text-text">{email}</span>. Click it, then sign in.</p>
    </AuthCard>;
  }

  return (
    <AuthCard title="Create your account" footer={<>Already have one? <Link to="/login" className="text-accent">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <AuthError message={error} />
        <Input type="email" required placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required minLength={6} placeholder="Password (min 6 chars)" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
      </form>
    </AuthCard>
  );
}
