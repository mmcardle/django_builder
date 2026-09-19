import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DebouncedTextarea } from "./DebouncedTextarea";

test("commits the typed value on blur", async () => {
  const onCommit = vi.fn();
  render(<DebouncedTextarea value="" onCommit={onCommit} aria-label="args" />);
  await userEvent.type(screen.getByLabelText("args"), "max_length=200");
  await userEvent.tab();
  expect(onCommit).toHaveBeenLastCalledWith("max_length=200");
});

test("Enter does not insert a newline (stays a single logical line)", async () => {
  const onCommit = vi.fn();
  render(<DebouncedTextarea value="on_delete=CASCADE" onCommit={onCommit} aria-label="args" />);
  const ta = screen.getByLabelText("args") as HTMLTextAreaElement;
  ta.focus();
  await userEvent.type(ta, "{Enter}");
  expect(ta.value).not.toContain("\n");
});

test("adopts an external value only while unfocused", async () => {
  const { rerender } = render(<DebouncedTextarea value="a" onCommit={() => {}} aria-label="args" />);
  const ta = screen.getByLabelText("args") as HTMLTextAreaElement;
  ta.focus();
  await userEvent.type(ta, "bc"); // now "abc", focused
  rerender(<DebouncedTextarea value="external" onCommit={() => {}} aria-label="args" />);
  expect(ta.value).toBe("abc"); // external ignored while focused
});
