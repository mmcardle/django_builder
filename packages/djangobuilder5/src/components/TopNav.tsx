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
        <a
          href="https://docs.djangoproject.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Opens in a new tab"
          className="inline-flex items-center gap-1 hover:text-text"
        >
          Docs
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
        </a>
        <span className="font-semibold text-accent">Sign in</span>
        <ThemeToggle />
      </nav>
    </header>
  );
}
