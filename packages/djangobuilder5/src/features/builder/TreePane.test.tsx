import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
  firebaseApp: {},
  snapshotErrorHandler: () => {},
}));
import { TreePane } from "./TreePane";
import { useProjectStore } from "@/store/projectStore";
import { makeSeedProject } from "@/domain/seed";

const addModel = vi.fn();
beforeEach(() => {
  localStorage.clear();
  addModel.mockClear();
  useProjectStore.setState({
    project: makeSeedProject(),
    selectedAppId: "app_blog",
    selectedModelId: "model_post",
    addModel,
  } as never);
});

test("lists seed models and can add a new one via the inline input", async () => {
  render(<TreePane />);
  expect(screen.getByRole("button", { name: "Post" })).toBeInTheDocument();
  const input = screen.getByRole("textbox", { name: /add model to blog/i });
  await userEvent.type(input, "Tag{enter}");
  expect(addModel).toHaveBeenCalledWith("app_blog", "Tag");
});
