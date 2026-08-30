import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { DocumentData, DocumentReference, UpdateData, WriteBatch } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { toVersionNumber } from "./version";
import type { DjangoVersionNumber } from "./version";
import type { LocalApp, LocalParent } from "@/domain/types";
import type { ParsedModel } from "@/domain/import";
import type { RelationshipRef, Retarget } from "@/domain/relationshipIntegrity";

type Args = Record<string, string | boolean | number>;

/** Firestore hard-caps one WriteBatch at 500 writes; leave headroom. */
const MAX_BATCH_WRITES = 450;

/**
 * Collects writes and commits them in insertion order, opening a fresh batch
 * every `MAX_BATCH_WRITES` so an unbounded run (importing a big `models.py`,
 * cascade-deleting a large project) can't blow Firestore's per-batch limit.
 *
 * Atomicity is per chunk, not across the whole run, so callers must order their
 * writes such that a partial failure is recoverable: create children before the
 * link that reveals them, and delete children before the parent that owns them.
 * A run that fits in one chunk commits exactly once, as before.
 */
class ChunkedBatch {
  private ops: Array<(batch: WriteBatch) => void> = [];

  set(ref: DocumentReference, data: DocumentData): void {
    this.ops.push((batch) => batch.set(ref, data));
  }

  update(ref: DocumentReference, data: UpdateData<DocumentData>): void {
    this.ops.push((batch) => batch.update(ref, data));
  }

  delete(ref: DocumentReference): void {
    this.ops.push((batch) => batch.delete(ref));
  }

  async commit(): Promise<void> {
    for (let i = 0; i < this.ops.length; i += MAX_BATCH_WRITES) {
      const batch = writeBatch(db);
      this.ops.slice(i, i + MAX_BATCH_WRITES).forEach((op) => op(batch));
      await batch.commit();
    }
  }
}

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

/** Rename an app, repointing in the same run every relationship that targeted
 * one of its models — `to` is a denormalised "app.Model" string, so a stale one
 * leaves the project unrenderable. */
export async function renameApp(appId: string, name: string, retargets: Retarget[]): Promise<void> {
  const batch = new ChunkedBatch();
  batch.update(doc(db, "apps", appId), { name });
  retargets.forEach((r) => batch.update(doc(db, "relationships", r.id), { to: r.to }));
  await batch.commit();
}

/** Rename a model, repointing every relationship that targeted it. */
export async function renameModel(modelId: string, name: string, retargets: Retarget[]): Promise<void> {
  const batch = new ChunkedBatch();
  batch.update(doc(db, "models", modelId), { name });
  retargets.forEach((r) => batch.update(doc(db, "relationships", r.id), { to: r.to }));
  await batch.commit();
}
export const setModelParents = (id: string, parents: LocalParent[]) =>
  updateDoc(doc(db, "models", id), { parents });
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

/** Queue the deletion of relationships owned by *other* models that point at
 * whatever is being removed. Left behind, their `to` dangles — and a dangling
 * target is silently dropped from the generated code rather than reported. */
function deleteInbound(batch: ChunkedBatch, inbound: RelationshipRef[]): void {
  inbound.forEach(({ modelId, relId }) => {
    batch.delete(doc(db, "relationships", relId));
    batch.update(doc(db, "models", modelId), { [`relationships.${relId}`]: deleteField() });
  });
}

export async function removeModel(
  appId: string,
  model: { id: string; fields: { id: string }[]; relationships: { id: string }[] },
  inbound: RelationshipRef[] = [],
): Promise<void> {
  const batch = new ChunkedBatch();
  model.fields.forEach((f) => batch.delete(doc(db, "fields", f.id)));
  model.relationships.forEach((r) => batch.delete(doc(db, "relationships", r.id)));
  deleteInbound(batch, inbound);
  batch.delete(doc(db, "models", model.id));
  batch.update(doc(db, "apps", appId), { [`models.${model.id}`]: deleteField() });
  await batch.commit();
}

/** Add parsed (imported) models — each with its fields/relationships — to an
 * app. Imported models come as-authored (no default fields). The app link is
 * written last so a chunk failure mid-import leaves unreferenced docs rather
 * than an app pointing at models that were never created. */
