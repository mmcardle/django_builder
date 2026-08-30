import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

const hoisted = vi.hoisted(() => ({ createProject: vi.fn(), navigate: vi.fn() }));
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: { createProject: typeof hoisted.createProject }) => unknown) =>
    sel({ createProject: hoisted.createProject }),
}));
vi.mock("react-router-dom", async (orig) => ({
  ...((await orig()) as object),
  useNavigate: () => hoisted.navigate,
}));

import { EmptyDashboard } from "./EmptyDashboard";

const renderEmpty = () =>
  render(
    <MemoryRouter>
      <EmptyDashboard />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.createProject.mockResolvedValue("p_new");
});

test("creates inline, with no modal in the way", async () => {
  renderEmpty();

  // the form is on the page itself, not behind a "+ New project" button
  expect(screen.queryByRole("button", { name: /\+ new project/i })).not.toBeInTheDocument();

  await userEvent.type(screen.getByLabelText("Project name"), "Shop");
  await userEvent.click(screen.getByRole("button", { name: /create project/i }));

  expect(hoisted.createProject).toHaveBeenCalledWith("Shop", "", 6, true, false);
  expect(hoisted.navigate).toHaveBeenCalledWith("/project/p_new");
});

test("shows real generated Django code as the preview", () => {
  renderEmpty();
  const tabs = screen.getAllByRole("tab").map((t) => t.textContent);
  expect(tabs).toEqual(["models.py", "admin.py", "serializers.py", "views.py", "urls.py"]);
  expect(document.body.textContent).toContain("class Post");
});

test("names the files the download actually contains", () => {
  renderEmpty();
  // derived from the rendered tree, so it can't over-promise
  expect(screen.getByText(/\d+ files/)).toBeInTheDocument();
  ["Models", "Admin", "DRF serializers", "pytest suite", "requirements.txt"].forEach((label) =>
    expect(screen.getByText(label)).toBeInTheDocument(),
  );
});

test("the preview follows the project name as it is typed", async () => {
  renderEmpty();
  const caption = screen.getByText("What comes out").parentElement!;
  expect(within(caption).getByText("myproject")).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText("Project name"), "Shop");
  expect(within(caption).getByText("Shop")).toBeInTheDocument();
});

test("an invalid project name is rejected without creating anything", async () => {
  renderEmpty();
  await userEvent.type(screen.getByLabelText("Project name"), "my shop");
  await userEvent.click(screen.getByRole("button", { name: /create project/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(/can't contain spaces/i);
  expect(hoisted.createProject).not.toHaveBeenCalled();
});
