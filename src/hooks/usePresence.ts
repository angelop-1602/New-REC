import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { reviewersManagementService } from "@/lib/services/reviewers/reviewersManagementService";
import { isReviewer } from "@/lib/utils/permissions";
import { subscribeToChairpersonPresence } from "@/lib/services/reviewers/reviewerPresenceService";

/**
 * Hook to manage reviewer presence (online/offline status)
 * Only tracks reviewers - proponents don't need presence tracking
 * Automatically sets reviewer as online when they sign in and offline when they sign out
 */
export function usePresence() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsInitialized(false);
      return;
    }

    // Initialize presence when reviewer is logged in
    const init = async () => {
      try {
        // Check if user is a reviewer
        const userIsReviewer = await isReviewer(user);
        
        if (userIsReviewer) {
          // For reviewers: update reviewers collection directly
          if (user.email) {
            await reviewersManagementService.linkReviewerByEmail(user.email, user.uid);
          }
        }
        // Proponents don't need presence tracking
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing reviewer presence:", error);
      }
    };

    init();

    // Set offline when component unmounts or user logs out
    return () => {
      if (user) {
        // Check if user is a reviewer and set offline
        isReviewer(user).then(userIsReviewer => {
          if (userIsReviewer && user.email) {
            // For reviewers: update reviewers collection directly
            reviewersManagementService.updateReviewerPresenceByEmail(user.email, false).catch(() => {
              // Silently fail if update doesn't work
            });
          }
        }).catch(() => {
          // Silently fail
        });
      }
    };
  }, [user]);

  return { isInitialized };
}

/**
 * Hook to subscribe to chairperson's presence from reviewers collection
 * Returns whether chairperson is online (presence = true)
 */
export function useChairpersonPresence() {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = subscribeToChairpersonPresence((online) => {
      setIsOnline(online);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { 
    presence: isOnline ? { status: "online" as const } : { status: "offline" as const },
    isOnline,
    loading 
  };
}

