import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AuthError } from "@/features/auth/AuthCard";
import { CodeBlock } from "@/components/CodeBlock";
import { makeSeedProject } from "@/domain/seed";
import { renderAppPreview } from "@/domain/generate";
import { signInAnon } from "@/domain/firestore/auth";

const CHIPS = ["Django 5", "DRF", "HTMX", "Channels"];

export function Splash() {
  const navigate = useNavigate();
  const files = renderAppPreview(makeSeedProject(), "app_blog");
  const [error, setError] = useState<string | null>(null);

  // The CTA starts a guest session. Surface a failure (e.g. anonymous auth
  // switched off in Firebase) instead of leaving the button looking inert.
  async function tryIt() {
    setError(null);
    try {
      await signInAnon();
      navigate("/projects");
    } catch {
      setError("Could not start a guest session — try signing in instead.");
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl items-start gap-10 px-6 py-16 md:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
      <div>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Design your models.
          <br />
          <span className="bg-gradient-to-r from-accent to-[#8bf0c2] bg-clip-text text-transparent">
            Ship the Django.
          </span>
        </h1>
        <p className="mt-4 max-w-md text-muted">
          Model your apps visually and get production-ready Django code — models, admin,
          serializers, views, URLs — in seconds.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button size="lg" onClick={tryIt}>
            Start building — free
          </Button>
        </div>
        <div className="mt-4">
          <AuthError message={error} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <span key={c} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {c}
            </span>
          ))}
        </div>
      </div>
      <CodeBlock files={files} className="shadow-[0_20px_60px_rgba(0,0,0,0.35)]" />
    </section>
  );
}
