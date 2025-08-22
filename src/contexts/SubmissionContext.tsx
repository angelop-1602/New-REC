"use client";

import React, { createContext, useContext, useEffect, useCallback, useRef } from "react";
import { InformationType } from "@/types/information.types";
import { DocumentsType } from "@/types/documents.types";
import { 
  useSubmissionFormReducer, 
  FormState, 
  FormAction 
} from "@/hooks/useSubmissionFormReducer";
import { 
  saveDraft, 
  loadDraft, 
  clearDraft, 
  hasDraft, 
  getDraftAge 
} from "@/utils/localStorageManager";
import { 
  createCompleteSubmission,
  updateSubmission, 
  submitDraft,
} from "@/lib/firebase/firestore";
import { 
  SubmissionSummary,
  SubmissionConfirmationDialog 
} from "@/components/ui/custom/submission-confirmation-dialog";
import { customToast } from "@/components/ui/custom/toast";
import { useAuth } from "@/contexts/AuthContext";
import { validateForm, informationFormValidation } from "@/lib/validation/form-validation";

// Enhanced context interface
export interface SubmissionContextType {
  // Form state
  formData: InformationType;
  documents: DocumentsType[];
  currentStep: number;
  totalSteps: number;
  
  // Validation state
  errors: Record<string, string[]>;
  touchedFields: Set<string>;
  isFormValid: boolean;
  
  // UI state
  isSubmitting: boolean;
  submissionError: string | null;
  showConfirmDialog: boolean;
  submissionSuccess: boolean;
  submissionId: string | null;
  
  // Navigation
  canProceed: boolean;
  canGoBack: boolean;
  
  // Form operations
  updateField: (fieldPath: string, value: any) => void;
  getFieldValue: (fieldPath: string) => any;
  getFieldValidation: (fieldPath: string) => {
    isValid: boolean;
    errors: string[];
    isTouched: boolean;
    shouldShowError: boolean;
  };
  
  // Co-researchers management
  addCoResearcher: () => void;
  removeCoResearcher: (index: number) => void;
  updateCoResearcher: (index: number, name: string) => void;
  
  // Documents management
  addDocument: (document: DocumentsType) => void;
  removeDocument: (documentId: string) => void;
  updateDocument: (documentId: string, updates: Partial<DocumentsType>) => void;
  
  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Field validation (for components)
  registerFieldValidation: (fieldPath: string, callback: (force?: boolean) => void) => void;
  unregisterFieldValidation: (fieldPath: string) => void;
  handleFieldValidation: (fieldPath: string, isValid: boolean, errors: string[]) => void;
  
  // Form validation
  validateAllFields: () => boolean;
  forceValidateAllFields: () => boolean;
  setFieldTouched: (fieldPath: string) => void;
  
  // Draft operations (hidden from UI)
  saveCurrentDraft: () => boolean;
  loadDraftData: () => boolean;
  clearDraftData: () => void;
  
  // Submission operations
  showSubmissionDialog: () => void;
  hideSubmissionDialog: () => void;
  submitApplication: () => void;
  getSubmissionSummary: () => SubmissionSummary;
  
  // Reset
  resetForm: () => void;
}

// Create context
const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined);

// Custom hook to use the context
export const useSubmissionContext = () => {
  const context = useContext(SubmissionContext);
  if (context === undefined) {
    throw new Error("useSubmissionContext must be used within a SubmissionProvider");
  }
  return context;
};

// Provider props
export interface SubmissionProviderProps {
  children: React.ReactNode;
  onComplete?: (submissionId: string) => void;
  onError?: (error: string) => void;
}

