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

      // Clean and normalize the code - remove all whitespace and convert to uppercase
      const cleanCode = code.trim().replace(/\s+/g, '').toUpperCase();

      // More flexible format validation - allows 1-4 digits instead of exactly 3
      // Pattern: 2-8 uppercase letters, hyphen, 1-4 digits
      const codePattern = /^[A-Z]{2,8}-\d{1,4}$/;
      if (!codePattern.test(cleanCode)) {
        console.warn('Code format validation warning for:', cleanCode, '- but will still attempt query');
        // Don't fail here - still try to query in case format in DB is different
      }

      // Query Firestore for the reviewer with this code (case-sensitive exact match)
      const reviewersRef = collection(db, REVIEWERS_COLLECTION);
      let q = query(reviewersRef, where('code', '==', cleanCode));
      let querySnapshot = await getDocs(q);

      // If exact match fails, try a few variations
      if (querySnapshot.empty) {
        console.log('Exact match failed for code:', cleanCode, '- trying variations');
        
        // Try variations: with/without spaces, different case handling
        const variations = [
          cleanCode,
          cleanCode.replace(/-/g, ' '), // Try with space instead of hyphen
          cleanCode.replace(/\s+/g, '-'), // Try with hyphen instead of space
        ];

        for (const variation of variations) {
          if (variation === cleanCode) continue; // Already tried
          
          q = query(reviewersRef, where('code', '==', variation));
          querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            console.log('Found match with variation:', variation);
            break;
          }
        }
      }

      // If still empty, try case-insensitive search by fetching all and comparing
      // This is a fallback for when codes in DB have different case/formatting
      if (querySnapshot.empty) {
        console.warn('All query variations failed for code:', cleanCode, '- attempting case-insensitive fallback');
        
        const allReviewersSnapshot = await getDocs(reviewersRef);
        let foundReviewer = null;
        
        for (const doc of allReviewersSnapshot.docs) {
          const data = doc.data();
          const dbCode = String(data.code || '').trim();
          
          // Normalize both codes for comparison (remove hyphens/spaces, uppercase)
          const normalizedInput = cleanCode.replace(/[-\s]/g, '').toUpperCase();
          const normalizedDb = dbCode.replace(/[-\s]/g, '').toUpperCase();
          
          if (normalizedInput === normalizedDb) {
            foundReviewer = { doc, data };
            console.log('Found reviewer with case-insensitive match. DB code:', dbCode, 'Input:', cleanCode);
            break;
          }
        }
        
        if (!foundReviewer) {
          console.error('Reviewer code not found after all attempts:', cleanCode);
          return {
            success: false,
            error: 'Reviewer code not found. Please verify your code and try again.'
          };
        }
        
        const reviewerDoc = foundReviewer.doc;
        const reviewerData = foundReviewer.data;
        
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
      console.log('Fetching assigned protocols for reviewerId:', reviewerId);
      const assignedProtocols = [];

      // Check submissions collection - all protocols are now in one unified collection
      const protocolsRef = collection(db, 'submissions');
      let protocolsSnapshot;
      
      try {
        protocolsSnapshot = await getDocs(protocolsRef);
        console.log(`Found ${protocolsSnapshot.docs.length} total protocols to check`);
      } catch (error) {
        console.error('Error fetching protocols collection:', error);
        throw error;
      }
      
      for (const protocolDoc of protocolsSnapshot.docs) {
        const protocolId = protocolDoc.id;
        
        try {
          // Check if this reviewer is assigned to this protocol
          const reviewersRef = collection(db, 'submissions', protocolId, 'reviewers');
          const reviewersSnapshot = await getDocs(reviewersRef);
          
          const reviewerAssignment = reviewersSnapshot.docs.find(doc => {
            const data = doc.data();
            const assignmentReviewerId = String(data.reviewerId || '');
            const searchReviewerId = String(reviewerId);
            return assignmentReviewerId === searchReviewerId;
          });

          if (reviewerAssignment) {
            console.log(`Found assignment for reviewer ${reviewerId} in protocol ${protocolId}`);
            const protocolData = protocolDoc.data();
            const assignmentData = reviewerAssignment.data();
            
            // Skip if this assignment was reassigned away from this reviewer
            // Check if there's a reassignment history where this reviewer was removed
            try {
              const reassignmentHistoryRef = collection(db, 'submissions', protocolId, 'reassignment_history');
              const reassignmentSnapshot = await getDocs(reassignmentHistoryRef);
              
              let wasReassigned = false;
              for (const reassignmentDoc of reassignmentSnapshot.docs) {
                const reassignmentData = reassignmentDoc.data();
                const oldReviewerId = String(reassignmentData.oldReviewerId || '');
                if (oldReviewerId === String(reviewerId)) {
                  wasReassigned = true;
                  break;
                }
              }
              
              // Skip protocols that were reassigned away from this reviewer
              if (wasReassigned) {
                console.log(`Protocol ${protocolId} was reassigned away from reviewer ${reviewerId}`);
                continue;
              }
            } catch (reassignError) {
              // If we can't check reassignment history, continue anyway
              console.warn(`Could not check reassignment history for protocol ${protocolId}:`, reassignError);
            }
            
            // Check for assessment form status
            const assignmentId = reviewerAssignment.id;
            let assessmentStatus = null;
            try {
              const assessmentFormsRef = collection(db, 'submissions', protocolId, 'reviewers', assignmentId, 'assessment_forms');
              const assessmentFormsSnapshot = await getDocs(assessmentFormsRef);
              
              if (!assessmentFormsSnapshot.empty) {
                // Get the first assessment form (usually there's only one per assignment)
                const assessmentForm = assessmentFormsSnapshot.docs[0].data();
                assessmentStatus = assessmentForm.status; // 'draft', 'submitted', 'approved', etc.
              }
            } catch (assessmentError) {
              // If we can't check assessment forms, continue without status
              console.warn(`Could not check assessment forms for protocol ${protocolId}:`, assessmentError);
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
        } catch (protocolError) {
          // Log error but continue checking other protocols
          console.warn(`Error processing protocol ${protocolId}:`, protocolError);
          continue;
        }
      }

      console.log(`Found ${assignedProtocols.length} assigned protocols for reviewer ${reviewerId}`);
      
      // Sort by assignment date (newest first)
      return assignedProtocols.sort((a, b) => {
        const dateA = toDate(a.assignedAt);
        const dateB = toDate(b.assignedAt);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

    } catch (error) {
      console.error('Error fetching assigned protocols:', error);
      // Return empty array instead of throwing to prevent UI crashes
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
