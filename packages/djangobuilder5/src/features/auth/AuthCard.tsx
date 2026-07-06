import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <Link to="/" className="mb-6 text-center text-sm font-extrabold tracking-tight">
        django<span className="text-accent">builder</span>
      </Link>
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="mb-4 text-lg font-bold">{title}</h1>
        {children}
      </div>
      {footer ? <div className="mt-4 text-center text-sm text-muted">{footer}</div> : null}
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{message}</p>;
}
