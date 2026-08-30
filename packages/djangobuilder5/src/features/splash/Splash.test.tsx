import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
const hoisted = vi.hoisted(() => ({ signInAnon: vi.fn().mockResolvedValue({ uid: "anon" }) }));
vi.mock("@/domain/firestore/auth", () => ({ signInAnon: () => hoisted.signInAnon() }));
import { Splash } from "./Splash";

test("shows the hero headline, a start button, and a live code panel", () => {
  render(
    <MemoryRouter>
      <Splash />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: /ship the django/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /start building/i })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "models.py" })).toBeInTheDocument();
  expect(document.body.textContent).toContain("class Post");
});

test("a failed guest sign-in surfaces an error rather than doing nothing", async () => {
  hoisted.signInAnon.mockRejectedValueOnce(new Error("anonymous auth disabled"));
  render(
    <MemoryRouter>
      <Splash />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole("button", { name: /start building/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/could not start a guest session/i);
});

test("offers a single call to action, not two that do the same thing", () => {
  render(
    <MemoryRouter>
      <Splash />
    </MemoryRouter>,
  );
  expect(screen.getByRole("button", { name: /start building/i })).toBeInTheDocument();
  // "Live demo" used to sit here firing the very same handler
  expect(screen.queryByRole("button", { name: /live demo/i })).not.toBeInTheDocument();
});
