import { Button } from "@/components/ui/Button";
import { CodeBlock } from "@/components/CodeBlock";
import { downloadProjectTar, renderAppPreview } from "@/domain/generate";
import { useProjectStore } from "@/store/projectStore";

export function CodePane() {
  const project = useProjectStore((s) => s.project);
  const appId = useProjectStore((s) => s.selectedAppId);
  const files = appId ? renderAppPreview(project, appId) : [];

  return (
    <aside className="flex min-w-[360px] flex-1 flex-col border-l border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Generated
        </span>
        <Button size="sm" onClick={() => downloadProjectTar(project)}>
          Download .tar
        </Button>
      </div>
      <div className="min-h-0 flex-1 p-3">
        {files.length ? (
          <CodeBlock files={files} className="h-full" />
        ) : (
          <p className="text-sm text-muted">Select an app to preview generated code.</p>
        )}
      </div>
    </aside>
  );
}
