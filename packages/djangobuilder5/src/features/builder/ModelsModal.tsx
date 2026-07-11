import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ModelEditor } from "./ModelEditor";
import { ImportModelsDialog } from "./ImportModelsDialog";
import { useProjectStore } from "@/store/projectStore";

export function ModelsModal({ appId, onClose }: { appId: string; onClose: () => void }) {
  const project = useProjectStore((s) => s.project);
  const addModel = useProjectStore((s) => s.addModel);
  const removeApp = useProjectStore((s) => s.removeApp);
  const app = project?.apps.find((a) => a.id === appId);
  const [confirmDeleteApp, setConfirmDeleteApp] = useState(false);
  const [importing, setImporting] = useState(false);

  // If the app disappears (deleted here or in another tab), close.
  useEffect(() => {
    if (!app) onClose();
  }, [app, onClose]);

  if (!app) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
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
                    onClose();
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
            <button aria-label="Close" className="text-lg text-muted hover:text-text" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
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

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>

      {importing ? <ImportModelsDialog appId={appId} onClose={() => setImporting(false)} /> : null}
    </div>
  );
}
