import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

const media = vi.hoisted(() => ({ wide: false }));
vi.mock("@/lib/useMediaQuery", () => ({ useMediaQuery: () => media.wide }));
afterEach(() => {
  media.wide = false;
});

vi.mock("@/domain/generate", () => ({ projectFileTree: () => [], renderNodeByPath: () => null }));
vi.mock("./ProjectHeader", () => ({
  ProjectHeader: ({ onToggleTree }: { onToggleTree?: () => void }) => (
    <button onClick={onToggleTree}>HEADER-TOGGLE</button>
  ),
}));
vi.mock("./FileTree", () => ({
  FileTree: ({ onEditModels }: { onEditModels?: (a: string) => void }) => (
    <div>FILETREE<button onClick={() => onEditModels?.("blog")}>TREE-EDIT</button></div>
  ),
}));
vi.mock("./CodeView", () => ({
  CodeView: ({ onEditModels }: { onEditModels: (a: string) => void }) => (
    <button onClick={() => onEditModels("blog")}>CODEVIEW-EDIT</button>
  ),
}));
vi.mock("./ModelsModal", () => ({
  ModelsModal: ({ appId, onClose }: { appId: string; onClose: () => void }) => (
    <div>MODAL:{appId}<button onClick={onClose}>close-modal</button></div>
  ),
}));
vi.mock("./ModelsPanel", () => ({
  ModelsPanel: ({ appId }: { appId: string }) => <div>PANEL:{appId}</div>,
}));

const state = {
  project: { name: "Shop", apps: [{ id: "a1", name: "blog", models: [] }] },
  selectedAppId: "a1",
  addApp: vi.fn(),
};
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: typeof state) => unknown) => sel(state),
}));

import { BuilderShell } from "./BuilderShell";

test("shows the file tree + code, with no Design/Code tabs", () => {
  render(<BuilderShell />);
  expect(screen.getByText("FILETREE")).toBeInTheDocument();
  expect(screen.getByText("CODEVIEW-EDIT")).toBeInTheDocument();
  expect(screen.queryByRole("tab")).not.toBeInTheDocument();
});

test("the header toggle opens and the scrim closes the file-tree drawer", async () => {
  render(<BuilderShell />);
  expect(screen.queryByTestId("tree-drawer")).not.toBeInTheDocument();
  await userEvent.click(screen.getByText("HEADER-TOGGLE"));
  expect(screen.getByTestId("tree-drawer")).toBeInTheDocument();
  await userEvent.click(screen.getByLabelText("Close file tree"));
  expect(screen.queryByTestId("tree-drawer")).not.toBeInTheDocument();
});

test("editing models opens the centered modal below the docking width", async () => {
  render(<BuilderShell />); // media.wide = false
  expect(screen.queryByText("MODAL:a1")).not.toBeInTheDocument();
  await userEvent.click(screen.getByText("CODEVIEW-EDIT"));
  expect(screen.getByText("MODAL:a1")).toBeInTheDocument();
  expect(screen.queryByTestId("models-dock")).not.toBeInTheDocument();
  await userEvent.click(screen.getByText("close-modal"));
  expect(screen.queryByText("MODAL:a1")).not.toBeInTheDocument();
});

test("editing models docks the panel beside the code on very wide screens", async () => {
  media.wide = true;
  render(<BuilderShell />);
  await userEvent.click(screen.getByText("CODEVIEW-EDIT"));
  expect(screen.getByTestId("models-dock")).toBeInTheDocument();
  expect(screen.getByText("PANEL:a1")).toBeInTheDocument();
  expect(screen.queryByText("MODAL:a1")).not.toBeInTheDocument(); // no overlay
});
