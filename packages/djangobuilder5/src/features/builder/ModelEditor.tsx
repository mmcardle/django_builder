import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DebouncedInput } from "@/components/ui/DebouncedInput";
import {
  builtInClass,
  builtInParentTargets,
  fieldTypeNames,
  relationshipTargets,
  relationshipTypeNames,
} from "@/domain/options";
import type { LocalModel, LocalParent, RelationshipTypeName } from "@/domain/types";
import { useProjectStore } from "@/store/projectStore";

export function ModelEditor({ appId, model }: { appId: string; model: LocalModel }) {
  const store = useProjectStore();
  const project = useProjectStore((s) => s.project);
  const targets = relationshipTargets(project?.apps ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const appName = project?.apps.find((a) => a.id === appId)?.name ?? "";
  const self = `${appName}.${model.name}`;
  const userModelTargets = (project?.apps ?? [])
    .flatMap((a) => a.models.map((m) => `${a.name}.${m.name}`))
    .filter((t) => t !== self);
  const parentAddOptions = [...builtInParentTargets, ...userModelTargets];
  const otherApps = (project?.apps ?? []).filter((a) => a.id !== appId);

  function parentLabel(p: LocalParent): string {
    if (p.type === "django") return p.class.split(".").pop() ?? p.class;
    const m = project?.apps.find((a) => a.id === p.app)?.models.find((mm) => mm.id === p.model);
    return m ? m.name : "(deleted)";
  }
  function hasParent(next: LocalParent): boolean {
    return model.parents.some((p) =>
      p.type === "django" && next.type === "django"
        ? p.class === next.class
        : p.type === "user" && next.type === "user"
          ? p.model === next.model
          : false,
    );
  }
  function addParent(target: string) {
    if (!project) return;
    const cls = builtInClass(target);
    let next: LocalParent | null = null;
    if (cls) {
      next = { type: "django", class: cls };
    } else {
      const [aName, mName] = target.split(".");
      const app = project.apps.find((a) => a.name === aName);
      const m = app?.models.find((mm) => mm.name === mName);
      if (app && m) next = { type: "user", app: app.id, model: m.id };
    }
    if (next && !hasParent(next)) store.setModelParents(appId, model.id, [...model.parents, next]);
  }
  function removeParent(idx: number) {
    store.setModelParents(
      appId,
      model.id,
      model.parents.filter((_, i) => i !== idx),
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg/40 p-4">
      <div className="mb-4 flex items-center gap-3">
        <DebouncedInput
          aria-label={`model ${model.id} name`}
          className="w-48 font-mono text-base font-bold text-accent"
          value={model.name}
          onCommit={(v) => v.trim() && store.updateModel(appId, model.id, { name: v.trim() })}
        />
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={model.abstract}
            onChange={(e) => store.updateModel(appId, model.id, { abstract: e.target.checked })}
          />
          abstract
        </label>
        <div className="ml-auto flex items-center gap-2">
          {otherApps.length > 0 && !confirmDelete ? (
            <Select
              aria-label={`move model ${model.id}`}
              value=""
              className="h-7 text-xs"
              onChange={(e) => {
                if (e.target.value) store.moveModel(appId, e.target.value, model.id);
              }}
            >
              <option value="">Move to…</option>
              {otherApps.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          ) : null}
          {confirmDelete ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-muted">Delete {model.name}?</span>
              <button className="text-muted hover:text-text" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="font-semibold text-red-400" onClick={() => store.removeModel(appId, model.id)}>
                Delete
              </button>
            </span>
          ) : (
            <button
              className="text-xs text-red-400 hover:text-red-300"
              onClick={() => setConfirmDelete(true)}
            >
              Delete model
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Inherits from</p>
          <Select
            aria-label={`model ${model.id} add parent`}
            value=""
            className="h-7 text-xs"
            onChange={(e) => {
              if (e.target.value) addParent(e.target.value);
            }}
          >
            <option value="">+ parent…</option>
            {parentAddOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        {model.parents.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {model.parents.map((p, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent"
              >
                {parentLabel(p)}
                <button
                  aria-label={`remove parent ${i}`}
                  className="text-accent/70 hover:text-accent"
                  onClick={() => removeParent(i)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="font-mono text-xs text-muted">models.Model</p>
        )}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Fields</p>
        <Button size="sm" variant="subtle" onClick={() => store.addField(appId, model.id)}>
          + field
        </Button>
      </div>
      <div className="space-y-2">
        {model.fields.map((field) => (
          <div key={field.id} className="flex items-center gap-2">
            <DebouncedInput
              aria-label={`field ${field.id} name`}
              className="w-40 font-mono"
              value={field.name}
              onCommit={(v) => store.updateField(appId, model.id, field.id, { name: v })}
            />
            <Select
              aria-label={`field ${field.id} type`}
              value={field.type}
              onChange={(e) => store.updateField(appId, model.id, field.id, { type: e.target.value })}
            >
              {fieldTypeNames.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <DebouncedInput
              aria-label={`field ${field.id} args`}
              className="flex-1 font-mono"
              placeholder="args (e.g. max_length=200)"
              value={field.args}
              onCommit={(v) => store.updateField(appId, model.id, field.id, { args: v })}
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label={`remove field ${field.id}`}
              onClick={() => store.removeField(appId, model.id, field.id)}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <div className="mb-2 mt-6 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Relationships</p>
        <Button size="sm" variant="subtle" onClick={() => store.addRelationship(appId, model.id)}>
          + relationship
        </Button>
      </div>
      <div className="space-y-2">
        {model.relationships.map((rel) => (
          <div key={rel.id} className="flex items-center gap-2">
            <DebouncedInput
              aria-label={`rel ${rel.id} name`}
              className="w-40 font-mono"
              value={rel.name}
              onCommit={(v) => store.updateRelationship(appId, model.id, rel.id, { name: v })}
            />
            <Select
              aria-label={`rel ${rel.id} type`}
              className="min-w-0 flex-1"
              value={rel.type}
              onChange={(e) =>
                store.updateRelationship(appId, model.id, rel.id, {
                  type: e.target.value as RelationshipTypeName,
                })
              }
            >
              {relationshipTypeNames.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Select
              aria-label={`rel ${rel.id} target`}
              className="min-w-0 flex-1"
              value={rel.to}
              onChange={(e) => store.updateRelationship(appId, model.id, rel.id, { to: e.target.value })}
            >
              {targets.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`remove rel ${rel.id}`}
              onClick={() => store.removeRelationship(appId, model.id, rel.id)}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
