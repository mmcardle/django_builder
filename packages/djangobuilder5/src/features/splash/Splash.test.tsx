import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
vi.mock("@/domain/firestore/auth", () => ({ signInAnon: vi.fn().mockResolvedValue({ uid: "anon" }) }));
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
