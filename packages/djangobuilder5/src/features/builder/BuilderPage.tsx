import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { TreePane } from "./TreePane";
import { EditorPane } from "./EditorPane";
import { CodePane } from "./CodePane";
import { useProjectStore } from "@/store/projectStore";

export function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const dataLoaded = useProjectStore((s) => s.dataLoaded);
  const project = useProjectStore((s) => s.project);
  const openProject = useProjectStore((s) => s.openProject);

  useEffect(() => {
    if (id) openProject(id);
  }, [id, openProject, dataLoaded]);

  if (!dataLoaded) return <div className="p-8 text-muted">Loading…</div>;
  if (!project) return <div className="p-8 text-muted">Project not found.</div>;

  return (
    <div className="flex h-full min-h-0">
      <TreePane />
      <EditorPane />
      <CodePane />
    </div>
  );
}
