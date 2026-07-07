import { useEffect, useState } from "react";
import type { DjangoProjectFile } from "@djangobuilder/core";
import { cn } from "@/lib/cn";

/** Folder paths on the branch that leads to `target` (its ancestor folders). */
function folderChain(
  nodes: DjangoProjectFile[],
  target: string,
  acc: string[] = [],
): string[] | null {
  for (const n of nodes) {
    if (n.path === target) return acc;
    if (n.children) {
      const found = folderChain(n.children, target, n.folder ? [...acc, n.path] : acc);
      if (found) return found;
    }
  }
  return null;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-90")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function FileTree({
  nodes,
  selectedPath,
  onSelect,
}: {
  nodes: DjangoProjectFile[];
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(folderChain(nodes, selectedPath) ?? []),
  );

  // Keep the selected file's folder chain open when selection changes. Return
  // the previous Set unchanged when nothing is new so we don't loop on the
  // freshly-rebuilt `nodes` identity each render.
  useEffect(() => {
    const chain = folderChain(nodes, selectedPath);
    if (!chain) return;
    setExpanded((prev) => {
      if (chain.every((p) => prev.has(p))) return prev;
      return new Set([...prev, ...chain]);
    });
  }, [nodes, selectedPath]);

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function renderNodes(list: DjangoProjectFile[], depth: number) {
    return list.map((node) => {
      const pad = { paddingLeft: `${depth * 12 + 8}px` };
      if (node.folder) {
        const open = expanded.has(node.path);
        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() => toggle(node.path)}
              style={pad}
              className="flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm text-text hover:bg-surface-2"
            >
              <Chevron open={open} />
              <span className="truncate font-medium">{node.name}</span>
            </button>
            {open && node.children ? renderNodes(node.children, depth + 1) : null}
          </div>
        );
      }
      const selected = node.path === selectedPath;
      return (
        <button
          key={node.path}
          type="button"
          onClick={() => onSelect(node.path)}
          style={pad}
          aria-current={selected ? "true" : undefined}
          className={cn(
            "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left font-mono text-[13px] transition-colors",
            selected ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface-2 hover:text-text",
          )}
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
          <span className="truncate">{node.name}</span>
        </button>
      );
    });
  }

  return <div className="select-none">{renderNodes(nodes, 0)}</div>;
}
