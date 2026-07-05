import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { EditorPane } from "./EditorPane";
import { useProjectStore } from "@/store/projectStore";
import { makeSeedProject } from "@/domain/seed";

beforeEach(() => {
  localStorage.clear();
  useProjectStore.setState({
    project: makeSeedProject(),
    selectedAppId: "app_blog",
    selectedModelId: "model_post",
  });
});

test("renders the selected model's fields", () => {
  render(<EditorPane />);
  expect(screen.getByDisplayValue("title")).toBeInTheDocument();
  expect(screen.getByDisplayValue("max_length=200")).toBeInTheDocument();
});

test("adding a field grows the store's field list", async () => {
  render(<EditorPane />);
  const before = useProjectStore.getState().project.apps[0].models[0].fields.length;
  await userEvent.click(screen.getByRole("button", { name: "+ field" }));
  expect(useProjectStore.getState().project.apps[0].models[0].fields.length).toBe(before + 1);
});
