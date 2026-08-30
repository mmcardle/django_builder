import { beforeEach, expect, test } from "vitest";
import { useConsentStore } from "./consentStore";

beforeEach(() => {
  localStorage.clear();
  useConsentStore.setState({ analytics: null });
});

test("accept() sets analytics true and persists to localStorage", () => {
  useConsentStore.getState().accept();
  expect(useConsentStore.getState().analytics).toBe(true);
  expect(localStorage.getItem("db5-analytics-consent")).toBe("true");
});

test("decline() sets analytics false and persists to localStorage", () => {
  useConsentStore.getState().decline();
  expect(useConsentStore.getState().analytics).toBe(false);
  expect(localStorage.getItem("db5-analytics-consent")).toBe("false");
});
