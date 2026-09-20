import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function AboutView() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
        About django<span className="text-accent">builder</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-muted">
        Django Builder generates ready-to-run Django projects — apps, models, fields,
        relationships, admin, DRF serializers, HTMX and Channels — that you can download as a tar
        and run.
      </p>
      <p className="mt-4 text-sm text-muted">
        <span className="font-semibold text-text">Supported versions:</span> Django 5.x, 4.x, 3.x
        (all supported).
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <a
          href="https://github.com/mmcardle/django_builder"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-text"
        >
          Django Builder on GitHub
        </a>
        <a
          href="https://github.com/mmcardle/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-text"
        >
          mmcardle
        </a>
        <a
          href="https://twitter.com/mmc4rdle"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-text"
        >
          @mmc4rdle
        </a>
        <Link to="/privacy" className="text-accent hover:text-text">
          Privacy Policy
        </Link>
      </div>

      <div className="mx-auto mt-10 max-w-xl rounded-[10px] border border-border bg-surface p-6 text-left">
        <h2 className="text-lg font-semibold">Support</h2>
        <p className="mt-2 text-sm text-muted">
          Django Builder is free to use — a personal project built in spare time. Donations are
          appreciated.
        </p>
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-muted">Bitcoin</div>
          <code className="mt-1 block select-all break-all font-mono text-sm text-text">
            1J7JaUA5YhowVNtWCEoSh2tUD7pVJQfwcx
          </code>
        </div>
        <div className="mt-4">
          <a
            href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=L59T3C67CNC8G"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost">Donate via PayPal</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
