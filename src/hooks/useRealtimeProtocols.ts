import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { toDate } from '@/types';

const db = getFirestore(firebaseApp);

interface UseRealtimeProtocolsOptions {
  collectionName?: string;
  statusFilter?: string | string[]; // Filter by status
  userIdFilter?: string; // Filter by user (createdBy/submitBy)
  enabled?: boolean;
}

interface UseRealtimeProtocolsResult {
  protocols: any[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for real-time protocols list updates
 * Automatically subscribes to Firestore changes and updates UI
 */
export function useRealtimeProtocols({
  collectionName = 'submissions',
  statusFilter,
  userIdFilter,
  enabled = true,
}: UseRealtimeProtocolsOptions = {}): UseRealtimeProtocolsResult {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    console.log(`🔄 Setting up real-time listener for protocols in ${collectionName}`);

    try {
      const protocolsRef = collection(db, collectionName);
      
      // Build query with filters
      const constraints: QueryConstraint[] = [];
      
      if (statusFilter) {
        if (Array.isArray(statusFilter)) {
          // Multiple statuses - use 'in' operator (max 10 values)
          constraints.push(where('status', 'in', statusFilter));
        } else {
          // Single status
          constraints.push(where('status', '==', statusFilter));
        }
      }
      
      if (userIdFilter) {
        constraints.push(where('createdBy', '==', userIdFilter));
      }
      
      // Track if we need to sort client-side
      // Only use orderBy if there are no filters (to avoid composite index requirement)
      const hasFilters = constraints.length > 0;
      const needsClientSort = hasFilters;
      
      if (!hasFilters) {
        constraints.push(orderBy('createdAt', 'desc'));
      }

      const protocolsQuery = query(protocolsRef, ...constraints);

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        protocolsQuery,
        (snapshot) => {
          console.log(`📋 Protocols updated: ${snapshot.docs.length} protocols`);
          
          const updatedProtocols: any[] = [];
          snapshot.forEach((doc) => {
            updatedProtocols.push({
              id: doc.id,
              ...doc.data(),
            });
          });

          // Sort client-side if we have filters (to avoid index requirement)
          if (needsClientSort) {
            updatedProtocols.sort((a, b) => {
              const dateA = toDate(a.createdAt);
              const dateB = toDate(b.createdAt);
              if (!dateA || !dateB) return 0;
              return dateB.getTime() - dateA.getTime(); // Most recent first
            });
          }

          setProtocols(updatedProtocols);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error in real-time protocols listener:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup subscription on unmount
      return () => {
        console.log(`🔌 Unsubscribing from protocols listener`);
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error setting up protocols listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [collectionName, statusFilter, userIdFilter, enabled]);

  return { protocols, loading, error };
}

