import { Renderer, DjangoProjectFileResource } from "@djangobuilder/core";
import type { DjangoProjectFile, DjangoApp, DjangoModel, DjangoProject } from "@djangobuilder/core";
import { buildCoreProject } from "./buildCoreProject";
import { langForFile } from "@/lib/highlight";
import type { LocalProject } from "./types";

export const APP_PREVIEW_FILES = [
  "models.py",
  "admin.py",
  "serializers.py",
  "views.py",
  "urls.py",
] as const;
export type PreviewFile = (typeof APP_PREVIEW_FILES)[number];

const renderer = new Renderer();

export function renderAppPreview(
  project: LocalProject,
  appId: string,
): { file: PreviewFile; code: string }[] {
  const core = buildCoreProject(project);
  const app = core.apps.find((a) => a.id === appId);
  if (!app) return [];
  return APP_PREVIEW_FILES.map((file) => ({ file, code: renderer.renderAppFile(file, app) }));
}

/** The full generated-project file tree (folders + project/app/model files). */
export function projectFileTree(project: LocalProject): DjangoProjectFile[] {
  return renderer.asTree(buildCoreProject(project));
}

function walkFiles(nodes: DjangoProjectFile[], visit: (node: DjangoProjectFile) => void): void {
  for (const node of nodes) {
    if (!node.folder) visit(node);
    if (node.children) walkFiles(node.children, visit);
  }
}

/** How many files (not folders) the project generates. */
export function countProjectFiles(project: LocalProject): number {
  let n = 0;
  walkFiles(projectFileTree(project), () => n++);
  return n;
}

/** The distinct file names the project generates. Lets the UI describe the
 * output from what is actually produced rather than a hand-kept list. */
export function generatedFileNames(project: LocalProject): Set<string> {
  const names = new Set<string>();
  walkFiles(projectFileTree(project), (node) => names.add(node.name));
  return names;
}

export interface RenderedFile {
  code: string;
  lang: ReturnType<typeof langForFile>;
  name: string;
  path: string;
}

/** Render a single tree node addressed by its unique `path`. Rebuilds the core
 * project from local state so the view stays live as models change. Returns
 * null for a folder, an unknown path, or a template that fails to render. */
export function renderNodeByPath(project: LocalProject, path: string): RenderedFile | null {
  const core = buildCoreProject(project);
  const node = renderer.asFlat(core).find((n) => n.path === path);
  if (!node || node.folder) return null;
  try {
    const code = renderNode(core, node);
    return { code, lang: langForFile(node.name), name: node.name, path };
  } catch {
    return null;
  }
}

function renderNode(core: DjangoProject, node: DjangoProjectFile): string {
  switch (node.type) {
    case DjangoProjectFileResource.PROJECT_FILE:
      return renderer.renderProjectFile(node.name, core);
    case DjangoProjectFileResource.APP_FILE:
      return renderer.renderAppFile(node.name, node.resource as DjangoApp);
    case DjangoProjectFileResource.MODEL_FILE:
      return renderer.renderModelFile(node.name, node.resource as DjangoModel);
    default:
      throw new Error(`Not a renderable file node: ${node.path}`);
  }
}

export function projectTarUrl(project: LocalProject): string {
  return renderer.tarballURL(buildCoreProject(project));
}

export function downloadProjectTar(project: LocalProject): void {
  const url = projectTarUrl(project);
  const link = document.createElement("a");
  link.download = `${project.name || "project"}.tar`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
