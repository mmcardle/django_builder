import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

test("renders children and applies the primary variant by default", () => {
  render(<Button>New Project</Button>);
  const btn = screen.getByRole("button", { name: "New Project" });
  expect(btn).toBeInTheDocument();
  expect(btn.className).toContain("bg-accent");
});

test("applies the ghost variant when requested", () => {
  render(<Button variant="ghost">Docs</Button>);
  expect(screen.getByRole("button", { name: "Docs" }).className).toContain("border");
});
