import { 
  doc, 
  setDoc, 
  serverTimestamp,
  onSnapshot,
  getDoc
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseApp from "@/lib/firebaseConfig";
import { toDate } from '@/types';

const db = getFirestore(firebaseApp);
const PRESENCE_COLLECTION = "presence";

export interface UserPresence {
  userId: string;
  email: string;
  status: "online" | "offline";
  lastSeen: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

/**
 * Get presence document ID by email
 * We'll use email as document ID for easy lookup
 */
function getPresenceDocId(email: string): string {
  // Use email as document ID (sanitized)
  return email.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Initialize presence tracking for the current user
 * Call this when user logs in or app starts
 * Stores presence by both userId and email for easy lookup
 * 
 * Note: Firestore doesn't have onDisconnect like Realtime Database.
 * We use a heartbeat mechanism - if lastSeen is older than 60 seconds, user is considered offline.
 */
export async function initializePresence(userId: string, email: string): Promise<void> {
  try {
    // Store presence by userId
    const presenceRef = doc(db, PRESENCE_COLLECTION, userId);
    await setDoc(presenceRef, {
      userId,
      email,
      status: "online",
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Also store by email for easy lookup (e.g., for chairperson)
    const emailPresenceRef = doc(db, PRESENCE_COLLECTION, getPresenceDocId(email));
    await setDoc(emailPresenceRef, {
      userId,
      email,
      status: "online",
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log(`✅ Presence initialized for user ${userId} (${email})`);
  } catch (error) {
    console.error("Error initializing presence:", error);
  }
}

/**
 * Update user's last seen timestamp
 * Call this periodically (e.g., every 30 seconds) while user is active
 */
export async function updateLastSeen(userId: string, email: string): Promise<void> {
  try {
    // Update both userId and email-based presence
    const presenceRef = doc(db, PRESENCE_COLLECTION, userId);
    const emailPresenceRef = doc(db, PRESENCE_COLLECTION, getPresenceDocId(email));
    
    const updateData = {
      userId,
      email,
      status: "online" as const,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(presenceRef, updateData, { merge: true });
    await setDoc(emailPresenceRef, updateData, { merge: true });
  } catch (error) {
    console.error("Error updating last seen:", error);
  }
}

/**
 * Set user as offline
 * Call this when user explicitly logs out
 */
export async function setUserOffline(userId: string, email: string): Promise<void> {
  try {
    const presenceRef = doc(db, PRESENCE_COLLECTION, userId);
    const emailPresenceRef = doc(db, PRESENCE_COLLECTION, getPresenceDocId(email));
    
    const updateData = {
      userId,
      email,
      status: "offline" as const,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(presenceRef, updateData, { merge: true });
    await setDoc(emailPresenceRef, updateData, { merge: true });
    console.log(`✅ User ${userId} set to offline`);
  } catch (error) {
    console.error("Error setting user offline:", error);
  }
}

/**
 * Get user presence status
 */
export async function getUserPresence(userId: string): Promise<UserPresence | null> {
  try {
    const presenceRef = doc(db, PRESENCE_COLLECTION, userId);
    const snapshot = await getDoc(presenceRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as UserPresence;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user presence:", error);
    return null;
  }
}

/**
 * Check if user is online based on lastSeen timestamp
 * User is considered online if lastSeen is within the last 60 seconds
 */
function isUserOnline(presence: UserPresence | null): boolean {
  if (!presence || !presence.lastSeen) {
    return false;
  }

  // If status is explicitly offline, return false
  if (presence.status === "offline") {
    return false;
  }

  // Check if lastSeen is recent (within 60 seconds)
  const lastSeen = toDate(presence.lastSeen);
  const now = new Date();
  const secondsSinceLastSeen = (now.getTime() - lastSeen.getTime()) / 1000;

  // Consider online if last seen within 60 seconds
  return secondsSinceLastSeen < 60;
}

/**
 * Subscribe to user presence changes in real-time
 * Returns an unsubscribe function
 * Automatically determines online/offline based on lastSeen timestamp
 */
export function subscribeToUserPresence(
  userId: string,
  callback: (presence: UserPresence | null) => void
): () => void {
  const presenceRef = doc(db, PRESENCE_COLLECTION, userId);
  
  const unsubscribe = onSnapshot(
    presenceRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserPresence;
        // Determine actual status based on lastSeen
        const actualStatus = isUserOnline(data) ? "online" : "offline";
        callback({
          ...data,
          status: actualStatus
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error subscribing to presence:", error);
      callback(null);
    }
  );

  return unsubscribe;
}

/**
 * Get chairperson's user ID from email
 */
export async function getChairpersonUserId(): Promise<string | null> {
  try {
    // The chairperson email is fixed: rec@spup.edu.ph
    // We need to find the user ID associated with this email
    // For now, we'll use a simple approach - you might need to adjust based on your auth setup
    const auth = getAuth(firebaseApp);
    // Note: This is a simplified approach. In production, you might want to store
    // the mapping of email to userId in Firestore
    return null; // Will be handled by checking email in presence
  } catch (error) {
    console.error("Error getting chairperson user ID:", error);
    return null;
  }
}

/**
 * Subscribe to chairperson presence by email
 * Since we know the chairperson email is rec@spup.edu.ph, we can look it up by email
 * Automatically determines online/offline based on lastSeen timestamp
 */
export function subscribeToChairpersonPresence(
  callback: (presence: UserPresence | null) => void
): () => void {
  const chairpersonEmail = "rec@spup.edu.ph";
  const presenceRef = doc(db, PRESENCE_COLLECTION, getPresenceDocId(chairpersonEmail));
  
  const unsubscribe = onSnapshot(
    presenceRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserPresence;
        // Determine actual status based on lastSeen
        const actualStatus = isUserOnline(data) ? "online" : "offline";
        callback({
          ...data,
          status: actualStatus
        });
      } else {
        // If no presence document exists, user is offline
        callback({
          userId: "",
          email: chairpersonEmail,
          status: "offline",
          lastSeen: null,
          updatedAt: null
        });
      }
    },
    (error) => {
      console.error("Error subscribing to chairperson presence:", error);
      callback(null);
    }
  );

  return unsubscribe;
}

