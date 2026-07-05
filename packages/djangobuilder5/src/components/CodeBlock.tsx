import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { highlight, langForFile } from "@/lib/highlight";

export interface CodeFile {
  file: string;
  code: string;
}

export function CodeBlock({ files, className }: { files: CodeFile[]; className?: string }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = files[active] ?? { file: "", code: "" };

  // Reset selection if the file list shrinks (e.g. app switch).
  useEffect(() => {
    if (active > files.length - 1) setActive(0);
  }, [files.length, active]);

  async function copy() {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. non-secure origin) — fail silently.
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-surface",
        className,
      )}
    >
      <div
        role="tablist"
        className="flex items-center gap-1 border-b border-border bg-surface-2 px-2 py-1.5"
      >
        {files.map((f, i) => (
          <button
            key={f.file}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              "rounded-md px-2.5 py-1 font-mono text-xs text-muted transition-colors",
              i === active && "bg-surface text-accent",
            )}
          >
            {f.file}
          </button>
        ))}
        <button
          onClick={copy}
          className="ml-auto rounded-md px-2.5 py-1 text-xs font-semibold text-accent hover:bg-surface"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-auto p-4 text-[13px] leading-relaxed">
        <code
          className={cn("hljs", `language-${langForFile(current.file)}`)}
          dangerouslySetInnerHTML={{ __html: highlight(current.code, langForFile(current.file)) }}
        />
      </pre>
    </div>
  );
}
