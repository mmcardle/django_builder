import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { signOutUser } from "@/domain/firestore/auth";

export function TopNav() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  async function out() { await signOutUser(); navigate("/"); }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <Link to={user ? "/projects" : "/"} className="text-sm font-extrabold tracking-tight">
        django<span className="text-accent">builder</span>
      </Link>
      <nav className="flex items-center gap-3 text-sm text-muted">
        {user && <Link to="/projects" className="hover:text-text">Projects</Link>}
        <Link to="/about" className="hover:text-text">About</Link>
        <a href="https://docs.djangoproject.com" target="_blank" rel="noopener noreferrer" title="Opens in a new tab" className="inline-flex items-center gap-1 hover:text-text">
          Docs
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" />
          </svg>
        </a>
        {user ? (
          <>
            {!user.isAnonymous && <span className="hidden text-muted sm:inline">{user.email}</span>}
            <button className="font-semibold text-accent" onClick={out}>Sign out</button>
          </>
        ) : (
          <Link to="/login" className="font-semibold text-accent">Sign in</Link>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
}