export async function importModels(user: User, appId: string, models: ParsedModel[]): Promise<void> {
  if (models.length === 0) return;
  const batch = new ChunkedBatch();
  const appLink: Record<string, boolean> = {};
  for (const m of models) {
    const modelRef = doc(collection(db, "models"));
    const fieldsMap: Record<string, boolean> = {};
    const relsMap: Record<string, boolean> = {};
    for (const f of m.fields) {
      const fieldRef = doc(collection(db, "fields"));
      fieldsMap[fieldRef.id] = true;
      batch.set(fieldRef, { owner: user.uid, name: f.name, type: f.type, args: f.args });
    }
    for (const r of m.relationships) {
      const relRef = doc(collection(db, "relationships"));
      relsMap[relRef.id] = true;
      batch.set(relRef, { owner: user.uid, name: r.name, type: r.type, to: r.to, args: r.args });
    }
    batch.set(modelRef, {
      owner: user.uid,
      name: m.name,
      abstract: m.abstract,
      parents: [],
      fields: fieldsMap,
      relationships: relsMap,
    });
    appLink[`models.${modelRef.id}`] = true;
  }
  batch.update(doc(db, "apps", appId), appLink);
  await batch.commit();
}

/** Re-parent a model to another app: flip the model's key in the two apps'
 * `models` maps. The model's qualified name changes with its app, so
 * relationships targeting it are repointed in the same run. */
export async function moveModel(
  fromAppId: string,
  toAppId: string,
  modelId: string,
  retargets: Retarget[],
): Promise<void> {
  const batch = new ChunkedBatch();
  batch.update(doc(db, "apps", fromAppId), { [`models.${modelId}`]: deleteField() });
  batch.update(doc(db, "apps", toAppId), { [`models.${modelId}`]: true });
  retargets.forEach((r) => batch.update(doc(db, "relationships", r.id), { to: r.to }));
  await batch.commit();
}

/** Cascade-delete an app: its models (+ their fields/relationships), the app
 * doc, and the app's key in the parent project's `apps` map. Descendants go
 * first so a chunk failure can be recovered by deleting the app again. */
export async function removeApp(
  projectId: string,
  app: { id: string; models: Array<LocalApp["models"][number]> },
  inbound: RelationshipRef[] = [],
): Promise<void> {
  const batch = new ChunkedBatch();
  for (const model of app.models) {
    model.fields.forEach((f) => batch.delete(doc(db, "fields", f.id)));
    model.relationships.forEach((r) => batch.delete(doc(db, "relationships", r.id)));
    batch.delete(doc(db, "models", model.id));
  }
  deleteInbound(batch, inbound);
  batch.delete(doc(db, "apps", app.id));
  batch.update(doc(db, "projects", projectId), { [`apps.${app.id}`]: deleteField() });
  await batch.commit();
}

/** Cascade-delete a project and every descendant. The project doc goes last so
 * a chunk failure leaves the project still listed (with dangling app ids, which
 * `renestProject` filters) and the delete can simply be retried. */
export async function deleteProjectCascade(project: {
  id: string;
  apps: Array<LocalApp>;
}): Promise<void> {
  const batch = new ChunkedBatch();
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

/** Leaves first, so a partial wipe leaves the project listed and re-deletable. */
const OWNED_COLLECTIONS = ["relationships", "fields", "models", "apps", "projects"] as const;

/**
 * Delete every document owned by a user, across all five collections. Used when
 * an anonymous guest signs out: their uid is unrecoverable, so leaving the docs
 * behind would strand them in Firestore forever. Must run while the user is
 * still signed in — the security rules match on `resource.data.owner`.
 */
export async function deleteAllUserData(uid: string): Promise<void> {
  const batch = new ChunkedBatch();
  for (const name of OWNED_COLLECTIONS) {
    const snap = await getDocs(query(collection(db, name), where("owner", "==", uid)));
    snap.docs.forEach((d) => batch.delete(doc(db, name, d.id)));
  }
  await batch.commit();
}
