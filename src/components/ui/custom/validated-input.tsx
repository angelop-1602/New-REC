"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ValidationRule } from "@/types";
import { validateField } from "@/lib/validation/form-validation";
import { AlertCircle } from "lucide-react";

export type FormatType = 
  | "title-case"      // Title Case for Titles
  | "proper-case"     // Proper Case for Names  
  | "lowercase"       // lowercase for emails
  | "uppercase"       // UPPERCASE for codes
  | "phone"           // Phone number formatting
  | "none";           // No formatting

export interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  validationRules?: ValidationRule[];
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  description?: string;
  showValidationIcon?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  debounceMs?: number;
  // Auto-formatting
  format?: FormatType;
  // New props for enhanced validation
  fieldPath?: string;
  registerValidation?: (fieldPath: string, callback: (force?: boolean) => void) => void;
  unregisterValidation?: (fieldPath: string) => void;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  onValidationChange,
  validationRules = [],
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  className,
  inputClassName,
  labelClassName,
  description,
  showValidationIcon = true,
  validateOnBlur = true,
  validateOnChange = true,
  debounceMs = 300,
  format = "none",
  fieldPath,
  registerValidation,
  unregisterValidation,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onValidationChangeRef = useRef(onValidationChange);

  // Update the ref when the callback changes
  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  }, [onValidationChange]);

  // Memoize validation rules to prevent unnecessary re-renders
  const memoizedValidationRules = useMemo(() => validationRules, [validationRules]);

  // Formatting functions
  const formatValue = useCallback((value: string, formatType: FormatType): string => {
    if (!value || formatType === "none") return value;

    switch (formatType) {
      case "title-case":
        // Convert to title case (capitalize first letter of each word)
        return value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
      
      case "proper-case":
        // Proper case for names (handles prefixes like "de", "van", "del")
        return value.toLowerCase()
          .split(' ')
          .map(word => {
            // Don't capitalize common name prefixes
            if (['de', 'del', 'della', 'di', 'da', 'van', 'von', 'le', 'la', 'el'].includes(word)) {
              return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(' ');
      
      case "lowercase":
        return value.toLowerCase();
      
      case "uppercase":
        return value.toUpperCase();
      
      case "phone":
        // Format phone numbers (remove non-digits, then format)
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 3) {
          return digits;
        } else if (digits.length <= 6) {
          return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        } else if (digits.length <= 10) {
          return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
        } else {
          return `+${digits.slice(0, -10)} ${digits.slice(-10, -7)}-${digits.slice(-7, -4)}-${digits.slice(-4)}`;
        }
      
      default:
        return value;
    }
  }, []);



  // Determine if field is required from props or validation rules
  const isRequired = required || memoizedValidationRules.some(rule => rule.required);

  // Validate function with stable dependencies
  const validateValue = useCallback((inputValue: string, force = false) => {
    if (memoizedValidationRules.length === 0) return;

    const result = validateField(inputValue, memoizedValidationRules);
    
    setErrors(result.errors);
    onValidationChangeRef.current?.(result.isValid, result.errors);

    // Handle forced validation (from form-level validation)
    if (force && !result.isValid) {
      setIsTouched(true);
      setShowAnimation(true);
      
      // Focus the input if it's invalid during forced validation
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [memoizedValidationRules]);

  // Force validation callback for external use
  const forceValidation = useCallback((force = false) => {
    validateValue(value, force);
  }, [value, validateValue]);

  // Debounced validation
  const debouncedValidate = useCallback((inputValue: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      validateValue(inputValue);
    }, debounceMs);
  }, [validateValue, debounceMs]);

  // Handle value changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Apply formatting to the raw input value
    const formattedNewValue = formatValue(rawValue, format);
    
    // Call onChange with the formatted value
    onChange(formattedNewValue);
    setHasUserInteracted(true);
    
    // Clear animation when user starts typing
    if (showAnimation) {
      setShowAnimation(false);
    }
    
    if (validateOnChange && isTouched) {
      debouncedValidate(formattedNewValue);
    }
  };

  // Handle blur
  const handleBlur = () => {
    // Apply formatting on blur (for copy-pasted text)
    if (value && format !== "none") {
      const formattedValue = formatValue(value, format);
      if (formattedValue !== value) {
        onChange(formattedValue);
      }
    }

    // Only set touched if user has actually entered content or if they've interacted meaningfully
    if (hasUserInteracted && value.trim() !== "") {
      setIsTouched(true);
      if (validateOnBlur) {
        validateValue(value);
      }
    }
  };

  // Handle focus - removed setIsTouched(true)
  const handleFocus = () => {
    setHasUserInteracted(true);
    // Clear animation when user focuses
    if (showAnimation) {
      setShowAnimation(false);
    }
  };

  // Register validation callback with parent form
  useEffect(() => {
    if (fieldPath && registerValidation) {
      registerValidation(fieldPath, forceValidation);
    }
    
    return () => {
      if (fieldPath && unregisterValidation) {
        unregisterValidation(fieldPath);
      }
    };
  }, [fieldPath, registerValidation, unregisterValidation, forceValidation]);

  // Listen for external validation changes (from context/forceValidateAllFields)
  useEffect(() => {
    if (onValidationChange && errors.length > 0) {
      // If there are errors from external validation, mark as touched to show them
      setIsTouched(true);
    }
  }, [errors, onValidationChange]);

  // Validate on mount if value exists - only when rules change or value changes
  useEffect(() => {
    if (value && memoizedValidationRules.length > 0) {
      validateValue(value);
    }
  }, [value, memoizedValidationRules, validateValue]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Auto-clear animation
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  // Determine validation state for styling
  // Show errors immediately if they exist (for forced validation triggers), or if touched
  const hasErrors = errors.length > 0;
  // Show errors if touched OR if there are errors (forced validation will set errors without touch)
  const showErrors = hasErrors;
  const shouldAnimate = showAnimation && showErrors;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <Label 
        htmlFor={label}
        className={cn(
          "text-sm font-medium flex items-center gap-2 transition-all duration-200",
          showErrors && "text-destructive",
          labelClassName
        )}
      >
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Input Container */}
      <div className="relative">
        <Input
          ref={inputRef}
          id={label}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "transition-all duration-200",
            showErrors && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
            !showErrors && isRequired && !value && "border-red-300",
            shouldAnimate && "animate-pulse",
            inputClassName
          )}
          style={{
            animationName: shouldAnimate ? "validation-pulse" : undefined,
            animationDuration: shouldAnimate ? "0.5s" : undefined,
            animationTimingFunction: shouldAnimate ? "ease-in-out" : undefined,
            animationIterationCount: shouldAnimate ? "1" : undefined,
          }}
        />
        
        {/* Validation Icon */}
        {showValidationIcon && showErrors && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Error Messages */}
      {showErrors && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes validation-pulse {
          0%, 100% { 
            transform: scale(1); 
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
          }
          50% { 
            transform: scale(1.02); 
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3);
          }
        }
      `}</style>
    </div>
  );
};

export default ValidatedInput; 