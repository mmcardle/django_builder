import { useConsentStore } from "@/store/consentStore";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialised = false;

/** Inject and configure gtag.js — but only when the user has consented AND an
 * analytics id is configured. Idempotent, and a safe no-op otherwise. Nothing
 * here runs at module load, so importing this file is safe under jsdom. */
export function initAnalytics(): void {
  if (initialised) return;
  if (useConsentStore.getState().analytics !== true) return;

  const id = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
  if (!id) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  // gtag.js only executes queued `arguments` objects; it ignores plain arrays,
  // so this must not be rewritten with rest parameters.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", id);

  initialised = true;
}

/** Send a gtag event, but only once analytics has actually been initialised. */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!initialised || !window.gtag) return;
  window.gtag("event", name, params);
}
