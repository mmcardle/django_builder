import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard, AuthError } from "./AuthCard";
import { sendReset } from "@/domain/firestore/auth";

export function ResetPasswordView() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null);
    try { await sendReset(email); setSent(true); } catch { setError("Could not send the reset email."); }
  }

  return (
    <AuthCard title="Reset password" footer={<Link to="/login" className="text-accent">Back to sign in</Link>}>
      {sent ? <p className="text-sm text-muted">If an account exists for {email}, a reset link is on its way.</p> : (
        <form onSubmit={submit} className="space-y-3">
          <AuthError message={error} />
          <Input type="email" required placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthCard>
  );
}
