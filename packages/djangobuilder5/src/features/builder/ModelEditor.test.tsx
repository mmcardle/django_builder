import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import type { LocalModel } from "@/domain/types";

const model: LocalModel = {
  id: "m1",
  name: "Post",
  abstract: false,
  parents: [],
  fields: [{ id: "f1", name: "title", type: "CharField", args: "max_length=200" }],
  relationships: [{ id: "r1", name: "author", type: "ForeignKey", to: "auth.User", args: "" }],
};

const state = {
  project: {
    apps: [
      { id: "a1", name: "blog", models: [model] },
      { id: "a2", name: "shop", models: [] },
    ],
  },
  updateModel: vi.fn(), renameModel: vi.fn(), addField: vi.fn(), updateField: vi.fn(), removeField: vi.fn(),
  addRelationship: vi.fn(), updateRelationship: vi.fn(), removeRelationship: vi.fn(), removeModel: vi.fn(),
  setModelParents: vi.fn(), moveModel: vi.fn(),
};
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel?: (s: typeof state) => unknown) => (sel ? sel(state) : state),
}));

import { ModelEditor } from "./ModelEditor";

test("renders the model's name, fields and relationships", () => {
  render(<ModelEditor appId="a1" model={model} />);
  expect((screen.getByLabelText("model m1 name") as HTMLInputElement).value).toBe("Post");
  expect((screen.getByLabelText("field f1 name") as HTMLInputElement).value).toBe("title");
  expect((screen.getByLabelText("rel r1 name") as HTMLInputElement).value).toBe("author");
});

test("toggling abstract and adding a field call the store", async () => {
  render(<ModelEditor appId="a1" model={model} />);
  await userEvent.click(screen.getByRole("checkbox", { name: /abstract/i }));
  expect(state.updateModel).toHaveBeenCalledWith("a1", "m1", { abstract: true });
  await userEvent.click(screen.getByRole("button", { name: "+ field" }));
  expect(state.addField).toHaveBeenCalledWith("a1", "m1");
});

test("renaming the model commits renameModel with the trimmed name", async () => {
  render(<ModelEditor appId="a1" model={model} />);
  const name = screen.getByLabelText("model m1 name");
  await userEvent.clear(name);
  await userEvent.type(name, "Article");
  await userEvent.tab();
  expect(state.renameModel).toHaveBeenCalledWith("a1", "m1", "Article");
});

test("editing field args (textarea) commits updateField", async () => {
  render(<ModelEditor appId="a1" model={model} />);
  const args = screen.getByLabelText("field f1 args");
  await userEvent.clear(args);
  await userEvent.type(args, "max_length=500");
  await userEvent.tab();
  expect(state.updateField).toHaveBeenLastCalledWith("a1", "m1", "f1", { args: "max_length=500" });
});

test("relationship args are now editable and commit updateRelationship", async () => {
  render(<ModelEditor appId="a1" model={model} />);
  const args = screen.getByLabelText("rel r1 args");
  await userEvent.type(args, "on_delete=models.CASCADE");
  await userEvent.tab();
  expect(state.updateRelationship).toHaveBeenLastCalledWith("a1", "m1", "r1", {
    args: "on_delete=models.CASCADE",
  });
});

test("relationship selects are shrinkable so the row can't overflow its container", () => {
  render(<ModelEditor appId="a1" model={model} />);
  expect(screen.getByLabelText("rel r1 target").className).toContain("flex-1");
  expect(screen.getByLabelText("rel r1 target").className).toContain("min-w-0");
  expect(screen.getByLabelText("rel r1 type").className).toContain("flex-1");
});

test("adding a built-in parent commits setModelParents with its full class path", async () => {
  render(<ModelEditor appId="a1" model={model} />);
  await userEvent.selectOptions(screen.getByLabelText("model m1 add parent"), "auth.User");
  expect(state.setModelParents).toHaveBeenCalledWith("a1", "m1", [
    { type: "django", class: "django.contrib.auth.models.User" },
  ]);
});

test("Move to… re-parents the model to the chosen app", async () => {
  render(<ModelEditor appId="a1" model={model} />);
  await userEvent.selectOptions(screen.getByLabelText("move model m1"), "shop");
  expect(state.moveModel).toHaveBeenCalledWith("a1", "a2", "m1");
});

test("deleting a model asks to confirm, then calls removeModel", async () => {
  render(<ModelEditor appId="a1" model={model} />);
  await userEvent.click(screen.getByRole("button", { name: /delete model/i }));
  await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));
  expect(state.removeModel).toHaveBeenCalledWith("a1", "m1");
});
