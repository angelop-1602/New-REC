import { doc, setDoc, updateDoc, serverTimestamp, collection, getDocs, getDoc, query, where } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';

const db = getFirestore(firebaseApp);

export interface AssessmentSubmissionData {
  protocolId: string;
  reviewerId: string;
  reviewerName: string;
  formType: string;
  formData: any;
  status: 'draft' | 'submitted' | 'approved' | 'returned';
  submittedAt?: any;
  approvedAt?: any;
  returnedAt?: any;
  rejectionReason?: string;
}

export class AssessmentSubmissionService {
  /**
   * Save assessment form data to Firestore
   */
  static async saveAssessment(
    protocolId: string,
    formType: string,
    formData: any,
    reviewerId: string,
    reviewerName: string,
    status: 'draft' | 'submitted' = 'draft'
  ): Promise<void> {
    try {
      const assessmentData: AssessmentSubmissionData = {
        protocolId,
        reviewerId,
        reviewerName,
        formType,
        formData,
        status,
        submittedAt: status === 'submitted' ? serverTimestamp() : null,
      };

      // Find reviewer assignment doc to scope assessment per reviewer
      const reviewersRef = collection(db, 'submissions', protocolId, 'reviewers');
      const reviewersSnapshot = await getDocs(reviewersRef);
      const reviewerAssignment = reviewersSnapshot.docs.find(d => d.data().reviewerId === reviewerId);

      if (!reviewerAssignment) {
        throw new Error('Reviewer assignment not found for saveAssessment');
      }

      // Save to submissions/{protocolId}/reviewers/{assignmentId}/assessment_forms/{formType}
      const assessmentRef = doc(db, 'submissions', protocolId, 'reviewers', reviewerAssignment.id, 'assessment_forms', formType);
      await setDoc(assessmentRef, assessmentData, { merge: true });

      console.log('✅ Assessment saved successfully:', { protocolId, formType, status });
    } catch (error) {
      console.error('❌ Error saving assessment:', error);
      throw new Error('Failed to save assessment');
    }
  }

  /**
   * Submit assessment form (change status from draft to submitted)
   */
  static async submitAssessment(
    protocolId: string,
    formType: string,
    formData: any,
    reviewerId: string,
    reviewerName: string
  ): Promise<void> {
    try {
      const assessmentData: AssessmentSubmissionData = {
        protocolId,
        reviewerId,
        reviewerName,
        formType,
        formData,
        status: 'submitted',
        submittedAt: serverTimestamp(),
      };

      // Update reviewer assignment status - find the correct document by reviewerId
      const reviewersRef = collection(db, 'submissions', protocolId, 'reviewers');
      const reviewersSnapshot = await getDocs(reviewersRef);
      const reviewerAssignment = reviewersSnapshot.docs.find(doc => doc.data().reviewerId === reviewerId);

      if (reviewerAssignment) {
        // Save to submissions/{protocolId}/reviewers/{assignmentId}/assessment_forms/{formType}
        const assessmentRef = doc(db, 'submissions', protocolId, 'reviewers', reviewerAssignment.id, 'assessment_forms', formType);
        await setDoc(assessmentRef, assessmentData, { merge: true });

        await updateDoc(reviewerAssignment.ref, {
          reviewStatus: 'completed',
          completedAt: serverTimestamp(),
        });
        console.log('✅ Reviewer assignment status updated successfully');
      } else {
        console.warn('⚠️ Reviewer assignment not found for reviewerId:', reviewerId);
        // Don't throw error - assessment is still saved successfully
      }

      console.log('✅ Assessment submitted successfully:', { protocolId, formType });
    } catch (error) {
      console.error('❌ Error submitting assessment:', error);
      throw new Error('Failed to submit assessment');
    }
  }

  /**
   * Get existing assessment data
   */
  static async getAssessment(
    protocolId: string,
    formType: string,
    reviewerId: string
  ): Promise<AssessmentSubmissionData | null> {
    try {
      // Find reviewer assignment first
      const reviewersRef = collection(db, 'submissions', protocolId, 'reviewers');
      const reviewersSnapshot = await getDocs(reviewersRef);
      const reviewerAssignment = reviewersSnapshot.docs.find(d => d.data().reviewerId === reviewerId);
      if (!reviewerAssignment) {
        return null;
      }

      const assessmentRef = doc(db, 'submissions', protocolId, 'reviewers', reviewerAssignment.id, 'assessment_forms', formType);
      const assessmentSnap = await getDoc(assessmentRef);
      
      if (assessmentSnap.exists()) {
        return assessmentSnap.data() as AssessmentSubmissionData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting assessment:', error);
      return null;
    }
  }

  /**
   * Auto-save draft
   */
  static async autoSaveDraft(
    protocolId: string,
    formType: string,
    formData: any,
    reviewerId: string,
    reviewerName: string
  ): Promise<void> {
    try {
      await this.saveAssessment(protocolId, formType, formData, reviewerId, reviewerName, 'draft');
    } catch (error) {
      console.error('❌ Error auto-saving draft:', error);
      // Don't throw error for auto-save failures
    }
  }
}

export default AssessmentSubmissionService;
