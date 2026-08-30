import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";
import { DashboardView } from "./DashboardView";
import { useProjectStore } from "@/store/projectStore";
import { MAX_PROJECTS } from "@/domain/constants";

vi.mock("@/lib/firebase", () => ({ auth: { currentUser: null }, db: {}, snapshotErrorHandler: vi.fn() }));

function summary(id: string, name: string) {
  return { id, name, description: "d", djangoVersion: 5, channels: false, htmx: true, appCount: 1, modelCount: 2 };
}
beforeEach(() => {
  useProjectStore.setState({ dataLoaded: true, data: { projects: {}, apps: {}, models: {}, fields: {}, relationships: {} } } as never);
});

test("renders a card per project summary with counts", () => {
  useProjectStore.setState({ summaries: [summary("p1", "Blog"), summary("p2", "Shop")] } as never);
  render(<MemoryRouter><DashboardView /></MemoryRouter>);
  expect(screen.getByText("Blog")).toBeInTheDocument();
  expect(screen.getByText("Shop")).toBeInTheDocument();
  expect(screen.getAllByText("2 models")).toHaveLength(2);
});

test("disables New project at the MAX_PROJECTS limit", () => {
  useProjectStore.setState({ summaries: [summary("1", "A"), summary("2", "B"), summary("3", "C")] } as never);
  render(<MemoryRouter><DashboardView /></MemoryRouter>);
  expect(screen.getByRole("button", { name: /new project/i })).toBeDisabled();
});

test("a user with no projects gets the first-run panel, not an empty grid", () => {
  useProjectStore.setState({ summaries: [] } as never);
  render(<MemoryRouter><DashboardView /></MemoryRouter>);
  expect(screen.getByRole("heading", { name: /name it/i })).toBeInTheDocument();
  expect(screen.getByLabelText("Project name")).toBeInTheDocument();
  // the "0 of 3" header and its modal trigger are gone
  expect(screen.queryByText(`0 of ${MAX_PROJECTS}`)).not.toBeInTheDocument();
});

test("the project grid replaces the first-run panel once one exists", () => {
  useProjectStore.setState({ summaries: [summary("p1", "Blog")] } as never);
  render(<MemoryRouter><DashboardView /></MemoryRouter>);
  expect(screen.queryByRole("heading", { name: /name it/i })).not.toBeInTheDocument();
  expect(screen.getByText(`1 of ${MAX_PROJECTS}`)).toBeInTheDocument();
});
