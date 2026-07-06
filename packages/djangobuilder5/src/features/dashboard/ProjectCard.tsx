import { Link } from "react-router-dom";
import { useProjectStore } from "@/store/projectStore";
import { renestProject } from "@/domain/firestore/mapper";
import { renderAppPreview } from "@/domain/generate";
import { highlight } from "@/lib/highlight";
import type { ProjectSummary } from "@/domain/firestore/types";

function thumbnailCode(projectId: string): string {
  const data = useProjectStore.getState().data;
  const project = renestProject(data, projectId);
  const app = project?.apps[0];
  if (!app) return "# empty project";
  const files = renderAppPreview(project!, app.id);
  const models = files.find((f) => f.file === "models.py")?.code ?? "";
  return models.split("\n").slice(0, 6).join("\n");
}

export function ProjectCard({ summary }: { summary: ProjectSummary }) {
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const code = thumbnailCode(summary.id);
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface p-4">
      <Link to={`/project/${summary.id}`} className="absolute inset-0" aria-label={`Open ${summary.name}`} />
      <pre className="mb-3 h-[70px] overflow-hidden rounded-lg border border-border bg-[#090B10] p-2 text-[10px] leading-snug">
        <code className="hljs language-python" dangerouslySetInnerHTML={{ __html: highlight(code, "python") }} />
      </pre>
      <p className="font-bold">{summary.name}</p>
      <p className="mb-3 line-clamp-2 min-h-[32px] text-xs text-muted">{summary.description}</p>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">Django {summary.djangoVersion}</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">{summary.appCount} apps</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">{summary.modelCount} models</span>
      </div>
      <button
        className="relative z-10 mt-3 self-start text-[11px] text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        onClick={() => { if (confirm(`Delete “${summary.name}”? This cannot be undone.`)) void deleteProject(summary.id); }}
      >
        Delete
      </button>
    </div>
  );
}
