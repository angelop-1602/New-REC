"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ValidationRule } from "@/types";
import { validateField } from "@/lib/validation/form-validation";
import { AlertCircle } from "lucide-react";

export interface ValidatedTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  validationRules?: ValidationRule[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
  labelClassName?: string;
  description?: string;
  showValidationIcon?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  debounceMs?: number;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  resize?: boolean;
  // New props for enhanced validation
  fieldPath?: string;
  registerValidation?: (fieldPath: string, callback: (force?: boolean) => void) => void;
  unregisterValidation?: (fieldPath: string) => void;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  value,
  onChange,
  onValidationChange,
  validationRules = [],
  placeholder,
  required = false,
  disabled = false,
  className,
  textareaClassName,
  labelClassName,
  description,
  showValidationIcon = true,
  validateOnBlur = true,
  validateOnChange = true,
  debounceMs = 300,
  rows = 3,
  maxLength,
  showCharCount = false,
  resize = true,
  fieldPath,
  registerValidation,
  unregisterValidation,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onValidationChangeRef = useRef(onValidationChange);

  // Update the ref when the callback changes
  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  }, [onValidationChange]);

  // Memoize validation rules to prevent unnecessary re-renders
  const memoizedValidationRules = useMemo(() => validationRules, [validationRules]);

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
      
      // Focus the textarea if it's invalid during forced validation
      if (textareaRef.current) {
        textareaRef.current.focus();
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
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Enforce max length if specified
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange(newValue);
    setHasUserInteracted(true);
    
    // Clear animation when user starts typing
    if (showAnimation) {
      setShowAnimation(false);
    }
    
    if (validateOnChange && isTouched) {
      debouncedValidate(newValue);
    }
  };

  // Handle blur
  const handleBlur = () => {
    // Only set touched if user has actually entered content
    if (hasUserInteracted && value.trim() !== "") {
      setIsTouched(true);
      if (validateOnBlur) {
        validateValue(value);
      }
    }
  };

  // Handle focus
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
  const hasErrors = errors.length > 0 && isTouched;
  const shouldAnimate = showAnimation && hasErrors;

  // Character count
  const currentLength = value.length;
  const remainingChars = maxLength ? maxLength - currentLength : null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <Label 
        htmlFor={label}
        className={cn(
          "text-sm font-medium flex items-center gap-2 transition-all duration-200",
          hasErrors && "text-destructive",
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

      {/* Textarea Container */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          id={label}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            "transition-all duration-200",
            hasErrors && "border-red-500 focus-visible:ring-red-500",
            shouldAnimate && "animate-pulse",
            !resize && "resize-none",
            textareaClassName
          )}
          style={{
            animationName: shouldAnimate ? "validation-pulse" : undefined,
            animationDuration: shouldAnimate ? "0.5s" : undefined,
            animationTimingFunction: shouldAnimate ? "ease-in-out" : undefined,
            animationIterationCount: shouldAnimate ? "1" : undefined,
          }}
        />
        
        {/* Validation Icon */}
        {showValidationIcon && hasErrors && (
          <div className="absolute right-3 top-3">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Character Count */}
      {showCharCount && maxLength && (
        <div className="flex justify-end">
          <span className={cn(
            "text-xs",
            remainingChars && remainingChars < 0 ? "text-red-500" : "text-muted-foreground"
          )}>
            {currentLength}/{maxLength}
          </span>
        </div>
      )}

      {/* Error Messages */}
      {hasErrors && (
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

export default ValidatedTextarea; 