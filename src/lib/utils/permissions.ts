import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseApp from '@/lib/firebaseConfig';

const db = getFirestore(firebaseApp);
const CHAIRPERSON_EMAIL = 'rec@spup.edu.ph';

/**
 * User type that can be either Firebase User or custom User
 */
interface UserLike {
  uid: string;
  email: string | null;
}

/**
 * Check if a user is a chairperson
 * Matches the logic in firestore.rules isChairperson() function
 * 
 * Checks in order:
 * 1. Email check (fastest, no document reads needed)
 * 2. settings document exists
 * 3. reviewer document with role='chairperson' and isActive=true
 */
export async function isChairperson(user: UserLike | null): Promise<boolean> {
  if (!user) {
    return false;
  }

  // First check: email (fastest, no document reads needed)
  if (user.email === CHAIRPERSON_EMAIL) {
    return true;
  }

  const userId = user.uid;

  try {
    // Second check: settings document
    const settingsRef = doc(db, 'settings', userId);
    const settingsDoc = await getDoc(settingsRef);
    if (settingsDoc.exists()) {
      return true;
    }

    // Third check: reviewer document with chairperson role
    const reviewerRef = doc(db, 'reviewers', userId);
    const reviewerDoc = await getDoc(reviewerRef);
    if (reviewerDoc.exists()) {
      const reviewerData = reviewerDoc.data();
      if (reviewerData.role === 'chairperson' && reviewerData.isActive === true) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking chairperson permission:', error);
    return false;
  }
}

/**
 * Check if a user is a reviewer
 * Matches the logic in firestore.rules isReviewer() function
 */
export async function isReviewer(user: UserLike | null): Promise<boolean> {
  if (!user) {
    return false;
  }

  try {
    const reviewerRef = doc(db, 'reviewers', user.uid);
    const reviewerDoc = await getDoc(reviewerRef);
    if (reviewerDoc.exists()) {
      const reviewerData = reviewerDoc.data();
      return reviewerData.isActive === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking reviewer permission:', error);
    return false;
  }
}

