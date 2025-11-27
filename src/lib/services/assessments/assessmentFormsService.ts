import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { getFirestore } from 'firebase/firestore';
import { 
  getAssessment,
  saveAssessment
} from '@/lib/services/core/unifiedDataService';
import { 
  Assessment as UnifiedAssessment,
  AssessmentFormType as UnifiedAssessmentFormType,
  AssessmentStatus as UnifiedAssessmentStatus
} from '@/types';

const db = getFirestore(firebaseApp);

// Legacy form types for backward compatibility
export type FormType = 'protocol-review' | 'informed-consent' | 'exemption-checklist' | 'iacuc-review';

// Legacy form status types for backward compatibility
export type FormStatus = 'draft' | 'submitted' | 'approved' | 'returned';

// Legacy assessment form data interface for backward compatibility
export interface AssessmentFormData {
  formType: FormType;
  reviewerId: string;
  reviewerName: string;
  protocolId: string;
  submittedAt?: Timestamp;
  formData: Record<string, any>;
  status: FormStatus;
  rejectionReason?: string;
  version: number;
  lastSavedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Form submission result
export interface FormSubmissionResult {
  success: boolean;
  message: string;
  formId?: string;
}

class AssessmentFormsService {
  private readonly COLLECTION_NAME = 'assessment_forms';
  private readonly SUBMISSIONS_COLLECTION = 'submissions';

