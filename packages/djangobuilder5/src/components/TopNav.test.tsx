import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  setUser: vi.fn(),
}));
vi.mock("@/store/authStore", () => {
  const useAuthStore = (sel: (s: { user: { isAnonymous: boolean } }) => unknown) =>
    sel({ user: { isAnonymous: true } });
  useAuthStore.getState = () => ({ setUser: hoisted.setUser });
  return { useAuthStore };
});
vi.mock("@/domain/firestore/auth", () => ({
  signOutUser: vi.fn(),
  upgradeAnonymous: vi.fn(),
}));

import { TopNav } from "./TopNav";

test("shows 'Save your account' for an anonymous user and opens the dialog", async () => {
  render(
    <MemoryRouter>
      <TopNav />
    </MemoryRouter>,
  );

  const save = screen.getByRole("button", { name: /save your account/i });
  expect(save).toBeInTheDocument();

  await userEvent.click(save);
  expect(screen.getByRole("button", { name: /save account/i })).toBeInTheDocument();
});
