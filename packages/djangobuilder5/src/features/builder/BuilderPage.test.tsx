import { render, screen } from "@testing-library/react";
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

function renderAt() {
  return render(
    <MemoryRouter initialEntries={["/project/p1"]}>
      <Routes>
        <Route path="/project/:id" element={<BuilderPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useProjectStore.setState({
    dataLoaded: true,
    currentProjectId: "p1",
    project: makeSeedProject(),
    selectedAppId: "app_blog",
    openProject: vi.fn(),
  } as never);
});

test("renders the builder with the selected app's models.py by default", () => {
  const { container } = renderAt();
  expect(container.textContent).toContain("class Post("); // default file rendered in the code view
  expect(screen.getByText("models.py")).toBeInTheDocument(); // file tree
});

test("shows a loading state until data is loaded", () => {
  useProjectStore.setState({ dataLoaded: false } as never);
  renderAt();
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
