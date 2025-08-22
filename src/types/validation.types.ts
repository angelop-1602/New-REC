export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  numeric?: boolean;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface FieldValidation {
  rules: ValidationRule[];
  message?: string;
}

export interface ValidationSchema {
  [fieldPath: string]: FieldValidation;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [fieldPath: string]: string[] };
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  rule: string;
}

export interface ValidatedFieldProps {
  value: any;
  onChange: (value: any) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  validationRules?: ValidationRule[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
} 