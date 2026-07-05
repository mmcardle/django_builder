import { TreePane } from "./TreePane";
import { EditorPane } from "./EditorPane";
import { CodePane } from "./CodePane";

export function BuilderPage() {
  return (
    <div className="flex h-full min-h-0">
      <TreePane />
      <EditorPane />
      <CodePane />
    </div>
  );
}
