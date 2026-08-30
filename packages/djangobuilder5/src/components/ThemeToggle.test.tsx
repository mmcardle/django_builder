import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { ThemeToggle } from "./ThemeToggle";
import { applyTheme } from "@/lib/theme";

beforeEach(() => {
  localStorage.clear();
  applyTheme("dark");
});

test("clicking the toggle switches the document theme", async () => {
  render(<ThemeToggle />);
  await userEvent.click(screen.getByRole("button", { name: /theme/i }));
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
});
