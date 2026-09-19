import { useMemo, useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { countProjectFiles, generatedFileNames, renderAppPreview } from "@/domain/generate";
import { makeSeedProject } from "@/domain/seed";
import { ProjectForm } from "./ProjectForm";
import { emptyDraft, type ProjectDraft } from "./projectDraft";
import type { LocalProject } from "@/domain/types";

/** The starter app inside the seed project (see `domain/seed.ts`). */
const STARTER_APP_ID = "app_blog";

/** Named outputs worth calling out, each tied to the file that proves it. Only
 * the ones actually present in the generated tree are shown, so the list can't
 * promise something the renderer stopped producing. */
const HIGHLIGHTS: { file: string; label: string }[] = [
  { file: "models.py", label: "Models" },
  { file: "admin.py", label: "Admin" },
  { file: "serializers.py", label: "DRF serializers" },
  { file: "views.py", label: "Views" },
  { file: "urls.py", label: "URLs" },
  { file: "forms.py", label: "Forms" },
  { file: "base.html", label: "Templates" },
  { file: "settings.py", label: "Settings" },
  { file: "wsgi.py", label: "WSGI" },
  { file: "asgi.py", label: "ASGI" },
  { file: "test_views.py", label: "pytest suite" },
  { file: "manage.py", label: "manage.py" },
  { file: "requirements.txt", label: "requirements.txt" },
];

const STEPS = [
  { title: "Name your project", detail: "Django version, HTMX and Channels are just toggles." },
  { title: "Add apps and models", detail: "Fields, relationships and inheritance, in the browser." },
  { title: "Download and run", detail: "migrate, runserver — no scaffolding left to write." },
];

/** The draft applied to the seed project, so the preview reflects the settings
 * being typed. The app and its models stay fixed — they're the worked example. */
function previewProject(draft: ProjectDraft): LocalProject {
  const seed = makeSeedProject();
  return {
    ...seed,
    name: draft.name.trim() || "myproject",
    description: draft.description,
    djangoVersion: draft.version,
    htmx: draft.htmx,
    channels: draft.channels,
  };
}

/**
 * First-run dashboard. A brand-new account has nothing to list, so instead of an
 * empty grid behind a modal this shows the create form beside real generated
 * code — the settings on the left are rendered, live, into the output on the
 * right, which is the one thing the product does that a screenshot can't say.
 */
export function EmptyDashboard() {
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);

  const preview = useMemo(() => {
    const project = previewProject(draft);
    try {
      return {
        files: renderAppPreview(project, STARTER_APP_ID),
        fileCount: countProjectFiles(project),
        generated: generatedFileNames(project),
      };
    } catch {
      // A half-typed setting should never blank the page.
      return { files: [], fileCount: 0, generated: new Set<string>() };
    }
  }, [draft]);

  const highlights = HIGHLIGHTS.filter((h) => preview.generated.has(h.file));
  const projectName = draft.name.trim() || "myproject";

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="animate-rise max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          $ django-admin startproject
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
          Name it. We&apos;ll write the rest.
        </h1>
        <p className="mt-3 text-muted">
          Add apps, models, fields and relationships — Django Builder keeps a complete, runnable
          project in step with them. Download the tar, <code className="font-mono text-text">pip install -r requirements.txt</code>, and it runs.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-x-6 gap-y-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
        <div
          className="animate-rise rounded-xl border border-border bg-surface p-5"
          style={{ animationDelay: "70ms" }}
        >
          <h2 className="mb-3 text-sm font-bold">Your first project</h2>
          <ProjectForm autoFocus submitBlock submitLabel="Create project" onDraftChange={setDraft} />
          <p className="mt-3 text-xs text-muted">
            Every setting here can be changed later.
          </p>
        </div>

        <ol
          className="animate-rise space-y-3 px-1 lg:col-start-1 lg:row-start-2"
          style={{ animationDelay: "200ms" }}
        >
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="mt-0.5 font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{step.title}</span>
                <span className="block text-xs text-muted">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>

        <div
          className="animate-rise min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          style={{ animationDelay: "140ms" }}
        >
          <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-sm font-bold">What comes out</h2>
            <p className="text-xs text-muted">
              a starter <span className="font-mono text-accent">blog</span> app in{" "}
              <span className="font-mono text-accent">{projectName}</span>
              {preview.fileCount > 0 ? (
                <>
                  {" · "}
                  <span className="text-text">{preview.fileCount} files</span> in the download
                </>
              ) : null}
            </p>
          </div>

          {preview.files.length > 0 ? (
            <CodeBlock files={preview.files} className="max-h-[24rem]" />
          ) : null}

          {highlights.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {highlights.map((h) => (
                <li
                  key={h.file}
                  title={h.file}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted"
                >
                  {h.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
