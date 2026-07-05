import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { BuilderPage } from "./BuilderPage";
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

test("editing a field name updates the live generated models.py", async () => {
  render(<BuilderPage />);
  const models = screen.getByRole("tab", { name: "models.py" });
  expect(models).toBeInTheDocument();
  const pre = document.querySelector("pre")!;
  expect(pre.textContent).toContain("title");

  const nameInput = screen.getByDisplayValue("title");
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, "headline");

  expect(document.querySelector("pre")!.textContent).toContain("headline");
});

test("Download .tar button is present", () => {
  render(<BuilderPage />);
  expect(screen.getByRole("button", { name: /download .tar/i })).toBeInTheDocument();
});
