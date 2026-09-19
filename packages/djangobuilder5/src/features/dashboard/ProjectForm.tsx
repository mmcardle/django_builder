import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useProjectStore } from "@/store/projectStore";
import type { DjangoVersionNumber } from "@/domain/firestore/version";
import { nameError } from "@/domain/validate";
import { cn } from "@/lib/cn";
import { emptyDraft, type ProjectDraft } from "./projectDraft";

/**
 * The create-a-project fields, shared by the modal (`NewProjectDialog`) and the
 * inline first-run panel (`EmptyDashboard`) so the two can't drift apart.
 * Owns its own draft state; `onDraftChange` lets a caller mirror it into a live
 * preview of the code the settings would generate.
 */
export function ProjectForm({
  submitLabel = "Create project",
  autoFocus = false,
  submitBlock = false,
  footer,
  onDraftChange,
}: {
  submitLabel?: string;
  autoFocus?: boolean;
  /** Full-width submit, for the first-run panel where it is the page's CTA. */
  submitBlock?: boolean;
  footer?: ReactNode;
  onDraftChange?: (draft: ProjectDraft) => void;
}) {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<ProjectDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    onDraftChange?.(next);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err = nameError(draft.name, "Project name");
    setError(err);
    if (err) return;
    setBusy(true);
    const id = await createProject(
      draft.name.trim(),
      draft.description.trim(),
      draft.version,
      draft.htmx,
      draft.channels,
    );
    setBusy(false);
    if (id) navigate(`/project/${id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Input
          required
          autoFocus={autoFocus}
          placeholder="Project name"
          aria-label="Project name"
          value={draft.name}
          aria-invalid={error ? true : undefined}
          className={error ? "border-red-500 focus-visible:ring-red-500/40" : undefined}
          onChange={(e) => {
            update({ name: e.target.value });
            if (error) setError(null);
          }}
        />
        {error ? (
          <p role="alert" className="mt-1 text-xs text-red-400">
            {error}
          </p>
        ) : null}
      </div>

      <Input
        placeholder="Description"
        aria-label="Description"
        value={draft.description}
        onChange={(e) => update({ description: e.target.value })}
      />

      <Select
        aria-label="Django version"
        value={draft.version}
        onChange={(e) => update({ version: Number(e.target.value) as DjangoVersionNumber })}
      >
        <option value={6}>Django 6</option>
        <option value={5}>Django 5</option>
        <option value={4}>Django 4</option>
        <option value={3}>Django 3</option>
      </Select>

      <div className="flex gap-4 text-sm text-muted">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.htmx}
            onChange={(e) => update({ htmx: e.target.checked })}
          />{" "}
          HTMX
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.channels}
            onChange={(e) => update({ channels: e.target.checked })}
          />{" "}
          Channels
        </label>
      </div>

      <div className={cn("flex gap-2", submitBlock ? "pt-1" : "justify-end")}>
        {footer}
        <Button type="submit" disabled={busy} className={submitBlock ? "w-full" : undefined}>
          {busy ? "Creating…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
