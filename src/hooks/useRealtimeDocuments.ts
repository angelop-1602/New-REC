import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import type { DocumentsType } from '@/types';

const db = getFirestore(firebaseApp);

interface UseRealtimeDocumentsOptions {
  protocolId: string;
  collectionName?: string;
  statusFilter?: string; // Filter by status (e.g., 'pending', 'accepted')
  enabled?: boolean; // Enable/disable listener
}

interface UseRealtimeDocumentsResult {
  documents: DocumentsType[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for real-time document updates
 * Automatically subscribes to Firestore changes and updates UI
 */
export function useRealtimeDocuments({
  protocolId,
  collectionName = 'submissions',
  statusFilter,
  enabled = true,
}: UseRealtimeDocumentsOptions): UseRealtimeDocumentsResult {
  const [documents, setDocuments] = useState<DocumentsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !protocolId) {
      setLoading(false);
      return;
    }

    console.log(`🔄 Setting up real-time listener for documents in ${protocolId}`);
    
    try {
      const protocolRef = doc(db, collectionName, protocolId);
      const documentsRef = collection(protocolRef, 'documents');
      
      // Build query based on filters
      let documentsQuery = query(documentsRef);
      
      if (statusFilter) {
        documentsQuery = query(documentsRef, where('currentStatus', '==', statusFilter));
      }

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        documentsQuery,
        (snapshot) => {
          console.log(`📄 Documents updated: ${snapshot.docs.length} documents`);
          
          const updatedDocs: DocumentsType[] = [];
          snapshot.forEach((doc) => {
            updatedDocs.push({
              id: doc.id,
              ...doc.data(),
            } as DocumentsType);
          });

          // Sort by uploadedAt (newest first)
          updatedDocs.sort((a, b) => {
            const dateA = new Date(a.uploadedAt || 0).getTime();
            const dateB = new Date(b.uploadedAt || 0).getTime();
            return dateB - dateA;
          });

          setDocuments(updatedDocs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error in real-time documents listener:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup subscription on unmount
      return () => {
        console.log(`🔌 Unsubscribing from documents listener for ${protocolId}`);
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error setting up documents listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [protocolId, collectionName, statusFilter, enabled]);

  return { documents, loading, error };
}

