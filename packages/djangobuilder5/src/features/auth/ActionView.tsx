import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard, AuthError } from "./AuthCard";
import { applyVerify, confirmReset } from "@/domain/firestore/auth";

export function ActionView() {
  const [params] = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode") ?? "";
  const [status, setStatus] = useState<"working" | "verified" | "reset-form" | "reset-done" | "error">("working");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "verifyEmail" && oobCode) {
      applyVerify(oobCode).then(() => setStatus("verified")).catch(() => setStatus("error"));
    } else if (mode === "resetPassword" && oobCode) {
      setStatus("reset-form");
    } else {
      setStatus("error");
    }
  }, [mode, oobCode]);

  async function submitReset(e: FormEvent) {
    e.preventDefault(); setError(null);
    try { await confirmReset(oobCode, password); setStatus("reset-done"); } catch { setError("That reset link is invalid or expired."); }
  }

  if (status === "verified") return <AuthCard title="Email verified" footer={<Link to="/login" className="text-accent">Sign in</Link>}><p className="text-sm text-muted">Your email is verified. You can sign in now.</p></AuthCard>;
  if (status === "reset-done") return <AuthCard title="Password updated" footer={<Link to="/login" className="text-accent">Sign in</Link>}><p className="text-sm text-muted">Your password has been changed.</p></AuthCard>;
  if (status === "reset-form") return (
    <AuthCard title="Choose a new password">
      <form onSubmit={submitReset} className="space-y-3">
        <AuthError message={error} />
        <Input type="password" required minLength={6} placeholder="New password" aria-label="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full">Update password</Button>
      </form>
    </AuthCard>
  );
  if (status === "error") return <AuthCard title="Invalid link" footer={<Link to="/login" className="text-accent">Sign in</Link>}><p className="text-sm text-muted">This link is invalid or has expired.</p></AuthCard>;
  return <AuthCard title="Working…"><p className="text-sm text-muted">One moment…</p></AuthCard>;
}
