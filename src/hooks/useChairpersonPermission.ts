import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { isChairperson } from '@/lib/utils/permissions';

/**
 * Hook to check if the current user is a chairperson
 * Returns loading state and permission result
 */
export function useChairpersonPermission() {
  const { user, loading: authLoading } = useAuth();
  const [isChair, setIsChair] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        setIsChair(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const hasPermission = await isChairperson(user);
        setIsChair(hasPermission);
        setError(null);
      } catch (err) {
        console.error('Error checking chairperson permission:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsChair(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user, authLoading]);

  return {
    isChairperson: isChair,
    loading: loading || authLoading,
    error,
  };
}

