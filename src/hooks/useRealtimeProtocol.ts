import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';

const db = getFirestore(firebaseApp);

interface UseRealtimeProtocolOptions {
  protocolId: string;
  collectionName?: string;
  enabled?: boolean;
}

interface UseRealtimeProtocolResult {
  protocol: any | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for real-time protocol updates
 * Automatically subscribes to Firestore changes and updates UI
 */
export function useRealtimeProtocol({
  protocolId,
  collectionName = 'submissions',
  enabled = true,
}: UseRealtimeProtocolOptions): UseRealtimeProtocolResult {
  const [protocol, setProtocol] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !protocolId) {
      setLoading(false);
      return;
    }

    try {
      const protocolRef = doc(db, collectionName, protocolId);

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        protocolRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setProtocol({
              id: snapshot.id,
              ...data,
            });
            setError(null);
          } else {
            console.warn(`⚠️ Protocol ${protocolId} not found`);
            setProtocol(null);
            setError(new Error('Protocol not found'));
          }
          setLoading(false);
        },
        (err) => {
          console.error(`❌ Error in real-time protocol listener for ${protocolId}:`, err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error setting up protocol listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [protocolId, collectionName, enabled]);

  return { protocol, loading, error };
}

