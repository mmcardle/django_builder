import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ModelEditor } from "./ModelEditor";
import { ImportModelsDialog } from "./ImportModelsDialog";
import { useProjectStore } from "@/store/projectStore";

/** The per-app models editor content (header · models · footer). Rendered
 * either inside the centered `ModelsModal` overlay (with `onClose` → shows
 * Close/Done) or docked as an always-on side panel beside the code on large
 * screens (no `onClose` → non-closable). */
export function ModelsPanel({ appId, onClose }: { appId: string; onClose?: () => void }) {
  const project = useProjectStore((s) => s.project);
  const addModel = useProjectStore((s) => s.addModel);
  const removeApp = useProjectStore((s) => s.removeApp);
  const app = project?.apps.find((a) => a.id === appId);
  const [confirmDeleteApp, setConfirmDeleteApp] = useState(false);
  const [importing, setImporting] = useState(false);

  // If the app disappears (deleted here or in another tab), close (modal) — the
  // docked panel has no onClose and is re-pointed to another app by its parent.
  useEffect(() => {
    if (!app) onClose?.();
  }, [app, onClose]);

  if (!app) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-3.5">
        <h2 className="text-base font-bold">
          Edit models · <span className="font-mono text-accent">{app.name}</span>
        </h2>
        <div className="ml-auto flex items-center gap-3">
          {!confirmDeleteApp ? (
            <button
              className="text-xs font-semibold text-accent hover:text-accent-hover"
              onClick={() => setImporting(true)}
            >
              Import
            </button>
          ) : null}
          {confirmDeleteApp ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-muted">Delete app {app.name}?</span>
              <button className="text-muted hover:text-text" onClick={() => setConfirmDeleteApp(false)}>
                Cancel
              </button>
              <button
                className="font-semibold text-red-400"
                onClick={() => {
                  removeApp(appId);
                  onClose?.();
                }}
              >
                Delete
              </button>
            </span>
          ) : (
            <button
              className="text-xs text-red-400 hover:text-red-300"
              onClick={() => setConfirmDeleteApp(true)}
            >
              Delete app
            </button>
          )}
          {onClose ? (
            <button aria-label="Close" className="text-lg text-muted hover:text-text" onClick={onClose}>
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {app.models.map((m) => (
          <ModelEditor key={m.id} appId={appId} model={m} />
        ))}
        {app.models.length === 0 ? (
          <p className="text-sm text-muted">No models yet — add the first one.</p>
        ) : null}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent/10"
          onClick={() => addModel(appId, "NewModel")}
        >
          ＋ Add model
        </button>
      </div>

      {onClose ? (
        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-3">
          <Button onClick={onClose}>Done</Button>
        </div>
      ) : null}

      {importing ? <ImportModelsDialog appId={appId} onClose={() => setImporting(false)} /> : null}
    </div>
  );
}
