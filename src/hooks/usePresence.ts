import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { 
  initializePresence, 
  updateLastSeen, 
  setUserOffline,
  subscribeToUserPresence,
  UserPresence
} from "@/lib/services/core/presenceService";

/**
 * Hook to manage user presence (online/offline status)
 * Automatically initializes presence on mount and cleans up on unmount
 */
export function usePresence() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsInitialized(false);
      return;
    }

    // Initialize presence when user is logged in
    const init = async () => {
      try {
        await initializePresence(user.uid, user.email || "");
        setIsInitialized(true);

        // Update last seen every 30 seconds while user is active
        const interval = setInterval(() => {
          if (user) {
            updateLastSeen(user.uid, user.email || "");
          }
        }, 30000); // 30 seconds

        // Cleanup interval on unmount
        return () => {
          clearInterval(interval);
        };
      } catch (error) {
        console.error("Error initializing presence:", error);
      }
    };

    init();

    // Set offline when component unmounts or user logs out
    return () => {
      if (user) {
        setUserOffline(user.uid, user.email || "");
      }
    };
  }, [user]);

  return { isInitialized };
}

/**
 * Hook to subscribe to a specific user's presence status
 */
export function useUserPresence(userId: string | null) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPresence(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserPresence(userId, (presenceData) => {
      setPresence(presenceData);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { presence, loading };
}

/**
 * Hook to subscribe to chairperson's presence
 * Since chairperson email is rec@spup.edu.ph, we can look it up directly
 */
export function useChairpersonPresence() {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { subscribeToChairpersonPresence } = require("@/lib/services/core/presenceService");
    
    const unsubscribe = subscribeToChairpersonPresence((presenceData: any) => {
      setPresence(presenceData);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { presence, loading };
}

