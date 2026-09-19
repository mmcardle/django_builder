import { useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { MAX_PROJECTS } from "@/domain/constants";
import { ProjectCard } from "./ProjectCard";
import { NewProjectDialog } from "./NewProjectDialog";
import { EmptyDashboard } from "./EmptyDashboard";

export function DashboardView() {
  const summaries = useProjectStore((s) => s.summaries);
  const dataLoaded = useProjectStore((s) => s.dataLoaded);
  const [showNew, setShowNew] = useState(false);
  const atLimit = summaries.length >= MAX_PROJECTS;

  if (!dataLoaded) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-muted">Loading…</p>
      </section>
    );
  }

  // Nothing to list yet: show the first-run panel rather than an empty grid
  // and a modal. It carries its own create form, so no dialog is involved.
  if (summaries.length === 0) return <EmptyDashboard />;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Your projects</h1>
          <p className="text-sm text-muted">{summaries.length} of {MAX_PROJECTS}</p>
        </div>
        <button
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50"
          disabled={atLimit}
          title={atLimit ? `Limit is ${MAX_PROJECTS} projects` : undefined}
          onClick={() => setShowNew(true)}
        >
          + New project
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((s) => <ProjectCard key={s.id} summary={s} />)}
        {!atLimit && (
          <button onClick={() => setShowNew(true)} className="flex min-h-[150px] items-center justify-center rounded-xl border border-dashed border-accent/40 bg-accent/5 text-sm font-semibold text-accent">
            + New project
          </button>
        )}
      </div>

      {showNew && !atLimit && <NewProjectDialog onClose={() => setShowNew(false)} />}
    </section>
  );
}
