"use client";

import { useEffect, useState, useRef } from "react";
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  Unsubscribe,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { processFirestoreDocument, processFirestoreDocuments } from "@/lib/utils/firestoreUtils";

// Types for hook options
export interface FirestoreQueryOptions {
  where?: Array<{ field: string; operator: any; value: any }>;
  orderBy?: Array<{ field: string; direction?: "asc" | "desc" }>;
  limit?: number;
}

export interface FirestoreHookResult<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
}

export interface FirestoreDocResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for realtime Firestore collection queries
 * @param path - Collection path (e.g., "submissions_pending")
 * @param options - Query options (where, orderBy, limit)
 * @returns { data, loading, error }
 */
export function useFirestoreQuery<T = DocumentData>(
  path: string,
  options?: FirestoreQueryOptions
): FirestoreHookResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!path || path.trim() === "") {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create collection reference
      const collectionRef = collection(db, path);

      // Build query constraints
      const constraints: QueryConstraint[] = [];

      // Add where clauses
      if (options?.where) {
        options.where.forEach(({ field, operator, value }) => {
          constraints.push(where(field, operator, value));
        });
      }

      // Add orderBy clauses
      if (options?.orderBy) {
        options.orderBy.forEach(({ field, direction = "asc" }) => {
          constraints.push(orderBy(field, direction));
        });
      }

      // Add limit
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }

      // Create query
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

      // Set up realtime listener
      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const documents: T[] = [];
          snapshot.forEach((doc) => {
            const docData = {
              id: doc.id,
              ...doc.data(),
            } as T;
            // Process timestamps to prevent React rendering errors
            const processedDoc = processFirestoreDocument(docData as Record<string, any>) as T;
            documents.push(processedDoc);
          });
          setData(documents);
          setLoading(false);
        },
        (err) => {
          console.error("Firestore query error:", err);
          setError(err.message);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Error setting up Firestore query:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [path, JSON.stringify(options)]);

  return { data, loading, error };
}

/**
 * Hook for realtime Firestore document listening
 * @param path - Document path (e.g., "submissions_pending/docId")
 * @returns { data, loading, error }
 */
export function useFirestoreDoc<T = DocumentData>(
  path: string
): FirestoreDocResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!path || path.trim() === "") {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create document reference
      const docRef = doc(db, path);

      // Set up realtime listener
      unsubscribeRef.current = onSnapshot(
        docRef,
        (snapshot: DocumentSnapshot<DocumentData>) => {
          if (snapshot.exists()) {
            const docData = {
              id: snapshot.id,
              ...snapshot.data(),
            } as T;
            // Process timestamps to prevent React rendering errors
            const processedDoc = processFirestoreDocument(docData as Record<string, any>) as T;
            setData(processedDoc);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Firestore document error:", err);
          setError(err.message);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Error setting up Firestore document listener:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [path]);

  return { data, loading, error };
}

/**
 * Hook for realtime Firestore subcollection queries
 * @param parentPath - Parent document path (e.g., "submissions/docId")
 * @param subcollection - Subcollection name (e.g., "reviewers")
 * @param options - Query options
 * @returns { data, loading, error }
 */
export function useFirestoreSubcollection<T = DocumentData>(
  parentPath: string,
  subcollection: string,
  options?: FirestoreQueryOptions
): FirestoreHookResult<T> {
  const subcollectionPath = `${parentPath}/${subcollection}`;
  return useFirestoreQuery<T>(subcollectionPath, options);
}

/**
 * Hook for realtime Firestore subcollection document
 * @param parentPath - Parent document path (e.g., "submissions/docId")
 * @param subcollection - Subcollection name (e.g., "reviewers")
 * @param docId - Document ID within subcollection
 * @returns { data, loading, error }
 */
export function useFirestoreSubcollectionDoc<T = DocumentData>(
  parentPath: string,
  subcollection: string,
  docId: string
): FirestoreDocResult<T> {
  const docPath = `${parentPath}/${subcollection}/${docId}`;
  return useFirestoreDoc<T>(docPath);
}