  /**
   * Save form data as draft
   */
  async saveDraft(
    protocolId: string,
    formType: FormType,
    reviewerId: string,
    reviewerName: string,
    formData: Record<string, any>
  ): Promise<boolean> {
    try {
      // Find reviewer assignment doc to scope assessment per reviewer
      const reviewersRef = collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
      const reviewersSnapshot = await getDocs(reviewersRef);
      const reviewerAssignment = reviewersSnapshot.docs.find(d => d.data().reviewerId === reviewerId);

      if (!reviewerAssignment) {
        console.error('Reviewer assignment not found for saveDraft');
        return false;
      }

      // Save to submissions/{protocolId}/reviewers/{assignmentId}/assessment_forms/{formType}
      const formRef = doc(collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers', reviewerAssignment.id, this.COLLECTION_NAME), formType);
      
      await setDoc(formRef, {
        formType,
        reviewerId,
        reviewerName,
        protocolId,
        formData,
        status: 'draft',
        version: 1,
        lastSavedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ Draft saved successfully:', { protocolId, formType, status: 'draft' });
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  }

  /**
   * Submit form (final submission)
   */
  async submitForm(
    protocolId: string,
    formType: FormType,
    reviewerId: string,
    reviewerName: string,
    formData: Record<string, any>
  ): Promise<FormSubmissionResult> {
    try {
      // Find reviewer assignment doc to scope assessment per reviewer
      const reviewersRef = collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
      const reviewersSnapshot = await getDocs(reviewersRef);
      const reviewerAssignment = reviewersSnapshot.docs.find(d => d.data().reviewerId === reviewerId);

      if (!reviewerAssignment) {
        console.error('Reviewer assignment not found for submitForm');
        return {
          success: false,
          message: 'Reviewer assignment not found'
        };
      }

      // Save to submissions/{protocolId}/reviewers/{assignmentId}/assessment_forms/{formType}
      const formRef = doc(collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers', reviewerAssignment.id, this.COLLECTION_NAME), formType);
      
      // Get current form data to check version
      const currentForm = await getDoc(formRef);
      const currentVersion = currentForm.exists() ? (currentForm.data()?.version || 0) : 0;
      
      await setDoc(formRef, {
        formType,
        reviewerId,
        reviewerName,
        protocolId,
        formData,
        status: 'submitted',
        submittedAt: serverTimestamp(),
        version: currentVersion + 1,
        lastSavedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update protocol review status
      await this.updateProtocolReviewStatus(protocolId, reviewerId, formType);

      console.log('✅ Form submitted successfully:', { protocolId, formType, status: 'submitted' });
      return {
        success: true,
        message: 'Form submitted successfully',
        formId: formType
      };
    } catch (error) {
      console.error('Error submitting form:', error);
      return {
        success: false,
        message: 'Failed to submit form'
      };
    }
  }

  /**
   * Get form data for a specific protocol and form type
   */
  async getFormData(
    protocolId: string,
    formType: FormType,
    reviewerId?: string
  ): Promise<AssessmentFormData | null> {
    try {
      // If reviewerId provided, use the correct path under reviewer assignment
      if (reviewerId) {
        const reviewersRef = collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
        const reviewersSnapshot = await getDocs(reviewersRef);
        const reviewerAssignment = reviewersSnapshot.docs.find(d => d.data().reviewerId === reviewerId);

        if (!reviewerAssignment) {
          console.error('Reviewer assignment not found for getFormData');
          return null;
        }

        const formRef = doc(collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers', reviewerAssignment.id, this.COLLECTION_NAME), formType);
        const formDoc = await getDoc(formRef);
        
        if (formDoc.exists()) {
          return formDoc.data() as AssessmentFormData;
        }
        
        return null;
      }

      // Fallback to old path for backward compatibility (if no reviewerId provided)
      const formRef = doc(collection(db, this.SUBMISSIONS_COLLECTION, protocolId, this.COLLECTION_NAME), formType);
      const formDoc = await getDoc(formRef);
      
      if (formDoc.exists()) {
        return formDoc.data() as AssessmentFormData;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting form data:', error);
      return null;
    }
  }

  /**
   * Get all forms for a protocol
   */
  async getProtocolForms(protocolId: string): Promise<AssessmentFormData[]> {
    try {
      const formsRef = collection(db, this.SUBMISSIONS_COLLECTION, protocolId, this.COLLECTION_NAME);
      const formsSnapshot = await getDocs(formsRef);
      
      return formsSnapshot.docs.map(doc => doc.data() as AssessmentFormData);
    } catch (error) {
      console.error('Error getting protocol forms:', error);
      return [];
    }
  }

  /**
   * Get all forms submitted by a specific reviewer
   */
  async getReviewerForms(reviewerId: string): Promise<AssessmentFormData[]> {
    try {
      const formsRef = collection(db, this.SUBMISSIONS_COLLECTION);
      const protocolsSnapshot = await getDocs(formsRef);
      
      const allForms: AssessmentFormData[] = [];
      
      for (const protocolDoc of protocolsSnapshot.docs) {
        const protocolId = protocolDoc.id;
        const formsRef = collection(db, this.SUBMISSIONS_COLLECTION, protocolId, this.COLLECTION_NAME);
        const formsSnapshot = await getDocs(formsRef);
        
        const reviewerForms = formsSnapshot.docs
          .map(doc => doc.data() as AssessmentFormData)
          .filter(form => form.reviewerId === reviewerId);
        
        allForms.push(...reviewerForms);
      }
      
      return allForms;
    } catch (error) {
      console.error('Error getting reviewer forms:', error);
      return [];
    }
  }

  /**
  * Update form status (for chairperson approval/return)
   */
  async updateFormStatus(
    protocolId: string,
    formType: FormType,
    reviewerId: string,
    status: FormStatus,
    rejectionReason?: string
  ): Promise<boolean> {
    try {
      // Find reviewer assignment doc
      const reviewersRef = collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
      const reviewersSnapshot = await getDocs(reviewersRef);
      const reviewerAssignment = reviewersSnapshot.docs.find(d => d.data().reviewerId === reviewerId);

      if (!reviewerAssignment) {
        console.error('Reviewer assignment not found for updateFormStatus');
        return false;
      }

      const formRef = doc(collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers', reviewerAssignment.id, this.COLLECTION_NAME), formType);
      
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };
      
      if (status === 'returned' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      await updateDoc(formRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating form status:', error);
      return false;
    }
  }

  /**
   * Update protocol review status when form is submitted
   */
  private async updateProtocolReviewStatus(
    protocolId: string,
    reviewerId: string,
    formType: FormType
  ): Promise<void> {
    try {
      // Update the reviewer assignment status
      const reviewersRef = collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
      const reviewersSnapshot = await getDocs(reviewersRef);
      
      const reviewerAssignment = reviewersSnapshot.docs.find(doc => 
        doc.data().reviewerId === reviewerId
      );
      
      if (reviewerAssignment) {
        await updateDoc(reviewerAssignment.ref, {
          reviewStatus: 'completed',
          completedAt: serverTimestamp(),
          formType
        });
      }
    } catch (error) {
      console.error('Error updating protocol review status:', error);
    }
  }

  /**
   * Delete form data
   */
  async deleteForm(protocolId: string, formType: FormType, reviewerId: string): Promise<boolean> {
    try {
      // Find reviewer assignment doc
      const reviewersRef = collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
      const reviewersSnapshot = await getDocs(reviewersRef);
      const reviewerAssignment = reviewersSnapshot.docs.find(d => d.data().reviewerId === reviewerId);

      if (!reviewerAssignment) {
        console.error('Reviewer assignment not found for deleteForm');
        return false;
      }

      const formRef = doc(collection(db, this.SUBMISSIONS_COLLECTION, protocolId, 'reviewers', reviewerAssignment.id, this.COLLECTION_NAME), formType);
      await deleteDoc(formRef);
      return true;
    } catch (error) {
      console.error('Error deleting form:', error);
      return false;
    }
  }

  /**
   * Check if form exists and get its status
   */
  async getFormStatus(protocolId: string, formType: FormType, reviewerId?: string): Promise<FormStatus | null> {
    try {
      const formData = await this.getFormData(protocolId, formType, reviewerId);
      return formData?.status || null;
    } catch (error) {
      console.error('Error getting form status:', error);
      return null;
    }
  }
}

// Export singleton instance
export const assessmentFormsService = new AssessmentFormsService();
