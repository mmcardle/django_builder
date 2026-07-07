import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { makeSeedProject } from "@/domain/seed";

const hoisted = vi.hoisted(() => ({ download: vi.fn() }));
vi.mock("@/domain/generate", () => ({ downloadProjectTar: hoisted.download }));

const state = {
  project: makeSeedProject(),
  setProjectName: vi.fn(), setDescription: vi.fn(), setDjangoVersion: vi.fn(),
  setFlag: vi.fn(), deleteProject: vi.fn(),
};
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: typeof state) => unknown) => sel(state),
}));

import { ProjectHeader } from "./ProjectHeader";

function renderHeader(props = {}) {
  return render(
    <MemoryRouter>
      <ProjectHeader {...props} />
    </MemoryRouter>,
  );
}

test("shows the project name, description and setting chips", () => {
  renderHeader();
  expect(screen.getByText("Blog")).toBeInTheDocument();
  expect(screen.getByText("A starter blog project.")).toBeInTheDocument();
  expect(screen.getByText("Django 5")).toBeInTheDocument();
  expect(screen.getByText("HTMX")).toBeInTheDocument();
  expect(screen.queryByText("Channels")).not.toBeInTheDocument(); // seed channels=false
});

test("Settings opens the settings dialog", async () => {
  renderHeader();
  await userEvent.click(screen.getByRole("button", { name: /settings/i }));
  expect(screen.getByText("Project settings")).toBeInTheDocument();
});

test("Download triggers the tarball download", async () => {
  renderHeader();
  await userEvent.click(screen.getByRole("button", { name: /download/i }));
  expect(hoisted.download).toHaveBeenCalledWith(state.project);
});

test("the tree toggle fires its callback", async () => {
  const onToggleTree = vi.fn();
  renderHeader({ onToggleTree });
  await userEvent.click(screen.getByRole("button", { name: /file tree/i }));
  expect(onToggleTree).toHaveBeenCalled();
});
