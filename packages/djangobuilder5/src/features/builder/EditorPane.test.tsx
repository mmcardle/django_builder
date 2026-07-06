import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
  firebaseApp: {},
  snapshotErrorHandler: () => {},
}));
import { EditorPane } from "./EditorPane";
import { useProjectStore } from "@/store/projectStore";
import { makeSeedProject } from "@/domain/seed";

const addField = vi.fn();
beforeEach(() => {
  localStorage.clear();
  addField.mockClear();
  useProjectStore.setState({
    project: makeSeedProject(),
    selectedAppId: "app_blog",
    selectedModelId: "model_post",
    addField,
  } as never);
});

test("renders the selected model's fields", () => {
  render(<EditorPane />);
  expect(screen.getByDisplayValue("title")).toBeInTheDocument();
  expect(screen.getByDisplayValue("max_length=200")).toBeInTheDocument();
});

test("adding a field routes to the store action", async () => {
  render(<EditorPane />);
  await userEvent.click(screen.getByRole("button", { name: "+ field" }));
  expect(addField).toHaveBeenCalledWith("app_blog", "model_post");
});
