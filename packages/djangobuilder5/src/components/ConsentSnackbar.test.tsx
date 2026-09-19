import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

const hoisted = vi.hoisted(() => ({ initAnalytics: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ initAnalytics: hoisted.initAnalytics }));

import { ConsentSnackbar } from "./ConsentSnackbar";
import { useConsentStore } from "@/store/consentStore";

beforeEach(() => {
  localStorage.clear();
  useConsentStore.setState({ analytics: null });
  hoisted.initAnalytics.mockClear();
});

function renderSnackbar() {
  return render(
    <MemoryRouter>
      <ConsentSnackbar />
    </MemoryRouter>,
  );
}

test("renders while consent is undecided, with a Privacy Policy link", () => {
  renderSnackbar();
  expect(screen.getByText(/we use cookies for analytics/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute("href", "/privacy");
});

test("clicking Accept records consent, inits analytics, and hides the banner", async () => {
  renderSnackbar();
  await userEvent.click(screen.getByRole("button", { name: /accept/i }));
  expect(useConsentStore.getState().analytics).toBe(true);
  expect(hoisted.initAnalytics).toHaveBeenCalled();
  expect(screen.queryByText(/we use cookies for analytics/i)).not.toBeInTheDocument();
});

test("clicking Decline records the choice and hides the banner", async () => {
  renderSnackbar();
  await userEvent.click(screen.getByRole("button", { name: /decline/i }));
  expect(useConsentStore.getState().analytics).toBe(false);
  expect(screen.queryByText(/we use cookies for analytics/i)).not.toBeInTheDocument();
});

test("does not render once a choice has been made", () => {
  useConsentStore.setState({ analytics: false });
  renderSnackbar();
  expect(screen.queryByText(/we use cookies for analytics/i)).not.toBeInTheDocument();
});
