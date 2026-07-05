import { expect, test, vi } from "vitest";
import {
  APP_PREVIEW_FILES,
  downloadProjectTar,
  projectTarUrl,
  renderAppPreview,
} from "./generate";
import { makeSeedProject } from "./seed";

test("renderAppPreview returns one entry per preview file, models.py first", () => {
  const files = renderAppPreview(makeSeedProject(), "app_blog");
  expect(files.map((f) => f.file)).toEqual([...APP_PREVIEW_FILES]);
  expect(files[0].code).toContain("class Post(");
});

test("renderAppPreview returns [] for an unknown app id", () => {
  expect(renderAppPreview(makeSeedProject(), "nope")).toEqual([]);
});

test("projectTarUrl returns a base64 tar data URI", () => {
  const url = projectTarUrl(makeSeedProject());
  expect(url.startsWith("data:application/tar;base64,")).toBe(true);
  expect(url.length).toBeGreaterThan(100);
});

test("downloadProjectTar clicks an anchor with the project filename", () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  downloadProjectTar(makeSeedProject());
  expect(click).toHaveBeenCalledOnce();
  click.mockRestore();
});
