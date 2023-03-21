import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type {
  DjangoApp,
  DjangoField,
  DjangoModel,
  DjangoProject,
  DjangoRelationship,
} from "@djangobuilder/core";
import { useUserStore } from "./stores/user";
import { storeToRefs } from "pinia";

const userStore = useUserStore();
const { getFieldId, getRelationshipId } =
  storeToRefs(userStore);

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
  const fieldid = getFieldId.value(field);
  if (fieldid) {
    await updateDoc(doc(db, "fields", fieldid), args);
  } else {
    throw new Error(`No field ${field.name}`);
  }
}

async function updateRelationship(
  relationship: DjangoRelationship,
  args: Record<string, string | boolean | number>
) {
  const relationshipid = getRelationshipId.value(relationship);
  await updateDoc(doc(db, "relationships", relationshipid), args);
}

export {
  updateProject,
  updateApp,
  updateModel,
  updateField,
  updateRelationship,
};
