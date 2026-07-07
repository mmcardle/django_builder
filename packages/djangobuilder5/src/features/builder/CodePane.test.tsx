import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { makeSeedProject } from "@/domain/seed";

const state = { project: makeSeedProject(), selectedAppId: "app_blog" };
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: typeof state) => unknown) => sel(state),
}));

import { CodePane } from "./CodePane";

test("defaults to the selected app's models.py", () => {
  const { container } = render(<CodePane />);
  expect(container.textContent).toContain("class Post(");
});

test("selecting a project file renders project-level content", async () => {
  const { container } = render(<CodePane />);
  await userEvent.click(screen.getByText("Blog")); // expand project package folder
  await userEvent.click(screen.getByText("settings.py"));
  expect(container.textContent).toContain("INSTALLED_APPS");
});
