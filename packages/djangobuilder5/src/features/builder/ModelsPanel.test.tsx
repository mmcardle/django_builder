import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("./ModelEditor", () => ({
  ModelEditor: ({ model }: { model: { name: string } }) => <div>model:{model.name}</div>,
}));

const mk = (id: string, name: string) => ({ id, name, abstract: false, parents: [], fields: [], relationships: [] });
const state = {
  project: { apps: [{ id: "a1", name: "blog", models: [mk("m1", "Post")] }] },
  addModel: vi.fn(),
  renameApp: vi.fn(),
  removeApp: vi.fn(),
};
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: typeof state) => unknown) => sel(state),
}));

import { ModelsPanel } from "./ModelsPanel";

beforeEach(() => {
  vi.clearAllMocks();
});

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
  expect(screen.getByLabelText("App name")).toHaveValue("blog");
});

test("editing the app name renames the app", async () => {
  render(<ModelsPanel appId="a1" />);
  const input = screen.getByLabelText("App name");
  await userEvent.clear(input);
  await userEvent.type(input, "weblog");
  await userEvent.tab(); // blur commits immediately
  expect(state.renameApp).toHaveBeenCalledWith("a1", "weblog");
});

test("a blank app name is ignored rather than written", async () => {
  render(<ModelsPanel appId="a1" />);
  const input = screen.getByLabelText("App name");
  await userEvent.clear(input);
  await userEvent.tab();
  expect(state.renameApp).not.toHaveBeenCalled();
});

test("an invalid app name is flagged and never written", async () => {
  render(<ModelsPanel appId="a1" />);
  const input = screen.getByLabelText("App name");
  await userEvent.clear(input);
  await userEvent.type(input, "my app");
  await userEvent.tab();
  expect(state.renameApp).not.toHaveBeenCalled();
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAttribute("title", "App name can't contain spaces");
});
