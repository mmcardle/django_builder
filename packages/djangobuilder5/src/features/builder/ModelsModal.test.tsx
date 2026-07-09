import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

vi.mock("./ModelEditor", () => ({
  ModelEditor: ({ model }: { model: { name: string } }) => <div>model:{model.name}</div>,
}));

const mk = (id: string, name: string) => ({ id, name, abstract: false, fields: [], relationships: [] });
const state = {
  project: { apps: [{ id: "a1", name: "blog", models: [mk("m1", "Post"), mk("m2", "Comment")] }] },
  addModel: vi.fn(),
  removeApp: vi.fn(),
};
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: typeof state) => unknown) => sel(state),
}));

import { ModelsModal } from "./ModelsModal";

test("lists every model in the app plus the app name", () => {
  render(<ModelsModal appId="a1" onClose={() => {}} />);
  expect(screen.getByText("model:Post")).toBeInTheDocument();
  expect(screen.getByText("model:Comment")).toBeInTheDocument();
  expect(screen.getByText("blog")).toBeInTheDocument();
});

test("Add model calls the store", async () => {
  render(<ModelsModal appId="a1" onClose={() => {}} />);
  await userEvent.click(screen.getByRole("button", { name: /add model/i }));
  expect(state.addModel).toHaveBeenCalledWith("a1", expect.any(String));
});

test("Delete app confirms, removes and closes", async () => {
  const onClose = vi.fn();
  render(<ModelsModal appId="a1" onClose={onClose} />);
  await userEvent.click(screen.getByRole("button", { name: /delete app/i }));
  await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));
  expect(state.removeApp).toHaveBeenCalledWith("a1");
  expect(onClose).toHaveBeenCalled();
});

test("Done closes the modal", async () => {
  const onClose = vi.fn();
  render(<ModelsModal appId="a1" onClose={onClose} />);
  await userEvent.click(screen.getByRole("button", { name: /done/i }));
  expect(onClose).toHaveBeenCalled();
});
