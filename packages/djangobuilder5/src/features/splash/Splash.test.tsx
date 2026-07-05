import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { Splash } from "./Splash";

test("shows the hero headline, a CTA to /build, and a live code panel", () => {
  render(
    <MemoryRouter>
      <Splash />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: /ship the django/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /start building/i })).toHaveAttribute("href", "/build");
  expect(screen.getByRole("tab", { name: "models.py" })).toBeInTheDocument();
  expect(document.body.textContent).toContain("class Post");
});
