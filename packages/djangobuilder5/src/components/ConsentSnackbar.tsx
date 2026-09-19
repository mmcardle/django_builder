import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useConsentStore } from "@/store/consentStore";
import { initAnalytics } from "@/lib/analytics";

export function ConsentSnackbar() {
  const analytics = useConsentStore((s) => s.analytics);
  const accept = useConsentStore((s) => s.accept);
  const decline = useConsentStore((s) => s.decline);

  // Only prompt while the user is undecided.
  if (analytics !== null) return null;

  function onAccept() {
    accept();
    initAnalytics();
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface px-6 py-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-sm sm:flex-row sm:justify-between">
        <p className="text-muted">
          We use cookies for analytics.{" "}
          <Link to="/privacy" className="text-accent hover:text-text">
            Privacy Policy
          </Link>
        </p>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={decline}>
            Decline
          </Button>
          <Button size="sm" onClick={onAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
