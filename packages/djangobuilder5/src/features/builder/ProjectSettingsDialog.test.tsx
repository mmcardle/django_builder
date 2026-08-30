import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { makeSeedProject } from "@/domain/seed";

const hoisted = vi.hoisted(() => ({
  setProjectName: vi.fn(),
  setDescription: vi.fn(),
  setDjangoVersion: vi.fn(),
  setFlag: vi.fn(),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  navigate: vi.fn(),
}));

const state = {
  project: makeSeedProject(),
  setProjectName: hoisted.setProjectName,
  setDescription: hoisted.setDescription,
  setDjangoVersion: hoisted.setDjangoVersion,
  setFlag: hoisted.setFlag,
  deleteProject: hoisted.deleteProject,
};
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: typeof state) => unknown) => sel(state),
}));
vi.mock("react-router-dom", async (orig) => ({
  ...((await orig()) as object),
  useNavigate: () => hoisted.navigate,
}));

import { ProjectSettingsDialog } from "./ProjectSettingsDialog";

test("pre-fills from the project and saves only changed fields", async () => {
  const onClose = vi.fn();
  render(<ProjectSettingsDialog onClose={onClose} />);

  const name = screen.getByLabelText("Project name") as HTMLInputElement;
  expect(name.value).toBe("Blog");

  await userEvent.clear(name);
  await userEvent.type(name, "Blogger");
  await userEvent.click(screen.getByText("HTMX")); // seed htmx=true -> toggles off
  await userEvent.click(screen.getByRole("button", { name: /save/i }));

  expect(hoisted.setProjectName).toHaveBeenCalledWith("Blogger");
  expect(hoisted.setFlag).toHaveBeenCalledWith("htmx", false);
  expect(hoisted.setDescription).not.toHaveBeenCalled(); // unchanged
  expect(onClose).toHaveBeenCalled();
});

test("delete asks to confirm, then deletes and navigates to projects", async () => {
  render(<ProjectSettingsDialog onClose={() => {}} />);
  await userEvent.click(screen.getByRole("button", { name: /delete project/i }));
  await userEvent.click(screen.getByRole("button", { name: /^delete$/i })); // confirm
  expect(hoisted.deleteProject).toHaveBeenCalledWith("proj_seed");
  expect(hoisted.navigate).toHaveBeenCalledWith("/projects");
});
