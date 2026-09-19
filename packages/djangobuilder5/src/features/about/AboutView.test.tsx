import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { AboutView } from "./AboutView";

test("shows the about heading, the GitHub repo link, and the Bitcoin address", () => {
  render(
    <MemoryRouter>
      <AboutView />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: /about django.?builder/i })).toBeInTheDocument();
  const repoLink = screen.getByRole("link", { name: /django builder on github/i });
  expect(repoLink).toHaveAttribute("href", expect.stringContaining("github.com/mmcardle/django_builder"));
  expect(document.body.textContent).toContain("1J7JaUA5YhowVNtWCEoSh2tUD7pVJQfwcx");
});
