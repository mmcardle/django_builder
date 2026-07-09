import {
  addDoc,
  collection,
  deleteField,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { toVersionNumber } from "./version";
import type { DjangoVersionNumber } from "./version";
import type { LocalApp } from "@/domain/types";

type Args = Record<string, string | boolean | number>;

export async function createProject(
  user: User,
  name: string,
  description: string,
  djangoVersion: DjangoVersionNumber,
  htmx: boolean,
  channels: boolean,
): Promise<string> {
  const ref = await addDoc(collection(db, "projects"), {
    owner: user.uid,
    name,
    description,
    django_version: toVersionNumber(djangoVersion),
    htmx,
    channels,
    apps: {},
  });
  return ref.id;
}

export async function addApp(user: User, projectId: string, name: string): Promise<string> {
  const ref = await addDoc(collection(db, "apps"), { owner: user.uid, name, models: {} });
  await updateDoc(doc(db, "projects", projectId), { [`apps.${ref.id}`]: true });
  return ref.id;
}

/** Create a model plus the two default DateTimeField fields (created/last_updated). */
/** Create a model + its two default DateTimeField fields atomically in one batch. */
export async function addModel(user: User, appId: string, name: string): Promise<string> {
  const batch = writeBatch(db);
  const modelRef = doc(collection(db, "models"));
  const defaults = [
    { name: "created", args: "auto_now_add=True, editable=False" },
    { name: "last_updated", args: "auto_now=True, editable=False" },
  ];
  const fieldsMap: Record<string, boolean> = {};
  const fieldOps: { ref: ReturnType<typeof doc>; data: object }[] = [];
  for (const d of defaults) {
    const fieldRef = doc(collection(db, "fields"));
    fieldsMap[fieldRef.id] = true;
    fieldOps.push({ ref: fieldRef, data: { owner: user.uid, name: d.name, type: "DateTimeField", args: d.args } });
  }
  batch.set(modelRef, { owner: user.uid, name, abstract: false, parents: [], fields: fieldsMap, relationships: {} });
  batch.update(doc(db, "apps", appId), { [`models.${modelRef.id}`]: true });
  fieldOps.forEach((op) => batch.set(op.ref, op.data));
  await batch.commit();
  return modelRef.id;
}

export async function addField(
  user: User,
  modelId: string,
  name: string,
  type: string,
  args: string,
): Promise<string> {
  const ref = await addDoc(collection(db, "fields"), { owner: user.uid, name, type, args });
  await updateDoc(doc(db, "models", modelId), { [`fields.${ref.id}`]: true });
  return ref.id;
}

export async function addRelationship(
  user: User,
  modelId: string,
  name: string,
  type: string,
  to: string,
  args: string,
): Promise<string> {
  const ref = await addDoc(collection(db, "relationships"), { owner: user.uid, name, type, to, args });
  await updateDoc(doc(db, "models", modelId), { [`relationships.${ref.id}`]: true });
  return ref.id;
}

export const updateProject = (id: string, args: Args) => updateDoc(doc(db, "projects", id), args);
export const updateModel = (id: string, args: Args) => updateDoc(doc(db, "models", id), args);
export const updateField = (id: string, args: Args) => updateDoc(doc(db, "fields", id), args);
export const updateRelationship = (id: string, args: Args) => updateDoc(doc(db, "relationships", id), args);

export async function removeField(modelId: string, fieldId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "fields", fieldId));
  batch.update(doc(db, "models", modelId), { [`fields.${fieldId}`]: deleteField() });
  await batch.commit();
}

export async function removeRelationship(modelId: string, relId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "relationships", relId));
  batch.update(doc(db, "models", modelId), { [`relationships.${relId}`]: deleteField() });
  await batch.commit();
}

export async function removeModel(appId: string, model: { id: string; fields: { id: string }[]; relationships: { id: string }[] }): Promise<void> {
  const batch = writeBatch(db);
  model.fields.forEach((f) => batch.delete(doc(db, "fields", f.id)));
  model.relationships.forEach((r) => batch.delete(doc(db, "relationships", r.id)));
  batch.delete(doc(db, "models", model.id));
  batch.update(doc(db, "apps", appId), { [`models.${model.id}`]: deleteField() });
  await batch.commit();
}

/** Cascade-delete an app: its models (+ their fields/relationships), the app
 * doc, and the app's key in the parent project's `apps` map — one batch. */
export async function removeApp(
  projectId: string,
  app: { id: string; models: Array<LocalApp["models"][number]> },
): Promise<void> {
  const batch = writeBatch(db);
  for (const model of app.models) {
    model.fields.forEach((f) => batch.delete(doc(db, "fields", f.id)));
    model.relationships.forEach((r) => batch.delete(doc(db, "relationships", r.id)));
    batch.delete(doc(db, "models", model.id));
  }
  batch.delete(doc(db, "apps", app.id));
  batch.update(doc(db, "projects", projectId), { [`apps.${app.id}`]: deleteField() });
  await batch.commit();
}

/** Cascade-delete a project and every descendant (uses the correct `relationships`). */
export async function deleteProjectCascade(project: {
  id: string;
  apps: Array<LocalApp>;
}): Promise<void> {
  const batch = writeBatch(db);
  for (const app of project.apps) {
    for (const model of app.models) {
      model.fields.forEach((f) => batch.delete(doc(db, "fields", f.id)));
      model.relationships.forEach((r) => batch.delete(doc(db, "relationships", r.id)));
      batch.delete(doc(db, "models", model.id));
    }
    batch.delete(doc(db, "apps", app.id));
  }
  batch.delete(doc(db, "projects", project.id));
  await batch.commit();
}
