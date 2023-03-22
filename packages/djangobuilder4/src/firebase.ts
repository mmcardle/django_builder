import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  addDoc,
  deleteField as firebaseDeleteField,
  doc,
  getFirestore,
  onSnapshot,
  Query,
  QueryConstraint,
  updateDoc,
  WriteBatch,
  writeBatch,
  type DocumentChange,
  type DocumentData,
} from "firebase/firestore";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { App, Field, Model, Project, Relationship } from "./types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASEURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID,
};

console.debug("Firebase", firebaseConfig);

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

setPersistence(auth, browserSessionPersistence);

const snapShotErrorHandler = function (error: unknown) {
  if (auth.currentUser) {
    throw error;
  } else {
    return {};
  }
};

async function queryToResult<DataType>(query: Query<DocumentData>) {
  try {
    const snapshot = await getDocs(query);
    return snapshot.docs.reduce((results, queryDoc) => {
      const docData = queryDoc.data() as DocumentData;
      const docDataWithId = Object.assign(docData, { id: queryDoc.id });
      return Object.assign(results, {
        [queryDoc.id]: docDataWithId,
      });
    }, {} as Record<string, DataType>);
  } catch (error) {
    return snapShotErrorHandler(error);
  }
}

async function fetchUserCollection<T>(
  user: User,
  onUpdate: (data: DocumentChange<DocumentData>) => void,
  collectionName: string,
  extra = [] as Array<QueryConstraint>
) {
  const projectQuery = query(
    collection(db, collectionName),
    where("owner", "==", user.uid),
    ...extra
  );

  const unsubscribe = onSnapshot(projectQuery, (querySnapshot) => {
    querySnapshot.docChanges().forEach((change) => {
      onUpdate(change);
    });
  });

  const result = await queryToResult<T>(projectQuery);

  return { result, unsubscribe: unsubscribe };
}

async function fetchProjects(
  user: User,
  onUpdate: (data: DocumentChange<DocumentData>) => void
) {
  return fetchUserCollection<Project>(user, onUpdate, "projects", [
    orderBy("name"),
  ]);
}

async function fetchApps(
  user: User,
  onUpdate: (data: DocumentChange<DocumentData>) => void
) {
  return fetchUserCollection<App>(user, onUpdate, "apps");
}

async function fetchModels(
  user: User,
  onUpdate: (data: DocumentChange<DocumentData>) => void
) {
  return fetchUserCollection<Model>(user, onUpdate, "models");
}

async function fetchFields(
  user: User,
  onUpdate: (data: DocumentChange<DocumentData>) => void
) {
  return fetchUserCollection<Field>(user, onUpdate, "fields");
}

async function fetchRelationships(
  user: User,
  onUpdate: (data: DocumentChange<DocumentData>) => void
) {
  return fetchUserCollection<Relationship>(user, onUpdate, "relationships");
}

async function addApp(user: User, projectid: string, name: string) {
  const newAppData = { owner: user.uid, name: name, models: {} };
  const appRef = await addDoc(collection(db, "apps"), newAppData);
  const projectRef = doc(db, "projects", projectid);
  await updateDoc(projectRef, { [`apps.${appRef.id}`]: true });
}

async function addModel(
  user: User,
  appid: string,
  name: string,
  abstract: boolean
) {
  const newModelData = {
    owner: user.uid,
    name,
    abstract,
    fields: {},
    relationships: [],
  };
  const modelRef = await addDoc(collection(db, "models"), newModelData);
  const appRef = doc(db, "apps", appid);
  await updateDoc(appRef, { [`models.${modelRef.id}`]: true });
}

async function addField(
  user: User,
  modelid: string,
  name: string,
  type: string,
  args: string,
) {
  const newFieldData = {
    owner: user.uid,
    name,
    type,
    args,
  };
  const fieldRef = await addDoc(collection(db, "fields"), newFieldData);
  const modelRef = doc(db, "models", modelid);
  await updateDoc(modelRef, { [`fields.${fieldRef.id}`]: true });
}

async function getDeleteBatch(
  projectids: Array<string>,
  appids: Array<string>,
  modelids: Array<string>,
  fieldids: Array<string>,
  relationshipids: Array<string>
): Promise<WriteBatch> {
  const batch = writeBatch(db);
  projectids.map((projectid) => batch.delete(doc(db, "projects", projectid)));
  appids.map((appid) => batch.delete(doc(db, "apps", appid)));
  modelids.map((modelid) => batch.delete(doc(db, "models", modelid)));
  fieldids.map((fieldid) => batch.delete(doc(db, "fields", fieldid)));
  relationshipids.map((relationshipid) =>
    batch.delete(doc(db, "relationship", relationshipid))
  );
  return batch;
}

