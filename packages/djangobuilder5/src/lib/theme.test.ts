import { beforeEach, expect, test } from "vitest";
import { applyTheme, getInitialTheme, toggleTheme } from "./theme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

test("defaults to dark when nothing stored", () => {
  expect(getInitialTheme()).toBe("dark");
});

test("applyTheme sets the html attribute and persists", () => {
  applyTheme("light");
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  expect(localStorage.getItem("db5-theme")).toBe("light");
});

test("toggleTheme flips dark <-> light and returns the new value", () => {
  applyTheme("dark");
  expect(toggleTheme()).toBe("light");
  expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  expect(toggleTheme()).toBe("dark");
});
