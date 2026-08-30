import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  setUser: vi.fn(),
  signOutUser: vi.fn().mockResolvedValue(undefined),
  deleteAllData: vi.fn().mockResolvedValue(undefined),
  navigate: vi.fn(),
  user: { isAnonymous: true } as { isAnonymous: boolean; email?: string },
}));

vi.mock("@/store/authStore", () => {
  const useAuthStore = (sel: (s: { user: typeof hoisted.user }) => unknown) =>
    sel({ user: hoisted.user });
  useAuthStore.getState = () => ({ setUser: hoisted.setUser });
  return { useAuthStore };
});
vi.mock("@/store/projectStore", () => ({
  useProjectStore: { getState: () => ({ deleteAllData: hoisted.deleteAllData }) },
}));
vi.mock("@/domain/firestore/auth", () => ({
  signOutUser: hoisted.signOutUser,
  upgradeAnonymous: vi.fn(),
}));
vi.mock("react-router-dom", async (orig) => ({
  ...((await orig()) as object),
  useNavigate: () => hoisted.navigate,
}));

import { TopNav } from "./TopNav";

const renderNav = () =>
  render(
    <MemoryRouter>
      <TopNav />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.user = { isAnonymous: true };
});

test("shows 'Save your account' for an anonymous user and opens the dialog", async () => {
  renderNav();

  const save = screen.getByRole("button", { name: /save your account/i });
  expect(save).toBeInTheDocument();

  await userEvent.click(save);
  expect(screen.getByRole("button", { name: /save account/i })).toBeInTheDocument();
});

test("signing out as a guest warns instead of signing out immediately", async () => {
  renderNav();

  await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

  expect(hoisted.signOutUser).not.toHaveBeenCalled();
  expect(screen.getByText(/only exist inside this anonymous session/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /save account/i })).toBeInTheDocument();
});

test("'Sign out and delete' wipes the guest's data before signing out", async () => {
  renderNav();

  await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
  await userEvent.click(screen.getByRole("button", { name: /sign out and delete/i }));

  expect(hoisted.deleteAllData).toHaveBeenCalled();
  expect(hoisted.signOutUser).toHaveBeenCalled();
  expect(hoisted.deleteAllData.mock.invocationCallOrder[0]).toBeLessThan(
    hoisted.signOutUser.mock.invocationCallOrder[0],
  );
  expect(hoisted.navigate).toHaveBeenCalledWith("/");
});

test("a registered user signs out directly, with no warning and no deletion", async () => {
  hoisted.user = { isAnonymous: false, email: "me@example.com" };
  renderNav();

  await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

  expect(hoisted.signOutUser).toHaveBeenCalled();
  expect(hoisted.deleteAllData).not.toHaveBeenCalled();
  expect(hoisted.navigate).toHaveBeenCalledWith("/");
  expect(screen.queryByRole("button", { name: /sign out and delete/i })).not.toBeInTheDocument();
});

test("the guest warning offers a way out that keeps the data", async () => {
  renderNav();

  await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
  await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

  expect(hoisted.signOutUser).not.toHaveBeenCalled();
  expect(hoisted.deleteAllData).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: /save account/i })).not.toBeInTheDocument();
});

test("the wordmark goes home for a signed-in user, not to their projects", () => {
  renderNav();
  expect(screen.getByRole("link", { name: /django\s*builder/i })).toHaveAttribute("href", "/");
});

test("the wordmark goes home for a signed-out visitor too", () => {
  hoisted.user = null as unknown as { isAnonymous: boolean };
  renderNav();
  expect(screen.getByRole("link", { name: /django\s*builder/i })).toHaveAttribute("href", "/");
});
