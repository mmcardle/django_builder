import { useState } from "react";
import { cn } from "@/lib/cn";
import { ProjectHeader } from "./ProjectHeader";
import { TreePane } from "./TreePane";
import { EditorPane } from "./EditorPane";
import { CodePane } from "./CodePane";

type MainTab = "design" | "code";

/** Builder layout (Option A — tabbed workspace). A persistent models tree on
 * the left (an off-canvas drawer below `lg`), and a main area that tabs between
 * Design (the model editor) and Code (the file tree + generated code). Only one
 * content pane shows at a time, at every width, so nothing gets cramped. */
export function BuilderShell() {
  const [tab, setTab] = useState<MainTab>("design");
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ProjectHeader onToggleTree={() => setDrawerOpen((o) => !o)} />

      <div className="relative flex min-h-0 flex-1">
        {/* Persistent models tree on large screens */}
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
                  setTab("design");
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

        {/* Main area: Design / Code tab switcher */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div role="tablist" className="flex shrink-0 border-b border-border">
            {(["design", "code"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-5 py-2 text-sm font-medium transition-colors",
                  tab === t ? "border-b-2 border-accent text-accent" : "text-muted hover:text-text",
                )}
              >
                {t === "design" ? "Design" : "Code"}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1">
            <div
              data-testid="editor-pane"
              className={cn("flex min-w-0 flex-1", tab !== "design" && "hidden")}
            >
              <EditorPane />
            </div>
            <div
              data-testid="code-pane"
              className={cn("flex min-w-0 flex-1", tab !== "code" && "hidden")}
            >
              <CodePane />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
