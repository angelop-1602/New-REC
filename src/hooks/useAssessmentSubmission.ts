import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import AssessmentSubmissionService from '@/lib/services/assessments/assessmentSubmissionService';

interface UseAssessmentSubmissionProps {
  protocolId: string;
  formType: string;
  reviewerId: string;
  reviewerName: string;
  onSubmissionSuccess?: () => void;
}

export const useAssessmentSubmission = ({
  protocolId,
  formType,
  reviewerId,
  reviewerName,
  onSubmissionSuccess,
}: UseAssessmentSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFormDataRef = useRef<any>(null);

  // Auto-save function with debouncing
  const autoSave = useCallback(async (formData: any) => {
    if (!protocolId || !formType || !reviewerId || !reviewerName) return;
    
    // Skip auto-save if data hasn't changed
    if (JSON.stringify(formData) === JSON.stringify(lastFormDataRef.current)) {
      return;
    }

    lastFormDataRef.current = formData;
    setIsAutoSaving(true);

    try {
      await AssessmentSubmissionService.autoSaveDraft(
        protocolId,
        formType,
        formData,
        reviewerId,
        reviewerName
      );
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [protocolId, formType, reviewerId, reviewerName]);

  // Debounced auto-save
  const debouncedAutoSave = useCallback((formData: any) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(formData);
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [autoSave]);

  // Submit form
  const submitForm = useCallback(async (formData: any) => {
    if (!protocolId || !formType || !reviewerId || !reviewerName) {
      toast.error('Missing required information for submission');
      return;
    }

    setIsSubmitting(true);

    try {
      await AssessmentSubmissionService.submitAssessment(
        protocolId,
        formType,
        formData,
        reviewerId,
        reviewerName
      );

      toast.success('Assessment submitted successfully!');
      setLastSaved(new Date());
      
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [protocolId, formType, reviewerId, reviewerName, onSubmissionSuccess]);

  // Save draft
  const saveDraft = useCallback(async (formData: any) => {
    if (!protocolId || !formType || !reviewerId || !reviewerName) return;

    try {
      await AssessmentSubmissionService.saveAssessment(
        protocolId,
        formType,
        formData,
        reviewerId,
        reviewerName,
        'draft'
      );
      
      toast.success('Draft saved successfully!');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save draft failed:', error);
      toast.error('Failed to save draft. Please try again.');
    }
  }, [protocolId, formType, reviewerId, reviewerName]);

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
  };
};

export default useAssessmentSubmission;
