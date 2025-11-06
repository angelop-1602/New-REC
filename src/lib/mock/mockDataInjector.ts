/**
 * Mock Data Injector Utility
 * 
 * This utility helps inject mock data into Firestore for a specific user.
 * Use this for testing and development purposes.
 */

import { doc, setDoc, serverTimestamp, getDoc, collection, getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { SUBMISSIONS_COLLECTION } from '@/lib/firebase/firestore';
import { allMockSubmissions } from './mockSubmissions';
import { toast } from 'sonner';

const db = getFirestore(firebaseApp);

/**
 * Recursively remove undefined values from an object
 * Firestore doesn't support undefined values
 */
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  
  return obj;
};

/**
 * Inject a single mock submission into Firestore for a specific user
 */
export const injectMockSubmission = async (
  mockSubmission: any,
  userId: string
): Promise<void> => {
  try {
    // Update user-related fields
    const submissionData = {
      ...mockSubmission,
      submitBy: userId,
      createdBy: userId,
      updatedAt: serverTimestamp(),
      // Ensure all timestamps are properly formatted
      createdAt: mockSubmission.createdAt || serverTimestamp(),
      acceptedAt: mockSubmission.acceptedAt || undefined,
      approvedAt: mockSubmission.approvedAt || undefined,
      archivedAt: mockSubmission.archivedAt || undefined,
      decisionDate: mockSubmission.decisionDate || undefined,
      assignedAt: mockSubmission.assignedAt || undefined,
    };

    // Remove id field and use applicationID as document ID
    const { id, ...dataWithoutId } = submissionData;
    const documentId = submissionData.applicationID || id;
    
    // Remove all undefined values before saving to Firestore
    const cleanedData = removeUndefined(dataWithoutId);

    // Create document reference
    const submissionRef = doc(db, SUBMISSIONS_COLLECTION, documentId);

    // Check if document already exists
    const existingDoc = await import('firebase/firestore').then(({ getDoc }) => getDoc(submissionRef));
    if (existingDoc.exists()) {
      throw new Error(`Submission with ID ${documentId} already exists`);
    }

    // Write to Firestore
    await setDoc(submissionRef, cleanedData);

    // If there are reviewers, save them to the reviewers subcollection
    if (mockSubmission.reviewers && Array.isArray(mockSubmission.reviewers)) {
      const reviewersRef = collection(db, SUBMISSIONS_COLLECTION, documentId, 'reviewers');
      
      for (const reviewer of mockSubmission.reviewers) {
        const reviewerRef = doc(reviewersRef, reviewer.reviewerId || `reviewer-${Date.now()}`);
        const reviewerData = removeUndefined({
          ...reviewer,
          assignedAt: reviewer.assignedAt || serverTimestamp(),
          deadline: reviewer.deadline || undefined,
        });
        await setDoc(reviewerRef, reviewerData);
      }
    }

    // If there are documents, save them to the documents subcollection
    if (mockSubmission.documents && Array.isArray(mockSubmission.documents)) {
      const documentsRef = collection(db, SUBMISSIONS_COLLECTION, documentId, 'documents');
      
      for (const document of mockSubmission.documents) {
        const docRef = doc(documentsRef, document.id || `doc-${Date.now()}`);
        const docData = removeUndefined({
          ...document,
          uploadedAt: document.uploadedAt || serverTimestamp(),
        });
        await setDoc(docRef, docData);
      }
    }

    // If there's a decision, save it to the decision subcollection
    if (mockSubmission.decisionDetails || mockSubmission.decision) {
      const decisionRef = doc(db, SUBMISSIONS_COLLECTION, documentId, 'decision', 'details');
      
      const decisionData = removeUndefined(
        mockSubmission.decisionDetails || {
          decision: mockSubmission.decision,
          decisionDate: mockSubmission.decisionDate || serverTimestamp(),
          decisionBy: mockSubmission.decisionBy || userId,
          timeline: mockSubmission.decisionDetails?.timeline,
          meetingReference: mockSubmission.decisionDetails?.meetingReference,
        }
      );

      await setDoc(decisionRef, decisionData);
    }

    console.log(`✅ Mock submission injected: ${documentId}`);
  } catch (error) {
    console.error('Error injecting mock submission:', error);
    throw error;
  }
};

/**
 * Inject all mock submissions for a specific user
 */
export const injectAllMockSubmissions = async (userId: string): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const mockSubmission of allMockSubmissions) {
    try {
      await injectMockSubmission(mockSubmission, userId);
      results.success++;
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`${mockSubmission.id}: ${errorMessage}`);
      console.error(`Failed to inject ${mockSubmission.id}:`, error);
    }
  }

  return results;
};

/**
 * Inject mock submissions by status for a specific user
 */
export const injectMockSubmissionsByStatus = async (
  userId: string,
  status: 'pending' | 'accepted' | 'approved' | 'archived' | 'draft'
): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  const filteredSubmissions = allMockSubmissions.filter(
    (sub) => sub.status === status
  );

  for (const mockSubmission of filteredSubmissions) {
    try {
      await injectMockSubmission(mockSubmission, userId);
      results.success++;
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`${mockSubmission.id}: ${errorMessage}`);
      console.error(`Failed to inject ${mockSubmission.id}:`, error);
    }
  }

  return results;
};

/**
 * Inject a single mock submission by ID for a specific user
 */
export const injectMockSubmissionById = async (
  userId: string,
  submissionId: string
): Promise<void> => {
  const mockSubmission = allMockSubmissions.find(
    (sub) => sub.id === submissionId || sub.applicationID === submissionId
  );

  if (!mockSubmission) {
    throw new Error(`Mock submission with ID ${submissionId} not found`);
  }

  await injectMockSubmission(mockSubmission, userId);
};

