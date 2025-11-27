import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getAuth } from 'firebase/auth';
import firebaseApp from '@/lib/firebaseConfig';

/**
 * Hook to get the current chairperson's authentication info
 * Falls back to Firebase Auth if available, otherwise uses a default/fallback ID
 */
export function useChairpersonAuth() {
  const { user, loading: authLoading } = useAuth();
  const [chairpersonId, setChairpersonId] = useState<string | null>(null);
  const [chairpersonName, setChairpersonName] = useState<string>('REC Chairperson');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getChairpersonInfo = async () => {
      try {
        // First, try to get from Firebase Auth
        const auth = getAuth(firebaseApp);
        const currentUser = auth.currentUser;

        if (currentUser) {
          // Use Firebase Auth user
          setChairpersonId(currentUser.uid);
          setChairpersonName(currentUser.displayName || currentUser.email || 'REC Chairperson');
          setLoading(false);
          return;
        }

        // If no Firebase Auth user, check if there's a stored chairperson ID
        const storedChairpersonId = localStorage.getItem('chairpersonId');
        const storedChairpersonName = localStorage.getItem('chairpersonName');

        if (storedChairpersonId) {
          setChairpersonId(storedChairpersonId);
          setChairpersonName(storedChairpersonName || 'REC Chairperson');
          setLoading(false);
          return;
        }

        // Fallback: Use a default ID (for development/testing)
        // In production, this should redirect to login
        const defaultId = 'chairperson-default-id';
        setChairpersonId(defaultId);
        setChairpersonName('REC Chairperson');
        
        console.warn('⚠️ No chairperson authentication found. Using default ID. Please set up authentication.');
        setLoading(false);
      } catch (error) {
        console.error('Error getting chairperson info:', error);
        setLoading(false);
      }
    };

    if (!authLoading) {
      getChairpersonInfo();
    }
  }, [user, authLoading]);

  return {
    chairpersonId,
    chairpersonName,
    email: user?.email || null,
    displayName: chairpersonName,
    loading: loading || authLoading,
    isAuthenticated: !!chairpersonId,
  };
}

