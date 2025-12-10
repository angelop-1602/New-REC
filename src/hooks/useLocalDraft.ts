import { useState, useCallback, useRef, useEffect } from 'react';
import { customToast } from '@/components/ui/custom/toast';
import { toDate } from '@/types';

interface UseLocalDraftProps {
  protocolId: string;
  formType: string;
  reviewerId: string;
  onSubmissionSuccess?: () => void;
  skipFirebaseLoad?: boolean; // Skip Firebase loading if data is already provided
}

export const useLocalDraft = ({
  protocolId,
  formType,
  reviewerId,
  onSubmissionSuccess,
  skipFirebaseLoad = false,
}: UseLocalDraftProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFormDataRef = useRef<any>(null);

  // Generate localStorage key
  const getStorageKey = useCallback(() => {
    return `draft_${protocolId}_${formType}_${reviewerId}`;
  }, [protocolId, formType, reviewerId]);

  // Load existing assessment data (Firebase first, then localStorage)
  const loadDraft = useCallback(async () => {
    try {
      // Skip Firebase loading if data is already provided from parent component
      if (skipFirebaseLoad) {
        return null;
      }

      // First, try to load from Firebase
      const { default: AssessmentSubmissionService } = await import('@/lib/services/assessments/assessmentSubmissionService');
      const existingAssessment = await AssessmentSubmissionService.getAssessment(protocolId, formType, reviewerId);
      
      if (existingAssessment && existingAssessment.formData) {
        setLastSaved(toDate(existingAssessment.submittedAt) || null);
        // Store in local storage as backup
        const storageKey = getStorageKey();
        const draftData = {
          formData: existingAssessment.formData,
          savedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
          protocolId,
          formType,
          reviewerId
        };
        localStorage.setItem(storageKey, JSON.stringify(draftData));
        return existingAssessment.formData;
      }
      
      // If no Firebase data, try localStorage
      const storageKey = getStorageKey();
      const savedDraft = localStorage.getItem(storageKey);
      
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        
        // Check if draft has expired
        if (draftData.expiresAt) {
          const expiryTime = new Date(draftData.expiresAt);
          const now = new Date();
          
          if (now > expiryTime) {
            localStorage.removeItem(storageKey);
            return null;
          }
        }
        
        setLastSaved(new Date(draftData.savedAt));
        return draftData.formData;
      }
    } catch (error) {
      console.error('❌ Error loading assessment data:', error);
    }
    return null;
  }, [getStorageKey, protocolId, formType, reviewerId, skipFirebaseLoad]);

  // Helper function to remove undefined values from object
  const removeUndefinedValues = useCallback((obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(removeUndefinedValues);
    }
    
    if (typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        if (value !== undefined) {
          acc[key] = typeof value === 'object' ? removeUndefinedValues(value) : value;
        }
        return acc;
      }, {} as any);
    }
    
    return obj;
  }, []);

  // Save draft to both localStorage and Firebase
  const saveDraftToLocal = useCallback(async (formData: any) => {
    try {
      // Remove undefined values to avoid Firebase errors
      const cleanedFormData = removeUndefinedValues(formData);
      
      // Save to localStorage
      const storageKey = getStorageKey();
      const draftData = {
        formData: cleanedFormData,
        savedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        protocolId,
        formType,
        reviewerId
      };
      
      localStorage.setItem(storageKey, JSON.stringify(draftData));
      setLastSaved(new Date());
      
      // Also save to Firebase with draft status
      try {
        const { default: AssessmentSubmissionService } = await import('@/lib/services/assessments/assessmentSubmissionService');
        await AssessmentSubmissionService.saveAssessment(
          protocolId,
          formType,
          cleanedFormData,
          reviewerId,
          'Reviewer', // Temporary reviewer name
          'draft'
        );
      } catch (firebaseError) {
        console.error('❌ Error saving draft to Firebase:', firebaseError);
        // Don't throw - localStorage save was successful
      }
      
      return true;
    } catch (error) {
      console.error('Error saving draft to localStorage:', error);
      return false;
    }
  }, [getStorageKey, protocolId, formType, reviewerId, removeUndefinedValues]);

  // Auto-save function with debouncing
  const autoSave = useCallback(async (formData: any) => {
    if (!protocolId || !formType || !reviewerId) return;
    
    // Skip auto-save if data hasn't changed
    if (JSON.stringify(formData) === JSON.stringify(lastFormDataRef.current)) {
      return;
    }

    lastFormDataRef.current = formData;
    setIsAutoSaving(true);

    try {
      const success = await saveDraftToLocal(formData);
      if (!success) {
        console.error('Auto-save failed: unable to persist draft locally');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [protocolId, formType, reviewerId, saveDraftToLocal]);

  // Debounced auto-save
  const debouncedAutoSave = useCallback((formData: any) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(formData);
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [autoSave]);

  // Manual save draft
  const saveDraft = useCallback(async (formData: any) => {
    try {
      const success = await saveDraftToLocal(formData);
      if (success) {
        customToast.success(
          'Draft Saved',
          'Your draft has been saved successfully.'
        );
      } else {
        customToast.error(
          'Save Failed',
          'Failed to save draft.'
        );
      }
    } catch (error) {
      console.error('Save draft failed:', error);
      customToast.error(
        'Save Failed',
        'Failed to save draft. Please try again.'
      );
    }
  }, [saveDraftToLocal]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
      setLastSaved(null);
      lastFormDataRef.current = null;
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [getStorageKey]);

  // Submit form (this will save to Firebase and clear localStorage)
  const submitForm = useCallback(async (formData: any) => {
    if (!protocolId || !formType || !reviewerId) {
      customToast.error(
        'Missing Information',
        'Missing required information for submission.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Import the service dynamically to avoid circular dependencies
      const { default: AssessmentSubmissionService } = await import('@/lib/services/assessments/assessmentSubmissionService');
      
      await AssessmentSubmissionService.submitAssessment(
        protocolId,
        formType,
        formData,
        reviewerId,
        'Reviewer' // We'll get the actual name from the form data or context
      );

      // Clear the draft from localStorage after successful submission
      clearDraft();
      
      customToast.success(
        'Assessment Submitted',
        'Your assessment has been submitted successfully.'
      );
      
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (error) {
      console.error('Submission failed:', error);
      customToast.error(
        'Submission Failed',
        'Failed to submit assessment. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [protocolId, formType, reviewerId, clearDraft, onSubmissionSuccess]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSubmitting,
    isAutoSaving,
    lastSaved,
    submitForm,
    saveDraft,
    autoSave: debouncedAutoSave,
    loadDraft,
    clearDraft,
  };
};

export default useLocalDraft;
