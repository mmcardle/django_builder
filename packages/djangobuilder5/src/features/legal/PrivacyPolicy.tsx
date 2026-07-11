import { Link } from "react-router-dom";

export function PrivacyPolicy() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-center text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
        Privacy <span className="text-accent">Policy</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-muted">
        What data Django Builder collects, how it is used, and the choices you have.
      </p>

      <div className="mx-auto mt-10 max-w-xl space-y-6 text-left">
        <div className="rounded-[10px] border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">Your projects</h2>
          <p className="mt-2 text-sm text-muted">
            The projects, apps, models, fields and relationships you create are stored in Google
            Firebase (Cloud Firestore) and tied to your account. They are only used to save and
            load your work — nobody else can read your projects.
          </p>
        </div>

        <div className="rounded-[10px] border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">Authentication</h2>
          <p className="mt-2 text-sm text-muted">
            Accounts and sign-in are handled by Firebase Authentication. If you choose to create an
            account we store your email address, and use it only to sign you in and verify your
            email. You can continue without an account if you would rather not share an email.
          </p>
        </div>

        <div className="rounded-[10px] border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">Analytics</h2>
          <p className="mt-2 text-sm text-muted">
            With your consent, Django Builder uses Google Analytics to understand how the site is
            used so it can be improved. Analytics is optional: it is only enabled if you accept, and
            you can decline. The site works exactly the same either way.
          </p>
        </div>

        <div className="rounded-[10px] border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2 text-sm text-muted">
            Django Builder is a personal, open-source project. If you have any questions, please get
            in touch via the{" "}
            <a
              href="https://github.com/mmcardle/django_builder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-text"
            >
              GitHub repository
            </a>
            .
          </p>
        </div>
      </div>

      <div className="mt-10 text-center text-sm">
        <Link to="/about" className="text-accent hover:text-text">
          Back to About
        </Link>
      </div>
    </section>
  );
}
