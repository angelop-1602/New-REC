"use client";

import { useReducer, useCallback, useEffect } from "react";
import { InformationType } from "@/types/information.types";
import { DocumentsType } from "@/types/documents.types";
import { validateForm, validateField, informationFormValidation } from "@/lib/validation/form-validation";

// Form state interface
export interface FormState {
  // Form data
  formData: InformationType;
  documents: DocumentsType[];
  
  // UI state
  currentStep: number;
  totalSteps: number;
  
  // Validation state
  errors: Record<string, string[]>;
  touchedFields: Set<string>;
  isFormValid: boolean;
  
  // Submission state
  isSubmitting: boolean;
  submissionError: string | null;
  showConfirmDialog: boolean;
  
  // Draft state (internal only)
  isDraftSaved: boolean;
  lastSaved: Date | null;
}

// Action types
export type FormAction =
  | { type: "SET_FIELD_VALUE"; payload: { fieldPath: string; value: any } }
  | { type: "SET_FORM_DATA"; payload: InformationType }
  | { type: "ADD_CO_RESEARCHER" }
  | { type: "REMOVE_CO_RESEARCHER"; payload: number }
  | { type: "UPDATE_CO_RESEARCHER"; payload: { index: number; name: string } }
  | { type: "ADD_DOCUMENT"; payload: DocumentsType }
  | { type: "REMOVE_DOCUMENT"; payload: string }
  | { type: "UPDATE_DOCUMENT"; payload: { id: string; updates: Partial<DocumentsType> } }
  | { type: "SET_DOCUMENTS"; payload: DocumentsType[] }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "SET_FIELD_TOUCHED"; payload: string }
  | { type: "SET_MULTIPLE_FIELDS_TOUCHED"; payload: string[] }
  | { type: "VALIDATE_FORM" }
  | { type: "FORCE_VALIDATE_ALL_FIELDS" }
  | { type: "CLEAR_FIELD_ERROR"; payload: string }
  | { type: "SET_FIELD_ERROR"; payload: { fieldPath: string; errors: string[] } }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_SUBMISSION_ERROR"; payload: string | null }
  | { type: "SHOW_CONFIRM_DIALOG"; payload: boolean }
  | { type: "RESET_FORM" }
  | { type: "LOAD_FROM_LOCALSTORAGE"; payload: Partial<FormState> }
  | { type: "MARK_DRAFT_SAVED" };

// Default form data
const defaultFormData: InformationType = {
  general_information: {
    protocol_title: "",
    principal_investigator: {
      name: "",
      email: "",
      address: "",
      contact_number: "",
      position_institution: "",
    },
    co_researchers: [],
    adviser: {
      name: "",
    },
  },
  nature_and_type_of_study: {
    level: "",
    type: "",
  },
  study_site: {
    location: "within",
    outside_specify: "",
  },
  duration_of_study: {
    start_date: "",
    end_date: "",
  },
  source_of_funding: {
    selected: "self_funded",
    pharmaceutical_company_specify: "",
    others_specify: "",
  },
  participants: {
    number_of_participants: null,
    type_and_description: "",
  },
  technical_review_completed: null,
  submitted_to_other_committee: null,
  brief_description_of_study: "",
};

// Initial state
const initialState: FormState = {
  formData: defaultFormData,
  documents: [],
  currentStep: 0,
  totalSteps: 2,
  errors: {},
  touchedFields: new Set(),
  isFormValid: false,
  isSubmitting: false,
  submissionError: null,
  showConfirmDialog: false,
  isDraftSaved: false,
  lastSaved: null,
};

// Utility function to set nested values
const setNestedValue = (obj: any, path: string, value: any): any => {
  const keys = path.split('.');
  const result = JSON.parse(JSON.stringify(obj)); // Deep clone
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, result);
  target[lastKey] = value;
  return result;
};

