import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  upgradeAnonymous: vi.fn(),
  setUser: vi.fn(),
}));
vi.mock("@/domain/firestore/auth", () => ({
  upgradeAnonymous: hoisted.upgradeAnonymous,
}));
vi.mock("@/store/authStore", () => ({
  useAuthStore: { getState: () => ({ setUser: hoisted.setUser }) },
}));

import { UpgradeAccountDialog } from "./UpgradeAccountDialog";

beforeEach(() => {
  vi.clearAllMocks();
});

test("submitting upgrades the account, pushes the user, and shows success", async () => {
  const user = { uid: "u1", email: "me@example.com" };
  hoisted.upgradeAnonymous.mockResolvedValue(user);
  render(
    <MemoryRouter>
      <UpgradeAccountDialog onClose={() => {}} />
    </MemoryRouter>,
  );

  await userEvent.type(screen.getByLabelText("Email"), "me@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "hunter2");
  await userEvent.click(screen.getByRole("button", { name: /save account/i }));

  expect(hoisted.upgradeAnonymous).toHaveBeenCalledWith("me@example.com", "hunter2");
  expect(hoisted.setUser).toHaveBeenCalledWith(user);
  expect(await screen.findByText(/check your email to verify/i)).toBeInTheDocument();
});

test("shows an error when the upgrade fails", async () => {
  hoisted.upgradeAnonymous.mockRejectedValue(new Error("boom"));
  render(
    <MemoryRouter>
      <UpgradeAccountDialog onClose={() => {}} />
    </MemoryRouter>,
  );

  await userEvent.type(screen.getByLabelText("Email"), "me@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "hunter2");
  await userEvent.click(screen.getByRole("button", { name: /save account/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(/could not save your account/i);
  expect(hoisted.setUser).not.toHaveBeenCalled();
});

test("onDiscard puts the dialog in sign-out mode with a destructive escape hatch", async () => {
  const onDiscard = vi.fn();
  render(
    <MemoryRouter>
      <UpgradeAccountDialog onClose={() => {}} onDiscard={onDiscard} />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: /save your projects before you go/i })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /sign out and delete/i }));
  expect(onDiscard).toHaveBeenCalled();
});

test("without onDiscard there is no way to delete from the dialog", () => {
  render(
    <MemoryRouter>
      <UpgradeAccountDialog onClose={() => {}} />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: /save your account/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /sign out and delete/i })).not.toBeInTheDocument();
});
