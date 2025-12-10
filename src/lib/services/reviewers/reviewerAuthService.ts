import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { getFirestore } from 'firebase/firestore';
import { toDate } from '@/types';

const db = getFirestore(firebaseApp);
const REVIEWERS_COLLECTION = 'reviewers';

export interface ReviewerAuthData {
  id: string;
  code: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  currentLoad: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AuthResult {
  success: boolean;
  reviewer?: ReviewerAuthData;
  error?: string;
}

class ReviewerAuthService {
  /**
   * Validate reviewer code and check if reviewer is active
   * @param code - The reviewer code to validate (e.g., "MRRBD-013")
   * @returns AuthResult with success status and reviewer data
   */
  async validateReviewerCode(code: string): Promise<AuthResult> {
    try {
      // Input validation
      if (!code || typeof code !== 'string') {
        return {
          success: false,
          error: 'Invalid reviewer code format'
        };
      }

      // Clean and normalize the code
      const cleanCode = code.trim().toUpperCase();

      // Basic format validation (should be like "DRJF-018" or "MSMS-001" - includes titles)
      const codePattern = /^[A-Z]{2,8}-\d{3}$/;
      if (!codePattern.test(cleanCode)) {
        return {
          success: false,
          error: 'Invalid code format. Expected format: ABC-123'
        };
      }

      // Query Firestore for the reviewer with this code
      const reviewersRef = collection(db, REVIEWERS_COLLECTION);
      const q = query(reviewersRef, where('code', '==', cleanCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          success: false,
          error: 'Reviewer code not found'
        };
      }

      // Get the first (and should be only) matching reviewer
      const reviewerDoc = querySnapshot.docs[0];
      const reviewerData = reviewerDoc.data();

      // Check if reviewer is active
      if (!reviewerData.isActive) {
        return {
          success: false,
          error: 'Reviewer account is inactive'
        };
      }

      // Return successful authentication with reviewer data
      const reviewer: ReviewerAuthData = {
        id: reviewerDoc.id,
        code: reviewerData.code,
        name: reviewerData.name || 'Unknown Reviewer',
        email: reviewerData.email || '',
        role: reviewerData.role || 'Reviewer',
        isActive: reviewerData.isActive,
        currentLoad: reviewerData.currentLoad || 0,
        createdAt: reviewerData.createdAt,
        updatedAt: reviewerData.updatedAt
      };

      return {
        success: true,
        reviewer
      };

    } catch (error) {
      console.error('Error validating reviewer code:', error);
      return {
        success: false,
        error: 'Failed to validate reviewer code. Please try again.'
      };
    }
  }

  /**
   * Get reviewer by ID
   * @param reviewerId - The reviewer ID
   * @returns ReviewerAuthData or null if not found
   */
  async getReviewerById(reviewerId: string): Promise<ReviewerAuthData | null> {
    try {
      const reviewerRef = doc(db, REVIEWERS_COLLECTION, reviewerId);
      const reviewerSnap = await getDoc(reviewerRef);

      if (!reviewerSnap.exists()) {
        return null;
      }

      const reviewerData = reviewerSnap.data();
      return {
        id: reviewerSnap.id,
        code: reviewerData.code,
        name: reviewerData.name || 'Unknown Reviewer',
        email: reviewerData.email || '',
        role: reviewerData.role || 'Reviewer',
        isActive: reviewerData.isActive,
        currentLoad: reviewerData.currentLoad || 0,
        createdAt: reviewerData.createdAt,
        updatedAt: reviewerData.updatedAt
      };
    } catch (error) {
      console.error('Error fetching reviewer by ID:', error);
      return null;
    }
  }

