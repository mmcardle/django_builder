import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { TreePane } from "./TreePane";
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

test("lists seed models and can add a new one via the inline input", async () => {
  render(<TreePane />);
  expect(screen.getByRole("button", { name: "Post" })).toBeInTheDocument();
  const input = screen.getByRole("textbox", { name: /add model to blog/i });
  await userEvent.type(input, "Tag{enter}");
  expect(await screen.findByRole("button", { name: "Tag" })).toBeInTheDocument();
});
