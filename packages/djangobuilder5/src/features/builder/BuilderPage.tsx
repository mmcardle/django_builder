import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BuilderShell } from "./BuilderShell";
import { useProjectStore } from "@/store/projectStore";

export function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const dataLoaded = useProjectStore((s) => s.dataLoaded);
  const project = useProjectStore((s) => s.project);
  const openProject = useProjectStore((s) => s.openProject);
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

  if (!dataLoaded || (!project && !waited)) return <div className="p-8 text-muted">Loading…</div>;
  if (!project) return <div className="p-8 text-muted">Project not found.</div>;

  return <BuilderShell />;
}
