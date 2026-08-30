import { Button } from "@/components/ui/Button";
import { ProjectForm } from "./ProjectForm";

/** Modal create-project flow, used once a user already has a project. The
 * first-run path uses the inline `EmptyDashboard` panel instead. */
export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-xl border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-bold">New project</h2>
        <ProjectForm
          autoFocus
          footer={
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        />
      </div>
    </div>
  );
}
