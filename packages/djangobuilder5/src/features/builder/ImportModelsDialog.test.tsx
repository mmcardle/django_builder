import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

const state = { importModels: vi.fn() };
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: typeof state) => unknown) => sel(state),
}));

import { ImportModelsDialog } from "./ImportModelsDialog";

test("parse then add imports the selected parsed models", async () => {
  render(<ImportModelsDialog appId="a1" onClose={() => {}} />);

  fireEvent.change(screen.getByLabelText("models.py"), {
    target: { value: "class Post(models.Model):\n    title = models.CharField()" },
  });
  await userEvent.click(screen.getByRole("button", { name: "Parse" }));

  expect(screen.getByText("Post")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /add selected/i }));
  expect(state.importModels).toHaveBeenCalledWith(
    "a1",
    expect.arrayContaining([expect.objectContaining({ name: "Post" })]),
  );
});

test("Parse is disabled until there is text", () => {
  render(<ImportModelsDialog appId="a1" onClose={() => {}} />);
  expect(screen.getByRole("button", { name: "Parse" })).toBeDisabled();
});
