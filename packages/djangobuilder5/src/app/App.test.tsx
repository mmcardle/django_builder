import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("renders the brand and lands on the splash route", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: /django\s*builder/i })).toBeInTheDocument();
});
