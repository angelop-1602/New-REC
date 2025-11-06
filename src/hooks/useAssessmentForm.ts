import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { assessmentFormsService, FormType, FormStatus } from '@/lib/services/assessmentFormsService';
import { toast } from 'sonner';

interface UseAssessmentFormProps {
  protocolId: string;
  formType: FormType;
  reviewerId: string;
  reviewerName: string;
  defaultValues: Record<string, any>;
  onSubmit?: (data: any) => void;
}

interface UseAssessmentFormReturn {
  form: UseFormReturn<any>;
  isSaving: boolean;
  isSubmitting: boolean;
  lastSavedAt: Date | null;
  formStatus: FormStatus | null;
  saveDraft: () => Promise<void>;
  submitForm: () => Promise<void>;
  loadExistingForm: () => Promise<void>;
}

export function useAssessmentForm({
  protocolId,
  formType,
  reviewerId,
  reviewerName,
  defaultValues,
  onSubmit
}: UseAssessmentFormProps): UseAssessmentFormReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [formStatus, setFormStatus] = useState<FormStatus | null>(null);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFormDataRef = useRef<string>('');

  const form = useForm({
    defaultValues,
    mode: 'onChange'
  });

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (isSaving || isSubmitting) return;

    const currentFormData = JSON.stringify(form.getValues());
    
    // Only save if data has changed
    if (currentFormData === lastFormDataRef.current) return;

    setIsSaving(true);
    try {
      const formData = form.getValues();
      const success = await assessmentFormsService.saveDraft(
        protocolId,
        formType,
        reviewerId,
        reviewerName,
        formData
      );

      if (success) {
        setLastSavedAt(new Date());
        lastFormDataRef.current = currentFormData;
        toast.success('Draft saved automatically');
      } else {
        toast.error('Failed to save draft');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      toast.error('Auto-save failed');
    } finally {
      setIsSaving(false);
    }
  }, [protocolId, formType, reviewerId, reviewerName, form, isSaving, isSubmitting]);

  // Set up auto-save on form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save (30 seconds)
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 30000);
    });

    return () => {
      subscription.unsubscribe();
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [form, autoSave]);

  // Manual save draft
  const saveDraft = useCallback(async () => {
    if (isSaving || isSubmitting) return;

    setIsSaving(true);
    try {
      const formData = form.getValues();
      const success = await assessmentFormsService.saveDraft(
        protocolId,
        formType,
        reviewerId,
        reviewerName,
        formData
      );

      if (success) {
        setLastSavedAt(new Date());
        lastFormDataRef.current = JSON.stringify(formData);
        toast.success('Draft saved successfully');
      } else {
        toast.error('Failed to save draft');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [protocolId, formType, reviewerId, reviewerName, form, isSaving, isSubmitting]);

  // Submit form
  const submitForm = useCallback(async () => {
    if (isSubmitting) return;

    // Validate form
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      const result = await assessmentFormsService.submitForm(
        protocolId,
        formType,
        reviewerId,
        reviewerName,
        formData
      );

      if (result.success) {
        setFormStatus('submitted');
        setLastSavedAt(new Date());
        lastFormDataRef.current = JSON.stringify(formData);
        toast.success('Form submitted successfully');
        
        // Call custom onSubmit if provided
        if (onSubmit) {
          onSubmit(formData);
        }
      } else {
        toast.error(result.message || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Submit form error:', error);
      toast.error('Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  }, [protocolId, formType, reviewerId, reviewerName, form, isSubmitting, onSubmit]);

  // Load existing form data
  const loadExistingForm = useCallback(async () => {
    try {
      const existingForm = await assessmentFormsService.getFormData(protocolId, formType, reviewerId);
      
      if (existingForm) {
        // Load form data
        form.reset(existingForm.formData);
        setFormStatus(existingForm.status);
        setLastSavedAt(existingForm.lastSavedAt?.toDate() || null);
        lastFormDataRef.current = JSON.stringify(existingForm.formData);
        
        // Show status message
        if (existingForm.status === 'submitted') {
          toast.info('Form has been submitted. You can still edit until approved.');
        } else if (existingForm.status === 'approved') {
          toast.info('Form has been approved. No further edits allowed.');
        } else if (existingForm.status === 'returned') {
          toast.error(`Form was returned: ${existingForm.rejectionReason}`);
        }
      }
    } catch (error) {
      console.error('Load existing form error:', error);
      toast.error('Failed to load existing form data');
    }
  }, [protocolId, formType, reviewerId, form]);

  // Load existing form on mount
  useEffect(() => {
    loadExistingForm();
  }, [loadExistingForm]);

  return {
    form,
    isSaving,
    isSubmitting,
    lastSavedAt,
    formStatus,
    saveDraft,
    submitForm,
    loadExistingForm
  };
}
