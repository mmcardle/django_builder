import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
vi.mock("@/lib/firebase", () => ({ auth: { currentUser: null }, db: {}, snapshotErrorHandler: vi.fn() }));
vi.mock("@/store/authStore", () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: null, authLoaded: true }),
  initAuth: vi.fn(),
}));
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: unknown) => unknown) => sel({ start: vi.fn(), stop: vi.fn(), summaries: [], dataLoaded: true, project: null }),
}));
import { App } from "./App";

beforeEach(() => vi.clearAllMocks());

test("renders the brand and the splash on / when signed out", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: /django\s*builder/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /ship the django/i })).toBeInTheDocument();
});
