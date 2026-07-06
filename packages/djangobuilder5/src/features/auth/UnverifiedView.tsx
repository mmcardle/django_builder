import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthCard, AuthError } from "./AuthCard";
import { resendVerification, signOutUser } from "@/domain/firestore/auth";

export function UnverifiedView() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function resend() {
    setError(null);
    try { await resendVerification(); setSent(true); } catch { setError("Could not resend the email."); }
  }
  return (
    <AuthCard title="Verify your email" footer={<button className="text-accent" onClick={() => signOutUser()}>Sign out</button>}>
      <AuthError message={error} />
      <p className="mb-4 text-sm text-muted">Check your inbox for a verification link. Once verified, reload the page.</p>
      <Button className="w-full" onClick={resend} disabled={sent}>{sent ? "Sent ✓" : "Resend verification email"}</Button>
    </AuthCard>
  );
}
