import { expect, test, vi } from "vitest";
import {
  APP_PREVIEW_FILES,
  countProjectFiles,
  downloadProjectTar,
  generatedFileNames,
  projectFileTree,
  projectTarUrl,
  renderAppPreview,
  renderNodeByPath,
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

test("projectFileTree includes the project folder, app folder, and root files", () => {
  const tree = projectFileTree(makeSeedProject());
  const names = tree.map((n) => n.name);
  expect(names).toContain("Blog"); // project package folder
  expect(names).toContain("blog"); // app folder
  expect(names).toContain("manage.py"); // a root file
  const app = tree.find((n) => n.name === "blog");
  expect(app?.folder).toBe(true);
  expect(app?.children?.some((c) => c.name === "models.py")).toBe(true);
});

test("renderNodeByPath renders an app file, a project file, and a model template", () => {
  const project = makeSeedProject();
  const appModels = renderNodeByPath(project, "blog/models.py");
  expect(appModels?.lang).toBe("python");
  expect(appModels?.code).toContain("class Post(");

  const settings = renderNodeByPath(project, "Blog/settings.py");
  expect(settings?.lang).toBe("python");
  expect(settings?.code).toContain("INSTALLED_APPS");

  const tmpl = renderNodeByPath(project, "blog/templates/blog/post_list.html");
  expect(tmpl?.lang).toBe("django");
  expect(tmpl?.code.length).toBeGreaterThan(0);
});

test("renderNodeByPath returns null for a folder or an unknown path", () => {
  const project = makeSeedProject();
  expect(renderNodeByPath(project, "blog")).toBeNull(); // folder
  expect(renderNodeByPath(project, "does/not/exist.py")).toBeNull();
});

test("countProjectFiles counts files and ignores folders", () => {
  const n = countProjectFiles(makeSeedProject());
  const flat: string[] = [];
  const walk = (nodes: ReturnType<typeof projectFileTree>) =>
    nodes.forEach((node) => {
      if (!node.folder) flat.push(node.name);
      if (node.children) walk(node.children);
    });
  walk(projectFileTree(makeSeedProject()));
  expect(n).toBe(flat.length);
  expect(n).toBeGreaterThan(20);
});

test("generatedFileNames reports names the renderer really produces", () => {
  const names = generatedFileNames(makeSeedProject());
  ["models.py", "admin.py", "serializers.py", "manage.py", "requirements.txt"].forEach((f) =>
    expect(names.has(f)).toBe(true),
  );
  expect(names.has("nonexistent.py")).toBe(false);
});
