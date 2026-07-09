import { useState } from "react";
import { cn } from "@/lib/cn";
import { highlight } from "@/lib/highlight";
import type { RenderedFile } from "@/domain/generate";

/** Read-only view of one generated file. `models.py` also gets an "Edit models"
 * button that opens the per-app models modal. */
export function CodeView({
  rendered,
  onEditModels,
}: {
  rendered: RenderedFile | null;
  onEditModels: (appName: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!navigator.clipboard || !rendered) return;
    try {
      await navigator.clipboard.writeText(rendered.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. non-secure origin) — fail silently.
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col p-3">
      {rendered ? (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-3 py-1.5">
            <span className="truncate font-mono text-xs text-accent">{rendered.path}</span>
            <div className="ml-auto flex items-center gap-1">
              {rendered.name === "models.py" ? (
                <button
                  className="rounded-md px-2.5 py-1 text-xs font-semibold text-accent hover:bg-surface"
                  onClick={() => onEditModels(rendered.path.split("/")[0])}
                >
                  ✎ Edit models
                </button>
              ) : null}
              <button
                className="rounded-md px-2.5 py-1 text-xs font-semibold text-accent hover:bg-surface"
                onClick={copy}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
          <pre className="overflow-auto p-4 text-[13px] leading-relaxed">
            <code
              className={cn("hljs", `language-${rendered.lang}`)}
              dangerouslySetInnerHTML={{ __html: highlight(rendered.code, rendered.lang) }}
            />
          </pre>
        </div>
      ) : (
        <p className="text-sm text-muted">Select a file to preview.</p>
      )}
    </div>
  );
}