// Get nested value from object
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Form reducer
export const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case "SET_FIELD_VALUE": {
      const { fieldPath, value } = action.payload;
      const newFormData = setNestedValue(state.formData, fieldPath, value);
      
      // Validate the specific field
      const fieldRules = informationFormValidation[fieldPath]?.rules || [];
      const fieldResult = validateField(value, fieldRules);
      
      // Update errors for this field
      const newErrors = { ...state.errors };
      if (!fieldResult.isValid) {
        newErrors[fieldPath] = fieldResult.errors;
      } else {
        delete newErrors[fieldPath];
      }
      
      // Validate entire form
      const formValidationResult = validateForm(newFormData, informationFormValidation);
      
      return {
        ...state,
        formData: newFormData,
        errors: newErrors,
        isFormValid: Object.keys(newErrors).length === 0,
        isDraftSaved: false,
      };
    }

    case "SET_FORM_DATA": {
      const formValidationResult = validateForm(action.payload, informationFormValidation);
      return {
        ...state,
        formData: action.payload,
        errors: formValidationResult.errors,
        isFormValid: formValidationResult.isValid,
        isDraftSaved: false,
      };
    }

    case "ADD_CO_RESEARCHER": {
      const newFormData = {
        ...state.formData,
        general_information: {
          ...state.formData.general_information,
          co_researchers: [
            ...state.formData.general_information.co_researchers,
            { name: "" }
          ]
        }
      };
      return {
        ...state,
        formData: newFormData,
        isDraftSaved: false,
      };
    }

    case "REMOVE_CO_RESEARCHER": {
      const index = action.payload;
      const newCoResearchers = [...state.formData.general_information.co_researchers];
      newCoResearchers.splice(index, 1);
      
      const newFormData = {
        ...state.formData,
        general_information: {
          ...state.formData.general_information,
          co_researchers: newCoResearchers
        }
      };
      
      return {
        ...state,
        formData: newFormData,
        isDraftSaved: false,
      };
    }

    case "UPDATE_CO_RESEARCHER": {
      const { index, name } = action.payload;
      const newCoResearchers = [...state.formData.general_information.co_researchers];
      newCoResearchers[index] = { ...newCoResearchers[index], name };
      
      const newFormData = {
        ...state.formData,
        general_information: {
          ...state.formData.general_information,
          co_researchers: newCoResearchers
        }
      };
      
      return {
        ...state,
        formData: newFormData,
        isDraftSaved: false,
      };
    }

    case "ADD_DOCUMENT": {
      return {
        ...state,
        documents: [...state.documents, action.payload],
        isDraftSaved: false,
      };
    }

    case "REMOVE_DOCUMENT": {
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload),
        isDraftSaved: false,
      };
    }

    case "UPDATE_DOCUMENT": {
      const { id, updates } = action.payload;
      return {
        ...state,
        documents: state.documents.map(doc => 
          doc.id === id ? { ...doc, ...updates } : doc
        ),
        isDraftSaved: false,
      };
    }

    case "SET_DOCUMENTS": {
      return {
        ...state,
        documents: action.payload,
        isDraftSaved: false,
      };
    }

    case "SET_CURRENT_STEP": {
      return {
        ...state,
        currentStep: Math.max(0, Math.min(action.payload, state.totalSteps - 1)),
      };
    }

    case "NEXT_STEP": {
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
      };
    }

    case "PREVIOUS_STEP": {
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };
    }

    case "SET_FIELD_TOUCHED": {
      const newTouchedFields = new Set(state.touchedFields);
      newTouchedFields.add(action.payload);
      return {
        ...state,
        touchedFields: newTouchedFields,
      };
    }

    case "SET_MULTIPLE_FIELDS_TOUCHED": {
      const newTouchedFields = new Set(state.touchedFields);
      action.payload.forEach(field => newTouchedFields.add(field));
      return {
        ...state,
        touchedFields: newTouchedFields,
      };
    }

    case "VALIDATE_FORM": {
      const formValidationResult = validateForm(state.formData, informationFormValidation);
      return {
        ...state,
        errors: formValidationResult.errors,
        isFormValid: formValidationResult.isValid,
      };
    }

    case "FORCE_VALIDATE_ALL_FIELDS": {
      const formValidationResult = validateForm(state.formData, informationFormValidation);
      const allFields = Object.keys(informationFormValidation);
      const newTouchedFields = new Set([...state.touchedFields, ...allFields]);
      
      return {
        ...state,
        errors: formValidationResult.errors,
        isFormValid: formValidationResult.isValid,
        touchedFields: newTouchedFields,
      };
    }

    case "CLEAR_FIELD_ERROR": {
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return {
        ...state,
        errors: newErrors,
        isFormValid: Object.keys(newErrors).length === 0,
      };
    }

    case "SET_FIELD_ERROR": {
      const { fieldPath, errors } = action.payload;
      const newErrors = { ...state.errors };
      if (errors.length > 0) {
        newErrors[fieldPath] = errors;
      } else {
        delete newErrors[fieldPath];
      }
      return {
        ...state,
        errors: newErrors,
        isFormValid: Object.keys(newErrors).length === 0,
      };
    }

    case "SET_SUBMITTING": {
      return {
        ...state,
        isSubmitting: action.payload,
        submissionError: action.payload ? null : state.submissionError,
      };
    }

    case "SET_SUBMISSION_ERROR": {
      return {
        ...state,
        submissionError: action.payload,
        isSubmitting: false,
      };
    }

    case "SHOW_CONFIRM_DIALOG": {
      return {
        ...state,
        showConfirmDialog: action.payload,
      };
    }

    case "RESET_FORM": {
      return {
        ...initialState,
        // Preserve some UI state if needed
        totalSteps: state.totalSteps,
      };
    }

    case "LOAD_FROM_LOCALSTORAGE": {
      return {
        ...state,
        ...action.payload,
        // Ensure some fields are properly initialized
        touchedFields: new Set(action.payload.touchedFields || []),
        isDraftSaved: true,
        lastSaved: action.payload.lastSaved || new Date(),
      };
    }

    case "MARK_DRAFT_SAVED": {
      return {
        ...state,
        isDraftSaved: true,
        lastSaved: new Date(),
      };
    }

    default:
      return state;
  }
};

