import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export function TopNav() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <Link to="/" className="text-sm font-extrabold tracking-tight">
        django<span className="text-accent">builder</span>
      </Link>
      <nav className="flex items-center gap-3 text-sm text-muted">
        <Link to="/build" className="hover:text-text">Build</Link>
        <a href="https://docs.djangoproject.com" className="hover:text-text">Docs</a>
        <span className="font-semibold text-accent">Sign in</span>
        <ThemeToggle />
      </nav>
    </header>
  );
}
