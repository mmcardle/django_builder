import { Renderer } from "@djangobuilder/core";
import { buildCoreProject } from "./buildCoreProject";
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
