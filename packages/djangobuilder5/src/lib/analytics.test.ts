const GA_ID = "G-TEST123456";

const CONSENT_KEY = "db5-analytics-consent";

/** analytics.ts keeps an `initialised` flag at module scope, so each test loads a fresh copy
 * (and with it a fresh consent store, which reads the persisted choice). */
async function loadAnalytics() {
  vi.resetModules();
  return import("./analytics");
}

beforeEach(() => {
  vi.stubEnv("VITE_GOOGLE_ANALYTICS_ID", GA_ID);
  localStorage.setItem(CONSENT_KEY, "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
  delete window.dataLayer;
  delete window.gtag;
  document.head.querySelectorAll("script").forEach((s) => s.remove());
});

/** gtag.js only executes dataLayer entries that are `arguments` objects; it ignores plain arrays. */
function commands(): unknown[][] {
  return (window.dataLayer ?? [])
    .filter((entry) => Object.prototype.toString.call(entry) === "[object Arguments]")
    .map((entry) => Array.from(entry as ArrayLike<unknown>));
}

test("initAnalytics queues the config command in the form gtag.js executes", async () => {
  const { initAnalytics } = await loadAnalytics();
  initAnalytics();
  expect(commands().map((c) => c[0])).toEqual(["js", "config"]);
  expect(commands()[1]).toEqual(["config", GA_ID]);
});

test("initAnalytics loads the gtag.js script for the configured id", async () => {
  const { initAnalytics } = await loadAnalytics();
  initAnalytics();
  const script = document.head.querySelector("script");
  expect(script?.src).toBe(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
});

test("trackEvent queues an event command in the form gtag.js executes", async () => {
  const { initAnalytics, trackEvent } = await loadAnalytics();
  initAnalytics();
  trackEvent("download-project", { project: "demo" });
  expect(commands().at(-1)).toEqual(["event", "download-project", { project: "demo" }]);
});

test("initAnalytics does nothing without consent", async () => {
  localStorage.removeItem(CONSENT_KEY);
  const { initAnalytics } = await loadAnalytics();
  initAnalytics();
  expect(window.dataLayer).toBeUndefined();
  expect(document.head.querySelector("script")).toBeNull();
});