// Provider component
export const SubmissionProvider: React.FC<SubmissionProviderProps> = ({
  children,
  onComplete,
  onError,
}) => {
  const { user } = useAuth();
  const { 
    state, 
    dispatch, 
    getFieldValue, 
    getFieldValidation, 
    isCurrentStepValid,
    canProceed,
    canGoBack 
  } = useSubmissionFormReducer();

  // Refs for field validation callbacks
  const fieldValidationCallbacks = useRef<Record<string, (force?: boolean) => void>>({});

  // Auto-save to localStorage on form changes
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-save draft to localStorage when form data changes
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      saveDraft(state);
      dispatch({ type: "MARK_DRAFT_SAVED" });
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [state.formData, state.documents, state.currentStep]);

  // Load draft on mount (silently)
  useEffect(() => {
    const draftData = loadDraft();
    if (draftData) {
      dispatch({ type: "LOAD_FROM_LOCALSTORAGE", payload: draftData });
    }
  }, []);

  // Form field operations
  const updateField = useCallback((fieldPath: string, value: any) => {
    dispatch({ type: "SET_FIELD_VALUE", payload: { fieldPath, value } });
    dispatch({ type: "SET_FIELD_TOUCHED", payload: fieldPath });
  }, [dispatch]);

  // Co-researchers management
  const addCoResearcher = useCallback(() => {
    dispatch({ type: "ADD_CO_RESEARCHER" });
  }, [dispatch]);

  const removeCoResearcher = useCallback((index: number) => {
    dispatch({ type: "REMOVE_CO_RESEARCHER", payload: index });
  }, [dispatch]);

  const updateCoResearcher = useCallback((index: number, name: string) => {
    dispatch({ type: "UPDATE_CO_RESEARCHER", payload: { index, name } });
  }, [dispatch]);

  // Documents management
  const addDocument = useCallback((document: DocumentsType) => {
    dispatch({ type: "ADD_DOCUMENT", payload: document });
  }, [dispatch]);

  const removeDocument = useCallback((documentId: string) => {
    dispatch({ type: "REMOVE_DOCUMENT", payload: documentId });
  }, [dispatch]);

  const updateDocument = useCallback((documentId: string, updates: Partial<DocumentsType>) => {
    dispatch({ type: "UPDATE_DOCUMENT", payload: { id: documentId, updates } });
  }, [dispatch]);

  // Field validation for components
  const registerFieldValidation = useCallback((
    fieldPath: string, 
    callback: (force?: boolean) => void
  ) => {
    fieldValidationCallbacks.current[fieldPath] = callback;
  }, []);

  const unregisterFieldValidation = useCallback((fieldPath: string) => {
    delete fieldValidationCallbacks.current[fieldPath];
  }, []);

  const handleFieldValidation = useCallback((
    fieldPath: string, 
    isValid: boolean, 
    errors: string[]
  ) => {
    dispatch({ type: "SET_FIELD_ERROR", payload: { fieldPath, errors } });
  }, [dispatch]);

  // Form validation
  const validateAllFields = useCallback(() => {
    // Calculate validation result synchronously
    const formValidationResult = validateForm(state.formData, informationFormValidation);
    
    // Dispatch the validation to update the state
    dispatch({ type: "VALIDATE_FORM" });
    
    // Return the synchronous validation result
    return formValidationResult.isValid;
  }, [dispatch, state.formData]);

  const forceValidateAllFields = useCallback(() => {
    // Calculate validation result synchronously
    const formValidationResult = validateForm(state.formData, informationFormValidation);
    
    // Dispatch the validation to update the state
    dispatch({ type: "FORCE_VALIDATE_ALL_FIELDS" });
    
    // Trigger validation on all registered field components
    Object.values(fieldValidationCallbacks.current).forEach(callback => {
      callback(true);
    });
    
    // Return the synchronous validation result
    return formValidationResult.isValid;
  }, [dispatch, state.formData]);

  // Navigation
  const goToStep = useCallback((step: number) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  }, [dispatch]);

  const nextStep = useCallback(() => {
    // Validate current step before proceeding
    const isValid = forceValidateAllFields();
    if (isValid) {
      dispatch({ type: "NEXT_STEP" });
    } else {
      customToast.error(
        "Validation Failed", 
        "Please complete all required fields before proceeding."
      );
    }
  }, [forceValidateAllFields]);

  const previousStep = useCallback(() => {
    dispatch({ type: "PREVIOUS_STEP" });
  }, [dispatch]);

  const setFieldTouched = useCallback((fieldPath: string) => {
    dispatch({ type: "SET_FIELD_TOUCHED", payload: fieldPath });
  }, [dispatch]);

  // Draft operations
  const saveCurrentDraft = useCallback(() => {
    return saveDraft(state);
  }, [state]);

  const loadDraftData = useCallback(() => {
    const draftData = loadDraft();
    if (draftData) {
      dispatch({ type: "LOAD_FROM_LOCALSTORAGE", payload: draftData });
      return true;
    }
    return false;
  }, [dispatch]);

  const clearDraftData = useCallback(() => {
    clearDraft();
    dispatch({ type: "RESET_FORM" });
  }, [dispatch]);

  // Submission operations
  const showSubmissionDialog = useCallback(() => {
    dispatch({ type: "SHOW_CONFIRM_DIALOG", payload: true });
  }, [dispatch]);

  const hideSubmissionDialog = useCallback(() => {
    dispatch({ type: "SHOW_CONFIRM_DIALOG", payload: false });
  }, [dispatch]);

  const getSubmissionSummary = useCallback((): SubmissionSummary => {
    // Calculate form completion
    const allFields = Object.keys(state.errors);
    const completedFields = allFields.filter(field => !state.errors[field] || state.errors[field].length === 0);
    
    // Calculate document completion
    const requiredDocuments = 5; // This should be dynamic based on requirements
    const uploadedDocuments = state.documents.length;

    return {
      formData: state.formData,
      documents: state.documents,
      totalFields: allFields.length,
      completedFields: completedFields.length,
      requiredDocuments,
      uploadedDocuments,
    };
  }, [state.formData, state.documents, state.errors]);

  const submitApplication = useCallback(async () => {
    if (!user) {
      const error = "User not authenticated";
      dispatch({ type: "SET_SUBMISSION_ERROR", payload: error });
      onError?.(error);
      return;
    }

    try {
      dispatch({ type: "SET_SUBMITTING", payload: true });

      // Create complete submission with documents in one transaction
      const submissionId = await createCompleteSubmission(
        user.uid, 
        state.formData, 
        state.documents
      );

      // Clear localStorage draft after successful submission
      clearDraft();

      // Update state
      dispatch({ type: "SET_SUBMITTING", payload: false });
      dispatch({ type: "SHOW_CONFIRM_DIALOG", payload: false });
      
      // Show success and call completion callback
      onComplete?.(submissionId);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Submission failed";
      dispatch({ type: "SET_SUBMISSION_ERROR", payload: errorMessage });
      dispatch({ type: "SET_SUBMITTING", payload: false });
      onError?.(errorMessage);
    }
  }, [user, state.formData, state.documents, onComplete, onError, dispatch]);

  // Reset form
  const resetForm = useCallback(() => {
    dispatch({ type: "RESET_FORM" });
    clearDraft();
  }, [dispatch]);

  // Context value
  const contextValue: SubmissionContextType = {
    // Form state
    formData: state.formData,
    documents: state.documents,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    
    // Validation state
    errors: state.errors,
    touchedFields: state.touchedFields,
    isFormValid: state.isFormValid,
    
    // UI state
    isSubmitting: state.isSubmitting,
    submissionError: state.submissionError,
    showConfirmDialog: state.showConfirmDialog,
    submissionSuccess: false, // This would be derived from successful submission
    submissionId: null, // This would be set after successful submission
    
    // Navigation
    canProceed,
    canGoBack,
    
    // Form operations
    updateField,
    getFieldValue,
    getFieldValidation,
    
    // Co-researchers management
    addCoResearcher,
    removeCoResearcher,
    updateCoResearcher,
    
    // Documents management
    addDocument,
    removeDocument,
    updateDocument,
    
    // Navigation
    goToStep,
    nextStep,
    previousStep,
    
    // Field validation
    registerFieldValidation,
    unregisterFieldValidation,
    handleFieldValidation,
    
    // Form validation
    validateAllFields,
    forceValidateAllFields,
    setFieldTouched,
    
    // Draft operations
    saveCurrentDraft,
    loadDraftData,
    clearDraftData,
    
    // Submission operations
    showSubmissionDialog,
    hideSubmissionDialog,
    submitApplication,
    getSubmissionSummary,
    
    // Reset
    resetForm,
  };

  return (
    <SubmissionContext.Provider value={contextValue}>
      {children}
      <SubmissionConfirmationDialog
        isOpen={state.showConfirmDialog}
        onOpenChange={hideSubmissionDialog}
        onConfirm={submitApplication}
        onCancel={hideSubmissionDialog}
        isSubmitting={state.isSubmitting}
        submissionError={state.submissionError}
        submissionSuccess={false} // This would be managed by state
        submissionId={undefined} // This would come from successful submission
        summary={getSubmissionSummary()}
      />
    </SubmissionContext.Provider>
  );
}; 