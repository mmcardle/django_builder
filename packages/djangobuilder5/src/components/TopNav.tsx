import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UpgradeAccountDialog } from "@/features/auth/UpgradeAccountDialog";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { signOutUser } from "@/domain/firestore/auth";

export function TopNav() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // A guest's uid dies with the session, so signing one out silently would
  // strand their projects. Offer to save the account (or delete) first.
  async function out() {
    if (user?.isAnonymous) {
      setLeaving(true);
      return;
    }
    await signOutUser();
    navigate("/");
  }

  // Delete while still authenticated — the rules match on the owner uid.
  async function discardAndSignOut() {
    await useProjectStore.getState().deleteAllData();
    await signOutUser();
    setLeaving(false);
    navigate("/");
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      {/* Always home — signed-in users reach their projects via the nav link. */}
      <Link to="/" className="text-sm font-extrabold tracking-tight">
        django<span className="text-accent">builder</span>
      </Link>
      <nav className="flex items-center gap-3 text-sm text-muted">
        {user && <Link to="/projects" className="hover:text-text">Projects</Link>}
        <Link to="/about" className="hover:text-text">About</Link>
        <Link to="/privacy" className="hover:text-text">Privacy</Link>
        <a href="https://docs.djangoproject.com" target="_blank" rel="noopener noreferrer" title="Opens in a new tab" className="inline-flex items-center gap-1 hover:text-text">
          Docs
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" />
          </svg>
        </a>
        {user ? (
          <>
            {user.isAnonymous && (
              <button className="font-semibold text-accent" onClick={() => setUpgrading(true)}>
                Save your account
              </button>
            )}
            {!user.isAnonymous && <span className="hidden text-muted sm:inline">{user.email}</span>}
            <button className="font-semibold text-accent" onClick={out}>Sign out</button>
          </>
        ) : (
          <Link to="/login" className="font-semibold text-accent">Sign in</Link>
        )}
        <ThemeToggle />
      </nav>
      {(upgrading || leaving) && (
        <UpgradeAccountDialog
          onClose={() => {
            setUpgrading(false);
            setLeaving(false);
          }}
          onDiscard={leaving ? discardAndSignOut : undefined}
        />
      )}
    </header>
  );
}
