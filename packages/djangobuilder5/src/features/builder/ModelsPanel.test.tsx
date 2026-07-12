import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("./ModelEditor", () => ({
  ModelEditor: ({ model }: { model: { name: string } }) => <div>model:{model.name}</div>,
}));

const mk = (id: string, name: string) => ({ id, name, abstract: false, parents: [], fields: [], relationships: [] });
const state = {
  project: { apps: [{ id: "a1", name: "blog", models: [mk("m1", "Post")] }] },
  addModel: vi.fn(),
  removeApp: vi.fn(),
};
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: typeof state) => unknown) => sel(state),
}));

import { ModelsPanel } from "./ModelsPanel";

test("modal mode (onClose) shows Close and Done", () => {
  render(<ModelsPanel appId="a1" onClose={() => {}} />);
  expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
});

test("docked mode (no onClose) is non-closable but still functional", () => {
  render(<ModelsPanel appId="a1" />);
  expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /done/i })).not.toBeInTheDocument();
  // content still renders
  expect(screen.getByText("model:Post")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /add model/i })).toBeInTheDocument();
  expect(screen.getByText("blog")).toBeInTheDocument();
});
