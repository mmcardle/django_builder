import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DebouncedInput } from "@/components/ui/DebouncedInput";
import { fieldTypeNames, relationshipTargets, relationshipTypeNames } from "@/domain/options";
import type { LocalModel, RelationshipTypeName } from "@/domain/types";
import { useProjectStore } from "@/store/projectStore";

export function ModelEditor({ appId, model }: { appId: string; model: LocalModel }) {
  const store = useProjectStore();
  const project = useProjectStore((s) => s.project);
  const targets = relationshipTargets(project?.apps ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        <div className="ml-auto">
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