async function deleteProject(projectid: string, batch?: WriteBatch) {
  console.debug("Delete project ", projectid);
  if (!batch) {
    batch = writeBatch(db);
  }
  const projectRef = doc(db, "projects", projectid);
  batch.delete(projectRef);
  batch
    .commit()
    .catch((err) => console.error("Failed to delete project!", err));
}

async function deleteApp(projectid: string, appid: string, batch?: WriteBatch) {
  console.debug("Delete app ", appid, "from ", projectid);
  if (!batch) {
    batch = writeBatch(db);
  }
  const appRef = doc(db, "apps", appid);
  batch.delete(appRef);
  const projectRef = doc(db, "projects", projectid);
  batch.update(projectRef, { [`apps.${appid}`]: firebaseDeleteField() });
  batch.commit().catch((err) => console.error("Failed to delete app!", err));
}

async function deleteModel(appid: string, modelid: string, batch?: WriteBatch) {
  console.debug("Delete model ", modelid, "from ", appid);
  if (!batch) {
    batch = writeBatch(db);
  }
  const modelRef = doc(db, "models", modelid);
  batch.delete(modelRef);
  const appRef = doc(db, "apps", appid);
  batch.update(appRef, { [`models.${modelid}`]: firebaseDeleteField() });
  await batch.commit().catch((err) => console.error("Failed!", err));
}

async function deleteField(modelid: string, fieldid: string, batch?: WriteBatch) {
  console.debug("Delete field ", fieldid, "from ", modelid);
  if (!batch) {
    batch = writeBatch(db);
  }
  const fieldRef = doc(db, "fields", fieldid);
  batch.delete(fieldRef);
  const modelRef = doc(db, "models", modelid);
  batch.update(modelRef, { [`fields.${fieldid}`]: firebaseDeleteField() });
  await batch.commit().catch((err) => console.error("Failed!", err));
}

async function deleteRelationship(modelid: string, relationshipid: string, batch?: WriteBatch) {
  console.debug("Delete relationship ", relationshipid, "from ", modelid);
  if (!batch) {
    batch = writeBatch(db);
  }
  const relationshipRef = doc(db, "relationships", relationshipid);
  batch.delete(relationshipRef);
  const modelRef = doc(db, "models", modelid);
  batch.update(modelRef, { [`relationships.${relationshipid}`]: firebaseDeleteField() });
  await batch.commit().catch((err) => console.error("Failed!", err));
}

async function createProject(
  name: string,
  description: string,
  django_version: string,
  htmx: boolean,
  channels: boolean
) {
  const docRef = await addDoc(collection(db, "projects"), {
    owner: auth.currentUser?.uid,
    name,
    description,
    django_version,
    htmx,
    channels,
    apps: [],
  });
  console.log("Document written with ID: ", docRef.id);
}

async function updateResource(
  resource: string,
  id: string,
  args: Record<string, string | boolean | number>
) {
  return await updateDoc(doc(db, resource, id), args);
}

async function updateProject(
  id: string,
  args: Record<string, string | boolean | number>
) {
  return await updateResource("projects", id, args);
}

async function updateApp(
  id: string,
  args: Record<string, string | boolean | number>
) {
  return await updateResource("apps", id, args);
}

async function updateModel(
  id: string,
  args: Record<string, string | boolean | number>
) {
  return await updateResource("models", id, args);
}

async function updateField(
  id: string,
  args: Record<string, string | boolean | number>
) {
  return await updateResource("fields", id, args);
}

async function updateRelationship(
  id: string,
  args: Record<string, string | boolean | number>
) {
  return await updateResource("relationships", id, args);
}

export {
  auth,
  db,
  fetchProjects,
  fetchApps,
  fetchModels,
  fetchFields,
  fetchRelationships,
  createProject,
  addApp,
  addModel,
  addField,
  updateProject,
  updateApp,
  updateModel,
  updateField,
  updateRelationship,
  getDeleteBatch,
  deleteProject,
  deleteApp,
  deleteModel,
  deleteField,
  deleteRelationship,
};
