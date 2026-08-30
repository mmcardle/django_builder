import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DebouncedInput } from "@/components/ui/DebouncedInput";
import { ModelEditor } from "./ModelEditor";
import { ImportModelsDialog } from "./ImportModelsDialog";
import { inboundForAppDelete } from "@/domain/relationshipIntegrity";
import { nameError } from "@/domain/validate";
import { MAX_MODELS_PER_APP } from "@/domain/constants";
import { useProjectStore } from "@/store/projectStore";

/** The per-app models editor content (header · models · footer). Rendered
 * either inside the centered `ModelsModal` overlay (with `onClose` → shows
 * Close/Done) or docked as an always-on side panel beside the code on large
 * screens (no `onClose` → non-closable). */
export function ModelsPanel({ appId, onClose }: { appId: string; onClose?: () => void }) {
  const project = useProjectStore((s) => s.project);
  const addModel = useProjectStore((s) => s.addModel);
  const renameApp = useProjectStore((s) => s.renameApp);
  const removeApp = useProjectStore((s) => s.removeApp);
  const app = project?.apps.find((a) => a.id === appId);
  const [confirmDeleteApp, setConfirmDeleteApp] = useState(false);
  const [importing, setImporting] = useState(false);
  // Relationships in other apps aimed at this app's models; they go with it.
  const inboundCount = project ? inboundForAppDelete(project, appId).length : 0;
  const atModelLimit = (app?.models.length ?? 0) >= MAX_MODELS_PER_APP;

  // If the app disappears (deleted here or in another tab), close (modal) — the
  // docked panel has no onClose and is re-pointed to another app by its parent.
  useEffect(() => {
    if (!app) onClose?.();
  }, [app, onClose]);

  if (!app) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-3.5">
        <h2 className="flex min-w-0 items-center gap-2 text-base font-bold">
          <span className="shrink-0">Edit models ·</span>
          <DebouncedInput
            aria-label="App name"
            className="h-8 w-40 font-mono text-sm font-bold text-accent"
            value={app.name}
            validate={(v) => nameError(v, "App name")}
            onCommit={(v) => v.trim() !== app.name && renameApp(appId, v.trim())}
          />
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
              <span className="text-muted">
                Delete app {app.name}?
                {inboundCount > 0 ? (
                  <span className="text-amber-400">
                    {" "}
                    Also removes {inboundCount} relationship{inboundCount === 1 ? "" : "s"} in other
                    apps pointing at its models.
                  </span>
                ) : null}
              </span>
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={atModelLimit}
          title={atModelLimit ? `Limit is ${MAX_MODELS_PER_APP} models per app` : undefined}
          onClick={() => addModel(appId, "NewModel")}
        >
          ＋ Add model
        </button>
        {atModelLimit ? (
          <p className="text-center text-xs text-muted">
            {app.name} is at the {MAX_MODELS_PER_APP}-model limit.
          </p>
        ) : null}
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
