import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AuthCard, AuthError } from "./AuthCard";
import { isVerified, reloadUser, resendVerification, signOutUser } from "@/domain/firestore/auth";
import { useAuthStore } from "@/store/authStore";

export function UnverifiedView() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setError(null);
    try {
      await resendVerification();
      setSent(true);
    } catch {
      setError("Could not resend the email.");
    }
  }

  async function refresh() {
    setError(null);
    const user = await reloadUser();
    if (user) useAuthStore.getState().setUser(user);
    if (user && isVerified(user)) navigate("/projects");
    else setError("Still not verified — click the link in your email, then try again.");
  }

  return (
    <AuthCard title="Verify your email" footer={<button className="text-accent" onClick={() => signOutUser()}>Sign out</button>}>
      <AuthError message={error} />
      <p className="mb-4 text-sm text-muted">Check your inbox for a verification link, then refresh.</p>
      <div className="space-y-2">
        <Button className="w-full" onClick={refresh}>I&apos;ve verified — refresh</Button>
        <Button variant="ghost" className="w-full" onClick={resend} disabled={sent}>
          {sent ? "Sent ✓" : "Resend verification email"}
        </Button>
      </div>
    </AuthCard>
  );
}