// Hook for using the form reducer with additional utilities
export const useSubmissionFormReducer = () => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  // Field value getter
  const getFieldValue = useCallback((fieldPath: string) => {
    return getNestedValue(state.formData, fieldPath);
  }, [state.formData]);

  // Field validation state getter
  const getFieldValidation = useCallback((fieldPath: string) => {
    const hasError = state.errors[fieldPath] && state.errors[fieldPath].length > 0;
    const isTouched = state.touchedFields.has(fieldPath);
    
    return {
      isValid: !hasError,
      errors: state.errors[fieldPath] || [],
      isTouched,
      shouldShowError: hasError && isTouched,
    };
  }, [state.errors, state.touchedFields]);

  // Check if current step is valid
  const isCurrentStepValid = useCallback(() => {
    // Define which fields are required for each step
    const stepFields: Record<number, string[]> = {
      0: [
        "general_information.protocol_title",
        "general_information.principal_investigator.name",
        "general_information.principal_investigator.email",
        "general_information.principal_investigator.address",
        "general_information.principal_investigator.contact_number",
        "general_information.principal_investigator.position_institution",
        "general_information.adviser.name",
        "nature_and_type_of_study.level",
        "nature_and_type_of_study.type",
        "study_site.location",
        "duration_of_study.start_date",
        "duration_of_study.end_date",
        "source_of_funding.selected",
        "participants.number_of_participants",
        "participants.type_and_description",
        "technical_review_completed",
        "submitted_to_other_committee",
        "brief_description_of_study",
      ],
      1: [], // Documents step - validate based on documents array
    };

    const currentStepFields = stepFields[state.currentStep] || [];
    
    if (state.currentStep === 1) {
      // For documents step, check if at least some required documents are uploaded
      return state.documents.length > 0;
    }
    
    // Check if any required fields for current step have errors
    return !currentStepFields.some(field => 
      state.errors[field] && state.errors[field].length > 0
    );
  }, [state.currentStep, state.errors, state.documents.length]);

  // Navigation helpers
  const canProceed = state.currentStep < state.totalSteps - 1 && isCurrentStepValid();
  const canGoBack = state.currentStep > 0;

  return {
    state,
    dispatch,
    getFieldValue,
    getFieldValidation,
    isCurrentStepValid,
    canProceed,
    canGoBack,
  };
}; 