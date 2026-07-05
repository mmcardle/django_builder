import { beforeEach, expect, test } from "vitest";
import { useProjectStore } from "./projectStore";
import { makeSeedProject } from "@/domain/seed";

beforeEach(() => {
  localStorage.clear();
  useProjectStore.setState({ project: makeSeedProject(), selectedAppId: "app_blog", selectedModelId: "model_post" });
});

test("addModel appends a model to the app and selects it", () => {
  const { addModel } = useProjectStore.getState();
  addModel("app_blog", "Tag");
  const app = useProjectStore.getState().project.apps.find((a) => a.id === "app_blog")!;
  expect(app.models.map((m) => m.name)).toContain("Tag");
  expect(useProjectStore.getState().selectedModelId).toBe(
    app.models.find((m) => m.name === "Tag")!.id,
  );
});

test("addField then updateField mutates the target field", () => {
  const s = useProjectStore.getState();
  s.addField("app_blog", "model_post");
  const post = () => useProjectStore.getState().project.apps[0].models[0];
  const newField = post().fields.at(-1)!;
  s.updateField("app_blog", "model_post", newField.id, { name: "slug", type: "SlugField" });
  const updated = post().fields.find((f) => f.id === newField.id)!;
  expect(updated.name).toBe("slug");
  expect(updated.type).toBe("SlugField");
});

test("removeField deletes the field", () => {
  useProjectStore.getState().removeField("app_blog", "model_post", "f_body");
  const post = useProjectStore.getState().project.apps[0].models[0];
  expect(post.fields.find((f) => f.id === "f_body")).toBeUndefined();
});
