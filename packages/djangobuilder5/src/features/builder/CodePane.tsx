import { useEffect, useMemo, useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { FileTree } from "./FileTree";
import { projectFileTree, renderNodeByPath } from "@/domain/generate";
import { useProjectStore } from "@/store/projectStore";

export function CodePane() {
  const project = useProjectStore((s) => s.project);
  const appId = useProjectStore((s) => s.selectedAppId);

  // The tree is rebuilt from local state; memoise on the project object so a
  // keystroke elsewhere doesn't churn it, while edits still flow through.
  const tree = useMemo(() => (project ? projectFileTree(project) : []), [project]);

  const defaultPath = useMemo(() => {
    if (!project) return "";
    const app = project.apps.find((a) => a.id === appId) ?? project.apps[0];
    return app ? `${app.name}/models.py` : `${project.name}/settings.py`;
  }, [project, appId]);

  // Follow the active app by default; a manual file pick sticks until the app
  // changes (defaultPath is a stable string, so edits don't reset it).
  const [path, setPath] = useState(defaultPath);
  useEffect(() => setPath(defaultPath), [defaultPath]);

  const rendered = useMemo(
    () =>
      project ? (renderNodeByPath(project, path) ?? renderNodeByPath(project, defaultPath)) : null,
    [project, path, defaultPath],
  );

  if (!project) return null;

  return (
    <aside className="flex min-w-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <div className="w-48 shrink-0 overflow-y-auto border-r border-border p-2">
          <FileTree nodes={tree} selectedPath={rendered?.path ?? ""} onSelect={setPath} />
        </div>
        <div className="min-w-0 flex-1 p-3">
          {rendered ? (
            <CodeBlock files={[{ file: rendered.name, code: rendered.code }]} className="h-full" />
          ) : (
            <p className="text-sm text-muted">Select a file to preview.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
