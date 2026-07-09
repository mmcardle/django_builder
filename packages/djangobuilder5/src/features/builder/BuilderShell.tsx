import { useEffect, useMemo, useState } from "react";
import { projectFileTree, renderNodeByPath } from "@/domain/generate";
import { useProjectStore } from "@/store/projectStore";
import { ProjectHeader } from "./ProjectHeader";
import { FileTree } from "./FileTree";
import { CodeView } from "./CodeView";
import { ModelsModal } from "./ModelsModal";

/** Builder layout: a single generated-file tree (the only navigation) + the
 * selected file's code. Model editing happens in a per-app modal opened from
 * the tree's ✎ control or the code header's "Edit models" button. On narrow
 * screens the tree is an off-canvas drawer toggled from the header. */
export function BuilderShell() {
  const project = useProjectStore((s) => s.project);
  const appId = useProjectStore((s) => s.selectedAppId);
  const addApp = useProjectStore((s) => s.addApp);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  const tree = useMemo(() => (project ? projectFileTree(project) : []), [project]);
  const defaultPath = useMemo(() => {
    if (!project) return "";
    const app = project.apps.find((a) => a.id === appId) ?? project.apps[0];
    return app ? `${app.name}/models.py` : `${project.name}/settings.py`;
  }, [project, appId]);

  const [path, setPath] = useState(defaultPath);
  useEffect(() => setPath(defaultPath), [defaultPath]);

  const rendered = useMemo(
    () =>
      project ? (renderNodeByPath(project, path) ?? renderNodeByPath(project, defaultPath)) : null,
    [project, path, defaultPath],
  );

  if (!project) return null;

  const editModels = (appName: string) => {
    const app = project.apps.find((a) => a.name === appName);
    if (app) setEditingAppId(app.id);
  };

  const treeProps = {
    nodes: tree,
    selectedPath: rendered?.path ?? "",
    onEditModels: editModels,
    onAddApp: addApp,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ProjectHeader onToggleTree={() => setDrawerOpen((o) => !o)} />

      <div className="relative flex min-h-0 flex-1">
        {/* Persistent tree on large screens */}
        <div className="hidden w-64 shrink-0 overflow-y-auto border-r border-border p-2 lg:block">
          <FileTree {...treeProps} onSelect={setPath} />
        </div>

        {/* Off-canvas tree drawer on small screens */}
        {drawerOpen ? (
          <div data-testid="tree-drawer" className="absolute inset-0 z-10 flex lg:hidden">
            <div className="w-64 overflow-y-auto bg-bg p-2 shadow-xl">
              <FileTree
                {...treeProps}
                onSelect={(p) => {
                  setPath(p);
                  setDrawerOpen(false);
                }}
                onEditModels={(a) => {
                  editModels(a);
                  setDrawerOpen(false);
                }}
              />
            </div>
            <button
              type="button"
              aria-label="Close file tree"
              className="flex-1 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
          </div>
        ) : null}

        <CodeView rendered={rendered} onEditModels={editModels} />
      </div>

      {editingAppId ? (
        <ModelsModal appId={editingAppId} onClose={() => setEditingAppId(null)} />
      ) : null}
    </div>
  );
}