  /**
   * Get all assigned protocols for a reviewer (excludes reassigned ones)
   * @param reviewerId - The reviewer ID
   * @returns Array of assigned protocols
   */
  async getAssignedProtocols(reviewerId: string): Promise<any[]> {
    try {
      const assignedProtocols = [];

      // Check submissions collection - all protocols are now in one unified collection
      const protocolsRef = collection(db, 'submissions');
      const protocolsSnapshot = await getDocs(protocolsRef);
      
      for (const protocolDoc of protocolsSnapshot.docs) {
        const protocolId = protocolDoc.id;
        
        // Check if this reviewer is assigned to this protocol
        const reviewersRef = collection(db, 'submissions', protocolId, 'reviewers');
        const reviewersSnapshot = await getDocs(reviewersRef);
        
        const reviewerAssignment = reviewersSnapshot.docs.find(doc => 
          doc.data().reviewerId === reviewerId
        );

        if (reviewerAssignment) {
          const protocolData = protocolDoc.data();
          const assignmentData = reviewerAssignment.data();
            
          // Skip if this assignment was reassigned away from this reviewer
          // Check if there's a reassignment history where this reviewer was removed
          const reassignmentHistoryRef = collection(db, 'submissions', protocolId, 'reassignment_history');
          const reassignmentSnapshot = await getDocs(reassignmentHistoryRef);
          
          let wasReassigned = false;
          for (const reassignmentDoc of reassignmentSnapshot.docs) {
            const reassignmentData = reassignmentDoc.data();
            if (reassignmentData.oldReviewerId === reviewerId) {
              wasReassigned = true;
              break;
            }
          }
          
          // Skip protocols that were reassigned away from this reviewer
          if (wasReassigned) {
            continue;
          }
          
          // Check for assessment form status
          const assignmentId = reviewerAssignment.id;
          const assessmentFormsRef = collection(db, 'submissions', protocolId, 'reviewers', assignmentId, 'assessment_forms');
          const assessmentFormsSnapshot = await getDocs(assessmentFormsRef);
          
          let assessmentStatus = null;
          if (!assessmentFormsSnapshot.empty) {
            // Get the first assessment form (usually there's only one per assignment)
            const assessmentForm = assessmentFormsSnapshot.docs[0].data();
            assessmentStatus = assessmentForm.status; // 'draft', 'submitted', 'approved', etc.
          }
          
          // Determine status with sensible defaults:
          // - Use assessment status if present
          // - Otherwise treat undefined/initial as "draft" (instead of "pending") to reflect no work yet
          // - If assignment has a more specific reviewStatus (not pending), use it
          // - Override with protocol terminal statuses
          let status = 'draft';
          if (assessmentStatus) {
            status = assessmentStatus;
          } else if (assignmentData.reviewStatus && assignmentData.reviewStatus !== 'pending') {
            status = assignmentData.reviewStatus;
          }

          const protocolStatus = protocolData.status;
          if (protocolStatus === 'approved' || protocolStatus === 'disapproved') {
            status = protocolStatus;
          }
          
          assignedProtocols.push({
            protocolId,
            protocolTitle: protocolData.information?.general_information?.protocol_title || protocolData.title || 'Untitled Protocol',
            spupCode: protocolData.spupCode || 'No Code',
            researchType: protocolData.information?.general_information?.nature_and_type_of_study?.type || 'Unknown',
            assessmentType: assignmentData.assessmentType || 'Assessment',
            assignedAt: assignmentData.assignedAt,
            deadline: assignmentData.deadline,
            status: status,
            assessmentStatus: assessmentStatus, // Store assessment status separately for reference
            principalInvestigator: protocolData.information?.general_information?.principal_investigator?.name || 'Unknown',
            submissionDate: protocolData.submittedAt,
            protocolStatus: protocolStatus // Add protocol status for reference
          });
        }
      }

      // Sort by assignment date (newest first)
      return assignedProtocols.sort((a, b) => {
        const dateA = toDate(a.assignedAt);
        const dateB = toDate(b.assignedAt);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

    } catch (error) {
      console.error('Error fetching assigned protocols:', error);
      return [];
    }
  }

  /**
   * Get reassigned protocols for a reviewer (protocols they were removed from)
   * @param reviewerId - The reviewer ID
   * @returns Array of reassigned protocols
   */
  async getReassignedProtocols(reviewerId: string): Promise<any[]> {
    try {
      const reassignedProtocols = [];
      
      // Query all submissions
      const submissionsRef = collection(db, 'submissions');
      const submissionsSnapshot = await getDocs(submissionsRef);
      
      for (const submissionDoc of submissionsSnapshot.docs) {
        const protocolId = submissionDoc.id;
        const protocolData = submissionDoc.data();
        
        // Check reassignment_history subcollection
        const reassignmentHistoryRef = collection(db, 'submissions', protocolId, 'reassignment_history');
        const reassignmentHistorySnapshot = await getDocs(reassignmentHistoryRef);
        
        for (const reassignmentDoc of reassignmentHistorySnapshot.docs) {
          const reassignmentData = reassignmentDoc.data();
          
          // If this reviewer was the old reviewer (removed)
          if (reassignmentData.oldReviewerId === reviewerId) {
            reassignedProtocols.push({
              protocolId,
              protocolTitle: protocolData.information?.general_information?.protocol_title || protocolData.title || 'Untitled Protocol',
              spupCode: protocolData.spupCode || 'No Code',
              originalDeadline: reassignmentData.originalDeadline,
              reassignedAt: reassignmentData.reassignedAt,
              reason: reassignmentData.reason,
              assessmentType: reassignmentData.assessmentType,
              daysOverdue: reassignmentData.daysOverdue,
              researchType: protocolData.information?.general_information?.nature_and_type_of_study?.type || 'Unknown',
              principalInvestigator: protocolData.information?.general_information?.principal_investigator?.name || 'Unknown'
            });
          }
        }
      }
      
      // Sort by reassignment date (newest first)
      return reassignedProtocols.sort((a, b) => {
        const dateA = toDate(a.reassignedAt);
        const dateB = toDate(b.reassignedAt);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error fetching reassigned protocols:', error);
      return [];
    }
  }
}

// Export singleton instance
export const reviewerAuthService = new ReviewerAuthService();

// Export utility functions
export const validateReviewerCode = reviewerAuthService.validateReviewerCode.bind(reviewerAuthService);
export const getReviewerById = reviewerAuthService.getReviewerById.bind(reviewerAuthService);
export const getAssignedProtocols = reviewerAuthService.getAssignedProtocols.bind(reviewerAuthService);
export const getReassignedProtocols = reviewerAuthService.getReassignedProtocols.bind(reviewerAuthService);
