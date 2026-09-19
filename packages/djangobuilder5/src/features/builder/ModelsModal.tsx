import { ModelsPanel } from "./ModelsPanel";

/** Centered overlay presentation of the models editor (used below the very-wide
 * breakpoint; above it, BuilderShell docks `ModelsPanel` beside the code). */
export function ModelsModal({ appId, onClose }: { appId: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="my-8 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <ModelsPanel appId={appId} onClose={onClose} />
      </div>
    </div>
  );
}
