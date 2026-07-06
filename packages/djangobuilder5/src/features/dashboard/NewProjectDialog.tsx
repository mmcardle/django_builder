import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useProjectStore } from "@/store/projectStore";
import type { DjangoVersionNumber } from "@/domain/firestore/version";

export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState<DjangoVersionNumber>(5);
  const [htmx, setHtmx] = useState(true);
  const [channels, setChannels] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const id = await createProject(name.trim(), description.trim(), version, htmx, channels);
    setBusy(false);
    if (id) navigate(`/project/${id}`);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-bold">New project</h2>
        <Input required placeholder="Project name" aria-label="Project name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Description" aria-label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Select aria-label="Django version" value={version} onChange={(e) => setVersion(Number(e.target.value) as DjangoVersionNumber)}>
          <option value={5}>Django 5</option><option value={4}>Django 4</option><option value={3}>Django 3</option>
        </Select>
        <div className="flex gap-4 text-sm text-muted">
          <label className="flex items-center gap-2"><input type="checkbox" checked={htmx} onChange={(e) => setHtmx(e.target.checked)} /> HTMX</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={channels} onChange={(e) => setChannels(e.target.checked)} /> Channels</label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create project"}</Button>
        </div>
      </form>
    </div>
  );
}
