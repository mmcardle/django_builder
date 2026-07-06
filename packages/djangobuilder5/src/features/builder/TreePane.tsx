import { useState } from "react";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";
import { useProjectStore } from "@/store/projectStore";

export function TreePane() {
  const project = useProjectStore((s) => s.project);
  const selectedModelId = useProjectStore((s) => s.selectedModelId);
  const select = useProjectStore((s) => s.select);
  const addModel = useProjectStore((s) => s.addModel);
  const addApp = useProjectStore((s) => s.addApp);
  const [newModel, setNewModel] = useState<Record<string, string>>({});

  if (!project) return null;

  return (
    <aside className="w-56 shrink-0 overflow-y-auto border-r border-border p-3">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {project.name} Project
      </p>
      {project.apps.map((app) => (
        <div key={app.id} className="mb-3">
          <div className="flex items-center gap-2 px-1 py-1 text-sm font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--code-type)]" />
            {app.name}
          </div>
          <ul>
            {app.models.map((model) => (
              <li key={model.id}>
                <button
                  onClick={() => select(app.id, model.id)}
                  className={cn(
                    "ml-3 flex w-[calc(100%-0.75rem)] items-center rounded-md px-2 py-1 text-left text-sm text-muted hover:text-text",
                    model.id === selectedModelId && "bg-accent/15 text-accent",
                  )}
                >
                  {model.name}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="ml-3 mt-1"
            onSubmit={(e) => {
              e.preventDefault();
              const name = (newModel[app.id] ?? "").trim();
              if (name) {
                addModel(app.id, name);
                setNewModel((s) => ({ ...s, [app.id]: "" }));
              }
            }}
          >
            <Input
              aria-label={`Add model to ${app.name}`}
              placeholder="+ add model"
              value={newModel[app.id] ?? ""}
              onChange={(e) => setNewModel((s) => ({ ...s, [app.id]: e.target.value }))}
            />
          </form>
        </div>
      ))}
      <button
        onClick={() => addApp(`app${project.apps.length + 1}`)}
        className="mt-2 w-full rounded-md border border-dashed border-accent/40 bg-accent/5 px-2 py-1.5 text-xs text-accent"
      >
        + add app
      </button>
    </aside>
  );
}
