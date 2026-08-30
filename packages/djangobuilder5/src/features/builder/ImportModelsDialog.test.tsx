import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { MAX_MODELS_PER_APP } from "@/domain/constants";

const mkModel = (id: string) => ({
  id, name: `M${id}`, abstract: false, parents: [], fields: [], relationships: [],
});
const state = {
  importModels: vi.fn(),
  project: {
    apps: [
      { id: "a1", name: "blog", models: [] as ReturnType<typeof mkModel>[] },
      { id: "a2", name: "shop", models: [] as ReturnType<typeof mkModel>[] },
    ],
  },
};
vi.mock("@/store/projectStore", () => ({
  useProjectStore: (sel: (s: typeof state) => unknown) => sel(state),
}));

import { ImportModelsDialog } from "./ImportModelsDialog";

const SOURCE = "class Post(models.Model):\n    title = models.CharField()";

beforeEach(() => {
  vi.clearAllMocks();
  state.project.apps[0].models = [];
  state.project.apps[1].models = [];
});

async function parse(source = SOURCE) {
  fireEvent.change(screen.getByLabelText("models.py"), { target: { value: source } });
  await userEvent.click(screen.getByRole("button", { name: "Parse" }));
}

test("parse then add imports the selected parsed models into the opening app", async () => {
  render(<ImportModelsDialog appId="a1" onClose={() => {}} />);
  await parse();

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

test("a model can be routed to a different app than the one that opened the dialog", async () => {
  render(<ImportModelsDialog appId="a1" onClose={() => {}} />);
  await parse();

  await userEvent.selectOptions(screen.getByLabelText("target app for Post"), "a2");
  await userEvent.click(screen.getByRole("button", { name: /add selected/i }));

  expect(state.importModels).toHaveBeenCalledTimes(1);
  expect(state.importModels).toHaveBeenCalledWith(
    "a2",
    expect.arrayContaining([expect.objectContaining({ name: "Post" })]),
  );
});

test("uploading .py files fills the textarea and parses them", async () => {
  render(<ImportModelsDialog appId="a1" onClose={() => {}} />);

  const file = new File([SOURCE], "models.py", { type: "text/x-python" });
  await userEvent.upload(screen.getByLabelText("Upload models.py files"), file);

  expect(await screen.findByText("Post")).toBeInTheDocument();
  expect(screen.getByLabelText("models.py")).toHaveValue(SOURCE);
});

test("deselected models are not imported", async () => {
  render(<ImportModelsDialog appId="a1" onClose={() => {}} />);
  await parse();

  await userEvent.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("button", { name: /add selected/i })).toBeDisabled();
});

test("an import that would breach the per-app model cap is blocked and explained", async () => {
  state.project.apps[0].models = Array.from({ length: MAX_MODELS_PER_APP }, (_, i) => mkModel(`m${i}`));
  render(<ImportModelsDialog appId="a1" onClose={() => {}} />);
  await parse();

  expect(screen.getByRole("alert")).toHaveTextContent(
    new RegExp(`limit is ${MAX_MODELS_PER_APP} per app`, "i"),
  );
  expect(screen.getByRole("button", { name: /add selected/i })).toBeDisabled();

  // routing it to the app with room clears the block
  await userEvent.selectOptions(screen.getByLabelText("target app for Post"), "a2");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /add selected/i })).toBeEnabled();
});
