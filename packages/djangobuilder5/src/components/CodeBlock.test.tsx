import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { CodeBlock } from "./CodeBlock";

const files = [
  { file: "models.py", code: "class Post:\n    pass" },
  { file: "admin.py", code: "admin.site.register(Post)" },
];

test("renders the first file's highlighted code and its tabs", () => {
  render(<CodeBlock files={files} />);
  expect(screen.getByRole("tab", { name: "models.py" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "admin.py" })).toBeInTheDocument();
  expect(document.querySelector(".hljs-keyword")).not.toBeNull();
});

test("switching tabs shows the other file's code", async () => {
  render(<CodeBlock files={files} />);
  await userEvent.click(screen.getByRole("tab", { name: "admin.py" }));
  expect(screen.getByText(/admin.site.register/)).toBeInTheDocument();
});

test("Copy writes the active file to the clipboard and shows feedback", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<CodeBlock files={files} />);
  await userEvent.click(screen.getByRole("button", { name: /copy/i }));
  expect(writeText).toHaveBeenCalledWith("class Post:\n    pass");
  expect(await screen.findByText(/copied/i)).toBeInTheDocument();
});
