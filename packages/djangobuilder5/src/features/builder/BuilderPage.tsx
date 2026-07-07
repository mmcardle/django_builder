import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BuilderShell } from "./BuilderShell";
import { useProjectStore } from "@/store/projectStore";

export function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const dataLoaded = useProjectStore((s) => s.dataLoaded);
  const project = useProjectStore((s) => s.project);
  const selectedModelId = useProjectStore((s) => s.selectedModelId);
  const openProject = useProjectStore((s) => s.openProject);
  const select = useProjectStore((s) => s.select);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (id) openProject(id);
  }, [id, openProject, dataLoaded]);

  // Grace period so a freshly-created project (navigated to before its snapshot
  // lands) shows "Loading…" rather than flashing "Project not found."
  useEffect(() => {
    setWaited(false);
    const t = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(t);
  }, [id]);

  // Auto-select the first model once the project's collections have loaded —
  // openProject can run before the models snapshot arrives (per-collection load),
  // so re-derive selection whenever the selected model isn't in the project.
  useEffect(() => {
    if (!project) return;
    const valid = project.apps.some((a) => a.models.some((m) => m.id === selectedModelId));
    if (valid) return;
    const app = project.apps.find((a) => a.models.length > 0) ?? project.apps[0];
    if (app) select(app.id, app.models[0]?.id ?? null);
  }, [project, selectedModelId, select]);

  if (!dataLoaded || (!project && !waited)) return <div className="p-8 text-muted">Loading…</div>;
  if (!project) return <div className="p-8 text-muted">Project not found.</div>;

  return <BuilderShell />;
}
