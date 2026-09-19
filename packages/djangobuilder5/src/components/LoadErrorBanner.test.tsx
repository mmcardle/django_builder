import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const state = { loadError: null as string | null, dismissLoadError: vi.fn() };
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: typeof state) => unknown) => sel(state),
}));

import { LoadErrorBanner } from "./LoadErrorBanner";

beforeEach(() => {
  vi.clearAllMocks();
  state.loadError = null;
});

test("renders nothing while the listeners are healthy", () => {
  const { container } = render(<LoadErrorBanner />);
  expect(container).toBeEmptyDOMElement();
});

test("surfaces a listener failure with the quotable error text", () => {
  state.loadError = "Missing or insufficient permissions.";
  render(<LoadErrorBanner />);
  expect(screen.getByRole("alert")).toHaveTextContent(/may be out of date/i);
  expect(screen.getByText("Missing or insufficient permissions.")).toBeInTheDocument();
});

test("can be dismissed", async () => {
  state.loadError = "boom";
  render(<LoadErrorBanner />);
  await userEvent.click(screen.getByRole("button", { name: /dismiss error/i }));
  expect(state.dismissLoadError).toHaveBeenCalled();
});
