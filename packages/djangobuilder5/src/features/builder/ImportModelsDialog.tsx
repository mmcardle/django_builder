import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { parseModelsPy, type ParseResult } from "@/domain/import";
import { useProjectStore } from "@/store/projectStore";

export function ImportModelsDialog({ appId, onClose }: { appId: string; onClose: () => void }) {
  const importModels = useProjectStore((s) => s.importModels);
  const [text, setText] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function parse() {
    const r = parseModelsPy(text);
    setResult(r);
    setSelected(new Set(r.models.map((_, i) => i)));
  }
  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }
  function add() {
    if (!result) return;
    const models = result.models.filter((_, i) => selected.has(i));
    if (models.length) importModels(appId, models);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 p-6"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-base font-bold">
            Import from <span className="font-mono text-accent">models.py</span>
          </h2>
          <button aria-label="Close" className="ml-auto text-lg text-muted hover:text-text" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="space-y-3 p-5">
          <textarea
            aria-label="models.py"
            className="h-40 w-full rounded-lg border border-border bg-bg p-3 font-mono text-xs text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            placeholder="Paste your models.py here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button variant="subtle" size="sm" onClick={parse} disabled={!text.trim()}>
              Parse
            </Button>
          </div>

          {result ? (
            <div className="space-y-2">
              {result.models.length === 0 ? (
                <p className="text-sm text-muted">No models found.</p>
              ) : (
                result.models.map((m, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border bg-bg/40 px-3 py-2 text-sm"
                  >
                    <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} />
                    <span className="font-mono font-semibold text-accent">{m.name}</span>
                    <span className="text-xs text-muted">
                      {m.fields.length} fields · {m.relationships.length} rels
                      {m.abstract ? " · abstract" : ""}
                    </span>
                  </label>
                ))
              )}
              {result.errors.length > 0 ? (
                <ul className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={add} disabled={!result || selected.size === 0}>
            Add selected{selected.size ? ` (${selected.size})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
