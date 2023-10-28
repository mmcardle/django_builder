import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type {
  DjangoApp,
  DjangoField,
  DjangoModel,
  DjangoProject,
  DjangoRelationship,
} from "@djangobuilder/core";

async function updateProject(
  project: DjangoProject,
  args: Record<string, string | boolean | number>
) {
  await updateDoc(doc(db, "projects", project.id), args);
}

async function updateApp(
  app: DjangoApp,
  args: Record<string, string | boolean | number>
) {
  await updateDoc(doc(db, "apps", app.id), args);
}

async function updateModel(
  model: DjangoModel,
  args: Record<string, string | boolean | number>
) {
  await updateDoc(doc(db, "models", model.id), args);
}

async function updateField(
  field: DjangoField,
  args: Record<string, string | boolean | number>
) {
  await updateDoc(doc(db, "fields", field.id), args);
}

async function updateRelationship(
  relationship: DjangoRelationship,
  args: Record<string, string | boolean | number>
) {
  await updateDoc(doc(db, "relationships", relationship.id), args);
}

export {
  updateProject,
  updateApp,
  updateModel,
  updateField,
  updateRelationship,
};
