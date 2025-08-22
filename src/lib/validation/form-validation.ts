import { ValidationRule, ValidationSchema, ValidationResult, FieldValidationResult } from "@/types/validation.types";
import { InformationType } from "@/types/information.types";

// Validation utility functions
export const validateField = (value: any, rules: ValidationRule[]): FieldValidationResult => {
  const errors: string[] = [];

  for (const rule of rules) {
    // Required validation
    if (rule.required && (value === null || value === undefined || (typeof value === 'string' && value.trim() === ''))) {
      errors.push("This field is required");
      continue;
    }

    // Skip other validations if value is empty and not required
    if ((value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) && !rule.required) {
      continue;
    }

    // String length validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`Must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`Must be no more than ${rule.maxLength} characters`);
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push("Invalid format");
    }

    // Email validation
    if (rule.email && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push("Please enter a valid email address");
      }
    }

    // Phone validation
    if (rule.phone && typeof value === 'string') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        errors.push("Please enter a valid phone number");
      }
    }

    // URL validation
    if (rule.url && typeof value === 'string') {
      try {
        new URL(value);
      } catch {
        errors.push("Please enter a valid URL");
      }
    }

    // Numeric validations
    if (rule.numeric && typeof value === 'string') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push("Must be a valid number");
      } else {
        if (rule.min !== undefined && numValue < rule.min) {
          errors.push(`Must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && numValue > rule.max) {
          errors.push(`Must be no more than ${rule.max}`);
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`Must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`Must be no more than ${rule.max}`);
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get nested value from object
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Validate entire form using schema
export const validateForm = (data: any, schema: ValidationSchema): ValidationResult => {
  const errors: { [fieldPath: string]: string[] } = {};
  
  for (const [fieldPath, fieldValidation] of Object.entries(schema)) {
    const fieldValue = getNestedValue(data, fieldPath);
    const fieldResult = validateField(fieldValue, fieldValidation.rules);
    
    if (!fieldResult.isValid) {
      errors[fieldPath] = fieldResult.errors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Information form validation schema
export const informationFormValidation: ValidationSchema = {
  "general_information.protocol_title": {
    rules: [
      { required: true },
      { minLength: 10, maxLength: 200 }
    ]
  },
  "general_information.principal_investigator.name": {
    rules: [
      { required: true },
      { minLength: 2, maxLength: 100 }
    ]
  },
  "general_information.principal_investigator.email": {
    rules: [
      { required: true },
      { email: true }
    ]
  },
  "general_information.principal_investigator.address": {
    rules: [
      { required: true },
      { minLength: 10, maxLength: 200 }
    ]
  },
  "general_information.principal_investigator.contact_number": {
    rules: [
      { required: true },
      { phone: true }
    ]
  },
  "general_information.principal_investigator.position_institution": {
    rules: [
      { required: true },
      { minLength: 2, maxLength: 100 }
    ]
  },
  "general_information.adviser.name": {
    rules: [
      { required: true },
      { minLength: 2, maxLength: 100 }
    ]
  },
  "nature_and_type_of_study.level": {
    rules: [
      { required: true }
    ]
  },
  "nature_and_type_of_study.type": {
    rules: [
      { required: true }
    ]
  },
  "study_site.location": {
    rules: [
      { required: true }
    ]
  },
  "study_site.outside_specify": {
    rules: [
      { 
        custom: (value: string) => {
          // This field is required only if study_site.location is "outside"
          // Note: This custom validation needs access to the entire form data
          // For now, we'll handle this in the component level
          return null;
        }
      }
    ]
  },
  "duration_of_study.start_date": {
    rules: [
      { required: true }
    ]
  },
  "duration_of_study.end_date": {
    rules: [
      { required: true },
      {
        custom: (value: string) => {
          // End date should be after start date
          // This will be handled at component level with access to both dates
          return null;
        }
      }
    ]
  },
  "source_of_funding.selected": {
    rules: [
      { required: true }
    ]
  },
  "participants.number_of_participants": {
    rules: [
      { required: true },
      { numeric: true },
      { min: 1, max: 10000 }
    ]
  },
  "participants.type_and_description": {
    rules: [
      { required: true },
      { minLength: 10, maxLength: 500 }
    ]
  },
  "technical_review_completed": {
    rules: [
      { 
        custom: (value: boolean) => {
          if (value === null || value === undefined) {
            return "Please select Yes or No";
          }
          return null;
        }
      }
    ]
  },
  "submitted_to_other_committee": {
    rules: [
      { 
        custom: (value: boolean) => {
          if (value === null || value === undefined) {
            return "Please select Yes or No";
          }
          return null;
        }
      }
    ]
  },
  "brief_description_of_study": {
    rules: [
      { required: true },
      { minLength: 50, maxLength: 1000 }
    ]
  }
};

// Specific validation functions for complex fields
export const validateCoResearchers = (researchers: Array<{ name: string }>): FieldValidationResult => {
  const errors: string[] = [];
  
  researchers.forEach((researcher, index) => {
    if (!researcher.name || researcher.name.trim() === '') {
      errors.push(`Co-researcher ${index + 1}: Name is required`);
    } else if (researcher.name.length < 2) {
      errors.push(`Co-researcher ${index + 1}: Name must be at least 2 characters`);
    } else if (researcher.name.length > 100) {
      errors.push(`Co-researcher ${index + 1}: Name must be no more than 100 characters`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateConditionalField = (
  value: any,
  condition: boolean,
  rules: ValidationRule[]
): FieldValidationResult => {
  if (!condition) {
    return { isValid: true, errors: [] };
  }
  
  return validateField(value, rules);
};

// Date validation helpers
export const validateDateRange = (startDate: string, endDate: string): FieldValidationResult => {
  const errors: string[] = [];
  
  if (!startDate || !endDate) {
    if (!startDate) errors.push("Start date is required");
    if (!endDate) errors.push("End date is required");
    return { isValid: false, errors };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    errors.push("Invalid date format");
    return { isValid: false, errors };
  }

  if (end <= start) {
    errors.push("End date must be after start date");
  }

  // Check if dates are reasonable (not too far in the past or future)
  const now = new Date();
  const maxFuture = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
  const minPast = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());

  if (start < minPast || end < minPast) {
    errors.push("Dates cannot be more than 10 years in the past");
  }

  if (start > maxFuture || end > maxFuture) {
    errors.push("Dates cannot be more than 10 years in the future");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 