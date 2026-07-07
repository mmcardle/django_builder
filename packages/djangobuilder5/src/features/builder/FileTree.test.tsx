import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import type { DjangoProjectFile } from "@djangobuilder/core";
import { FileTree } from "./FileTree";

// Minimal tree fixture (resource is irrelevant to the component).
const R = {} as never;
const NODES: DjangoProjectFile[] = [
  {
    resource: R, type: 2, path: "blog", name: "blog", folder: true,
    children: [
      { resource: R, type: 2, path: "blog/models.py", name: "models.py", folder: false },
      { resource: R, type: 2, path: "blog/admin.py", name: "admin.py", folder: false },
    ],
  },
  { resource: R, type: 1, path: "manage.py", name: "manage.py", folder: false },
];

test("shows top-level files/folders and expands a folder's children on click", async () => {
  render(<FileTree nodes={NODES} selectedPath="" onSelect={() => {}} />);
  // folder + root file visible; children hidden until expanded
  expect(screen.getByText("blog")).toBeInTheDocument();
  expect(screen.getByText("manage.py")).toBeInTheDocument();
  expect(screen.queryByText("models.py")).not.toBeInTheDocument();

  await userEvent.click(screen.getByText("blog"));
  expect(screen.getByText("models.py")).toBeInTheDocument();
  expect(screen.getByText("admin.py")).toBeInTheDocument();
});

test("selecting a file fires onSelect with its path", async () => {
  const onSelect = vi.fn();
  render(<FileTree nodes={NODES} selectedPath="blog/models.py" onSelect={onSelect} />);
  // ancestors of the selected path auto-expand, so models.py is visible
  await userEvent.click(screen.getByText("admin.py"));
  expect(onSelect).toHaveBeenCalledWith("blog/admin.py");
});

test("auto-expands the folder chain leading to the selected file", () => {
  render(<FileTree nodes={NODES} selectedPath="blog/models.py" onSelect={() => {}} />);
  expect(screen.getByText("models.py")).toBeInTheDocument();
});
