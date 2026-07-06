import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
  firebaseApp: {},
  snapshotErrorHandler: () => {},
}));
import { BuilderPage } from "./BuilderPage";
import { useProjectStore } from "@/store/projectStore";
import { makeSeedProject } from "@/domain/seed";

const updateField = vi.fn();
beforeEach(() => {
  updateField.mockClear();
  useProjectStore.setState({
    dataLoaded: true,
    currentProjectId: "p1",
    project: makeSeedProject(),
    selectedAppId: "app_blog",
    selectedModelId: "model_post",
    openProject: vi.fn(),
    updateField,
  } as never);
});

test("renders the generated code and routes edits to the store", async () => {
  render(
    <MemoryRouter initialEntries={["/project/p1"]}>
      <Routes>
        <Route path="/project/:id" element={<BuilderPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByRole("tab", { name: "models.py" })).toBeInTheDocument();
  const nameInput = screen.getByDisplayValue("title");
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, "headline");
  nameInput.blur();
  expect(updateField).toHaveBeenCalled();
});

test("shows a loading state until data is loaded", () => {
  useProjectStore.setState({ dataLoaded: false } as never);
  render(
    <MemoryRouter initialEntries={["/project/p1"]}>
      <Routes>
        <Route path="/project/:id" element={<BuilderPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
