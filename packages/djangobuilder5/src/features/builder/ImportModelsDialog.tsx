import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { parseModelsPy, type ParseResult, type ParsedModel } from "@/domain/import";
import { MAX_MODELS_PER_APP } from "@/domain/constants";
import { useProjectStore } from "@/store/projectStore";

/** A parsed model plus the app the user wants it in (defaults to the app the
 * dialog was opened from, but each row can be routed elsewhere). */
interface Row {
  model: ParsedModel;
  appId: string;
  selected: boolean;
}

export function ImportModelsDialog({ appId, onClose }: { appId: string; onClose: () => void }) {
  const project = useProjectStore((s) => s.project);
  const importModels = useProjectStore((s) => s.importModels);
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const apps = project?.apps ?? [];

  function parse(source = text) {
    const r = parseModelsPy(source);
    setResult(r);
    setRows(r.models.map((model) => ({ model, appId, selected: true })));
  }

  /** Read one or more `models.py` files into the textarea and parse them.
   * Concatenated so classes split across files are imported in one go.
   * FileReader rather than `File.text()` — the latter isn't universally
   * available, and this matches how the production `.io` app reads uploads. */
  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const contents = await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
          }),
      ),
    );
    const joined = contents.join("\n\n");
    setText(joined);
    parse(joined);
  }

  function toggle(i: number) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, selected: !r.selected } : r)));
  }
  function route(i: number, nextAppId: string) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, appId: nextAppId } : r)));
  }

  const chosen = rows.filter((r) => r.selected);

  /** Apps that would exceed the per-app cap once this import lands. */
  const overCap = apps
    .map((a) => ({
      name: a.name,
      total: a.models.length + chosen.filter((r) => r.appId === a.id).length,
    }))
    .filter((a) => a.total > MAX_MODELS_PER_APP);

  function add() {
    if (!chosen.length || overCap.length) return;
    // One write per target app; each is internally chunked by ChunkedBatch.
    for (const app of apps) {
      const models = chosen.filter((r) => r.appId === app.id).map((r) => r.model);
      if (models.length) importModels(app.id, models);
    }
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
          <div className="flex items-center justify-between gap-2">
            <input
              ref={fileInput}
              type="file"
              accept=".py,text/x-python"
              multiple
              aria-label="Upload models.py files"
              className="hidden"
              onChange={(e) => {
                void onFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
              Upload .py files…
            </Button>
            <Button variant="subtle" size="sm" onClick={() => parse()} disabled={!text.trim()}>
              Parse
            </Button>
          </div>

          {result ? (
            <div className="space-y-2">
              {rows.length === 0 ? (
                <p className="text-sm text-muted">No models found.</p>
              ) : (
                rows.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border bg-bg/40 px-3 py-2 text-sm"
                  >
                    <label className="flex min-w-0 flex-1 items-center gap-2">
                      <input type="checkbox" checked={row.selected} onChange={() => toggle(i)} />
                      <span className="font-mono font-semibold text-accent">{row.model.name}</span>
                      <span className="truncate text-xs text-muted">
                        {row.model.fields.length} fields · {row.model.relationships.length} rels
                        {row.model.abstract ? " · abstract" : ""}
                      </span>
                    </label>
                    <Select
                      aria-label={`target app for ${row.model.name}`}
                      className="h-7 w-32 shrink-0 text-xs"
                      value={row.appId}
                      onChange={(e) => route(i, e.target.value)}
                    >
                      {apps.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </Select>
                  </div>
                ))
              )}
              {result.errors.length > 0 ? (
                <ul className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              ) : null}
              {overCap.length > 0 ? (
                <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                  {overCap.map((a) => `${a.name} would have ${a.total} models`).join("; ")} — the
                  limit is {MAX_MODELS_PER_APP} per app. Deselect some, or route them to another app.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={add} disabled={chosen.length === 0 || overCap.length > 0}>
            Add selected{chosen.length ? ` (${chosen.length})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
