import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import type { RenderedFile } from "@/domain/generate";
import { CodeView } from "./CodeView";

const file = (over: Partial<RenderedFile>): RenderedFile => ({
  code: "x = 1", lang: "python", name: "urls.py", path: "app1/urls.py", ...over,
});

test("renders the file path + code, and no Edit-models for non-models files", () => {
  render(<CodeView rendered={file({})} onEditModels={() => {}} />);
  expect(screen.getByText("app1/urls.py")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /edit models/i })).not.toBeInTheDocument();
});

test("models.py gets an Edit-models button that reports its app", async () => {
  const onEditModels = vi.fn();
  render(
    <CodeView
      rendered={file({ name: "models.py", path: "app1/models.py", code: "class Post: pass" })}
      onEditModels={onEditModels}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: /edit models/i }));
  expect(onEditModels).toHaveBeenCalledWith("app1");
});

test("empty state when nothing renders", () => {
  render(<CodeView rendered={null} onEditModels={() => {}} />);
  expect(screen.getByText(/select a file/i)).toBeInTheDocument();
});
