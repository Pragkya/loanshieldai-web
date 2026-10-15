// Save and read the person's past checks in Firestore.
// Each kind has its own folder: users/{uid}/emiChecks, users/{uid}/docChecks
import { useEffect, useState } from "react";
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export function addHistory(uid, kind, item) {
  if (!uid) return;
  return addDoc(collection(db, "users", uid, kind), { ...item, createdAt: serverTimestamp() });
}

export function useHistory(uid, kind, max = 5) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "users", uid, kind), orderBy("createdAt", "desc"), limit(max));
    return onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setItems([]));
  }, [uid, kind, max]);
  return items;
}
