import { useState } from "react";
import { cn } from "@/lib/cn";
import { ProjectHeader } from "./ProjectHeader";
import { TreePane } from "./TreePane";
import { EditorPane } from "./EditorPane";
import { CodePane } from "./CodePane";

type MobileTab = "edit" | "code";

/** Builder layout. `lg+`: Tree | Editor | Code side by side. Below `lg`: the
 * Tree is an off-canvas drawer and Editor/Code become a two-tab switcher. */
export function BuilderShell() {
  const [tab, setTab] = useState<MobileTab>("edit");
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ProjectHeader onToggleTree={() => setDrawerOpen((o) => !o)} />

      <div className="relative flex min-h-0 flex-1">
        {/* Persistent tree on large screens */}
        <div className="hidden lg:block">
          <TreePane />
        </div>

        {/* Off-canvas tree drawer on small screens */}
        {drawerOpen ? (
          <div data-testid="tree-drawer" className="absolute inset-0 z-10 flex lg:hidden">
            <div className="overflow-y-auto bg-bg shadow-xl">
              <TreePane
                onNavigate={() => {
                  setDrawerOpen(false);
                  setTab("edit");
                }}
              />
            </div>
            <button
              type="button"
              aria-label="Close file tree"
              className="flex-1 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
          </div>
        ) : null}

        {/* Editor + Code */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile tab bar */}
          <div role="tablist" className="flex shrink-0 border-b border-border lg:hidden">
            {(["edit", "code"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium capitalize transition-colors",
                  tab === t ? "border-b-2 border-accent text-accent" : "text-muted hover:text-text",
                )}
              >
                {t === "edit" ? "Edit" : "Code"}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1">
            <div
              data-testid="editor-pane"
              className={cn("min-w-0 flex-1", tab !== "edit" && "hidden", "lg:flex")}
            >
              <EditorPane />
            </div>
            <div
              data-testid="code-pane"
              className={cn(
                "min-w-0 flex-1 border-l border-border",
                tab !== "code" && "hidden",
                "lg:flex",
              )}
            >
              <CodePane />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
