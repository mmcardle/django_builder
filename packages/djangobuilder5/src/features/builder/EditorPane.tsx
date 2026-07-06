import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { fieldTypeNames, relationshipTargets, relationshipTypeNames } from "@/domain/options";
import type { RelationshipTypeName } from "@/domain/types";
import { useProjectStore } from "@/store/projectStore";

function DebouncedInput({
  value,
  onCommit,
  ...props
}: { value: string; onCommit: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // adopt external value when it changes and we're not mid-edit
  useEffect(() => {
    setLocal(value);
  }, [value]);
  return (
    <Input
      {...props}
      value={local}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onCommit(v), 400);
      }}
      onBlur={() => {
        if (timer.current) clearTimeout(timer.current);
        onCommit(local);
      }}
    />
  );
}

export function EditorPane() {
  const project = useProjectStore((s) => s.project);
  const appId = useProjectStore((s) => s.selectedAppId);
  const modelId = useProjectStore((s) => s.selectedModelId);
  const store = useProjectStore();

  const app = project?.apps.find((a) => a.id === appId);
  const model = app?.models.find((m) => m.id === modelId);
  const targets = relationshipTargets(project?.apps ?? []);

  if (!app || !model) {
    return <div className="flex-1 p-8 text-muted">Select a model to edit.</div>;
  }

  return (
    <div className="min-w-0 flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center gap-2">
        <span className="font-mono text-lg font-bold text-accent">{model.name}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted">model</span>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Fields</p>
        <Button size="sm" variant="subtle" onClick={() => store.addField(app.id, model.id)}>
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
              onCommit={(v) => store.updateField(app.id, model.id, field.id, { name: v })}
            />
            <Select
              aria-label={`field ${field.id} type`}
              value={field.type}
              onChange={(e) => store.updateField(app.id, model.id, field.id, { type: e.target.value })}
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
              onCommit={(v) => store.updateField(app.id, model.id, field.id, { args: v })}
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label={`remove field ${field.id}`}
              onClick={() => store.removeField(app.id, model.id, field.id)}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Relationships</p>
        <Button size="sm" variant="subtle" onClick={() => store.addRelationship(app.id, model.id)}>
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
              onCommit={(v) => store.updateRelationship(app.id, model.id, rel.id, { name: v })}
            />
            <Select
              aria-label={`rel ${rel.id} type`}
              value={rel.type}
              onChange={(e) =>
                store.updateRelationship(app.id, model.id, rel.id, {
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
              onChange={(e) => store.updateRelationship(app.id, model.id, rel.id, { to: e.target.value })}
            >
              {targets.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`remove rel ${rel.id}`}
              onClick={() => store.removeRelationship(app.id, model.id, rel.id)}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
