import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { Reviewer } from './reviewersManagementService';

const db = getFirestore(firebaseApp);
const REVIEWERS_COLLECTION = 'reviewers';

/**
 * Subscribe to chairperson presence from reviewers collection
 * Returns an unsubscribe function
 */
export function subscribeToChairpersonPresence(
  callback: (isOnline: boolean) => void
): () => void {
  const chairpersonQuery = query(
    collection(db, REVIEWERS_COLLECTION),
    where('role', '==', 'chairperson'),
    limit(1)
  );
  
  const unsubscribe = onSnapshot(
    chairpersonQuery,
    (snapshot) => {
      if (!snapshot.empty && snapshot.docs.length > 0) {
        const reviewer = snapshot.docs[0].data() as Reviewer;
        // Presence is true if reviewer is online
        callback(reviewer.presence === true);
      } else {
        // No chairperson found, consider offline
        callback(false);
      }
    },
    (error) => {
      console.error('Error subscribing to chairperson presence:', error);
      callback(false);
    }
  );

  return unsubscribe;
}

/**
 * Get chairperson presence status
 */
export async function getChairpersonPresence(): Promise<boolean> {
  try {
    const chairpersonQuery = query(
      collection(db, REVIEWERS_COLLECTION),
      where('role', '==', 'chairperson'),
      limit(1)
    );
    
    const snapshot = await getDocs(chairpersonQuery);
    
    if (!snapshot.empty && snapshot.docs.length > 0) {
      const reviewer = snapshot.docs[0].data() as Reviewer;
      return reviewer.presence === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error getting chairperson presence:', error);
    return false;
  }
}

