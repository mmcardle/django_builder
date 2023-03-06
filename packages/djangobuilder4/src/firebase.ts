import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  addDoc,
  deleteField,
  doc,
  getFirestore,
  onSnapshot,
  Query,
  QueryConstraint,
  updateDoc,
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

async function deleteApp(projectid: string, appid: string) {
  console.log("Remove app ", appid, "from ", projectid);
  const projectRef = doc(db, "projects", projectid);
  const appRef = doc(db, "apps", appid);
  const batch = writeBatch(db);
  batch.update(projectRef, { [`apps.${appid}`]: deleteField() });
  batch.delete(appRef);
  batch.commit().catch((err) => console.error("Failed!", err));
}

export {
  auth,
  db,
  fetchProjects,
  fetchApps,
  fetchModels,
  fetchFields,
  fetchRelationships,
  addApp,
  deleteApp,
};
