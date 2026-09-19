import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  reloadUser: vi.fn(),
  isVerified: vi.fn(),
  navigate: vi.fn(),
  setUser: vi.fn(),
}));
vi.mock("@/domain/firestore/auth", () => ({
  reloadUser: hoisted.reloadUser,
  isVerified: hoisted.isVerified,
  resendVerification: vi.fn(),
  signOutUser: vi.fn(),
}));
vi.mock("@/store/authStore", () => ({
  useAuthStore: { getState: () => ({ setUser: hoisted.setUser }) },
}));
vi.mock("react-router-dom", async (orig) => ({
  ...((await orig()) as object),
  useNavigate: () => hoisted.navigate,
}));

import { UnverifiedView } from "./UnverifiedView";

test("refresh reloads the user, pushes it to the store, and navigates once verified", async () => {
  const user = { uid: "u1", emailVerified: true };
  hoisted.reloadUser.mockResolvedValue(user);
  hoisted.isVerified.mockReturnValue(true);
  render(
    <MemoryRouter>
      <UnverifiedView />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole("button", { name: /i've verified/i }));
  expect(hoisted.reloadUser).toHaveBeenCalled();
  expect(hoisted.setUser).toHaveBeenCalledWith(user);
  expect(hoisted.navigate).toHaveBeenCalledWith("/projects");
});

test("refresh shows a message when still unverified", async () => {
  hoisted.reloadUser.mockResolvedValue({ uid: "u1", emailVerified: false });
  hoisted.isVerified.mockReturnValue(false);
  render(
    <MemoryRouter>
      <UnverifiedView />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole("button", { name: /i've verified/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/still not verified/i);
});
