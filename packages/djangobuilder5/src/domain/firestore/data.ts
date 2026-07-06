import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db, snapshotErrorHandler } from "@/lib/firebase";
import { emptyFlatData, type FlatData } from "./types";

const COLLECTIONS: Array<keyof FlatData> = ["projects", "apps", "models", "fields", "relationships"];

/**
 * Subscribe to all five owner-scoped collections. Rebuilds a FlatData snapshot on
 * every change and invokes `onData` with a fresh copy. Returns an unsubscribe fn.
 */
export function subscribeAll(
  user: User,
  onData: (data: FlatData, allLoaded: boolean) => void,
): () => void {
  const data = emptyFlatData();
  const loaded = new Set<string>();

  const unsubs = COLLECTIONS.map((name) => {
    const extra: QueryConstraint[] = name === "projects" ? [orderBy("name")] : [];
    const q = query(collection(db, name), where("owner", "==", user.uid), ...extra);
    return onSnapshot(
      q,
      (snap) => {
        snap.docChanges().forEach((change) => {
          const id = change.doc.id;
          const bucket = data[name] as Record<string, unknown>;
          if (change.type === "removed") delete bucket[id];
          else bucket[id] = { ...change.doc.data(), id };
        });
        loaded.add(name);
        onData(structuredClone(data), loaded.size === COLLECTIONS.length);
      },
      (err) => snapshotErrorHandler(err),
    );
  });

  return () => unsubs.forEach((u) => u());
}
