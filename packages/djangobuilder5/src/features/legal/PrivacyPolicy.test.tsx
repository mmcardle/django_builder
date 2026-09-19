import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { PrivacyPolicy } from "./PrivacyPolicy";

test("renders the heading and explains consent-gated analytics", () => {
  render(
    <MemoryRouter>
      <PrivacyPolicy />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: /privacy policy/i })).toBeInTheDocument();
  expect(screen.getByText(/only enabled if you accept/i)).toBeInTheDocument();
  expect(document.body.textContent).toContain("Firestore");
});
