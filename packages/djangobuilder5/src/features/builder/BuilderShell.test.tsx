import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

vi.mock("./TreePane", () => ({ TreePane: () => <div>TREE</div> }));
vi.mock("./EditorPane", () => ({ EditorPane: () => <div>EDITOR</div> }));
vi.mock("./CodePane", () => ({ CodePane: () => <div>CODE</div> }));
vi.mock("./ProjectHeader", () => ({
  ProjectHeader: ({ onToggleTree }: { onToggleTree?: () => void }) => (
    <button onClick={onToggleTree}>HEADER-TOGGLE</button>
  ),
}));

import { BuilderShell } from "./BuilderShell";

test("main area defaults to the Design tab with Code hidden", () => {
  render(<BuilderShell />);
  expect(screen.getByRole("tab", { name: "Design" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByTestId("editor-pane").className).not.toContain("hidden");
  expect(screen.getByTestId("code-pane").className).toContain("hidden");
});

test("Design/Code tabs swap the visible pane at every width", async () => {
  render(<BuilderShell />);
  const editWrap = screen.getByTestId("editor-pane");
  const codeWrap = screen.getByTestId("code-pane");

  await userEvent.click(screen.getByRole("tab", { name: "Code" }));
  expect(editWrap.className).toContain("hidden");
  expect(codeWrap.className).not.toContain("hidden");

  await userEvent.click(screen.getByRole("tab", { name: "Design" }));
  expect(editWrap.className).not.toContain("hidden");
  expect(codeWrap.className).toContain("hidden");
});

test("the header toggle opens and the scrim closes the tree drawer", async () => {
  render(<BuilderShell />);
  expect(screen.queryByTestId("tree-drawer")).not.toBeInTheDocument();

  await userEvent.click(screen.getByText("HEADER-TOGGLE"));
  expect(screen.getByTestId("tree-drawer")).toBeInTheDocument();

  await userEvent.click(screen.getByLabelText("Close file tree"));
  expect(screen.queryByTestId("tree-drawer")).not.toBeInTheDocument();
});
