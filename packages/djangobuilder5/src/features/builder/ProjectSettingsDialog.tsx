import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useProjectStore } from "@/store/projectStore";
import type { DjangoVersionNumber } from "@/domain/firestore/version";

export function ProjectSettingsDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const project = useProjectStore((s) => s.project);
  const setProjectName = useProjectStore((s) => s.setProjectName);
  const setDescription = useProjectStore((s) => s.setDescription);
  const setDjangoVersion = useProjectStore((s) => s.setDjangoVersion);
  const setFlag = useProjectStore((s) => s.setFlag);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDesc] = useState(project?.description ?? "");
  const [version, setVersion] = useState<DjangoVersionNumber>(project?.djangoVersion ?? 5);
  const [htmx, setHtmx] = useState(project?.htmx ?? false);
  const [channels, setChannels] = useState(project?.channels ?? false);
  const [confirming, setConfirming] = useState(false);

  if (!project) return null;

  function save(e: FormEvent) {
    e.preventDefault();
    if (!project) return;
    const trimmed = name.trim();
    if (trimmed && trimmed !== project.name) setProjectName(trimmed);
    if (description !== project.description) setDescription(description);
    if (version !== project.djangoVersion) setDjangoVersion(version);
    if (htmx !== project.htmx) setFlag("htmx", htmx);
    if (channels !== project.channels) setFlag("channels", channels);
    onClose();
  }

  async function remove() {
    if (!project) return;
    await deleteProject(project.id);
    navigate("/projects");
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
        className="w-full max-w-md space-y-3 rounded-xl border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-bold">Project settings</h2>
        <Input
          required
          placeholder="Project name"
          aria-label="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Description"
          aria-label="Description"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
        />
        <Select
          aria-label="Django version"
          value={version}
          onChange={(e) => setVersion(Number(e.target.value) as DjangoVersionNumber)}
        >
          <option value={5}>Django 5</option>
          <option value={4}>Django 4</option>
          <option value={3}>Django 3</option>
        </Select>
        <div className="flex gap-4 text-sm text-muted">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={htmx} onChange={(e) => setHtmx(e.target.checked)} /> HTMX
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={channels} onChange={(e) => setChannels(e.target.checked)} /> Channels
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          {confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Delete this project?</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-red-500 text-white hover:bg-red-600 shadow-none"
                onClick={remove}
              >
                Delete
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="text-sm text-red-400 hover:text-red-300"
              onClick={() => setConfirming(true)}
            >
              Delete project
            </button>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
