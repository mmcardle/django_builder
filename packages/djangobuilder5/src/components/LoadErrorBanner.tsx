import { useProjectStore } from "@/store/projectStore";

/**
 * A failed Firestore listener never recovers on its own, so from that moment
 * everything on screen is stale — silently, since the last good snapshot is
 * still rendered. Say so, and give the error text the user can quote in a bug
 * report (the production `.io` app shows the same detail).
 */
export function LoadErrorBanner() {
  const loadError = useProjectStore((s) => s.loadError);
  const dismiss = useProjectStore((s) => s.dismissLoadError);

  if (!loadError) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-red-500/40 bg-red-500/10 px-6 py-2.5 text-sm text-red-200"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Couldn&apos;t load your projects — what you see may be out of date.</p>
        <p className="mt-0.5 break-words font-mono text-xs text-red-300/80">{loadError}</p>
        <p className="mt-0.5 text-xs text-red-300/80">
          Reload the page to try again, and quote this message if you report it.
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss error"
        className="shrink-0 text-lg leading-none text-red-300 hover:text-red-100"
        onClick={dismiss}
      >
        ✕
      </button>
    </div>
  );
}
