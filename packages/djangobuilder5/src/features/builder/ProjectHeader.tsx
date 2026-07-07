import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { downloadProjectTar } from "@/domain/generate";
import { useProjectStore } from "@/store/projectStore";
import { ProjectSettingsDialog } from "./ProjectSettingsDialog";

export function ProjectHeader({ onToggleTree }: { onToggleTree?: () => void }) {
  const project = useProjectStore((s) => s.project);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!project) return null;

  const chips = [
    `Django ${project.djangoVersion}`,
    project.htmx ? "HTMX" : null,
    project.channels ? "Channels" : null,
  ].filter((c): c is string => Boolean(c));

  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-2.5">
      {onToggleTree ? (
        <button
          type="button"
          aria-label="Toggle file tree"
          onClick={onToggleTree}
          className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate font-mono text-sm font-bold text-text">{project.name}</h1>
          {chips.map((c) => (
            <span
              key={c}
              className="shrink-0 rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 text-[10px] text-accent"
            >
              {c}
            </span>
          ))}
        </div>
        <p className="truncate text-xs text-muted">{project.description || "No description"}</p>
      </div>

      <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>
        Settings
      </Button>
      <Button size="sm" onClick={() => downloadProjectTar(project)}>
        Download .tar
      </Button>

      {settingsOpen ? <ProjectSettingsDialog onClose={() => setSettingsOpen(false)} /> : null}
    </header>
  );
}
