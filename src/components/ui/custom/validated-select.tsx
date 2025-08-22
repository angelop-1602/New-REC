"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ValidationRule } from "@/types/validation.types";
import { validateField } from "@/lib/validation/form-validation";
import { AlertCircle } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ValidatedSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  validationRules?: ValidationRule[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  selectClassName?: string;
  labelClassName?: string;
  description?: string;
  showValidationIcon?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  options: SelectOption[];
  // New props for enhanced validation
  fieldPath?: string;
  registerValidation?: (fieldPath: string, callback: (force?: boolean) => void) => void;
  unregisterValidation?: (fieldPath: string) => void;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  value,
  onChange,
  onValidationChange,
  validationRules = [],
  placeholder = "Select an option",
  required = false,
  disabled = false,
  className,
  selectClassName,
  labelClassName,
  description,
  showValidationIcon = true,
  validateOnBlur = true,
  validateOnChange = true,
  options,
  fieldPath,
  registerValidation,
  unregisterValidation,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  const selectRef = useRef<HTMLButtonElement>(null);
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
      setAnimationKey(prev => prev + 1);
      
      // Focus the select if it's invalid during forced validation
      if (selectRef.current) {
        selectRef.current.focus();
      }
    }
  }, [memoizedValidationRules]);

  // Force validation callback for external use
  const forceValidation = useCallback((force = false) => {
    validateValue(value, force);
  }, [value, validateValue]);

  // Handle value changes
  const handleChange = (newValue: string) => {
    onChange(newValue);
    setHasUserInteracted(true);
    setIsTouched(true); // For selects, selecting an option counts as meaningful interaction
    
    // Clear animation when user makes a selection
    if (showAnimation) {
      setShowAnimation(false);
    }
    
    if (validateOnChange) {
      validateValue(newValue);
    }
  };

  // Handle blur (when select is closed)
  const handleBlur = () => {
    // Only set touched if user has actually made a selection
    if (hasUserInteracted && value !== "") {
      setIsTouched(true);
      if (validateOnBlur) {
        validateValue(value);
      }
    }
  };

  // Handle focus/opening - just track interaction
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

      {/* Select Container */}
      <div className="relative">
        <Select
          value={value}
          onValueChange={handleChange}
          onOpenChange={(open) => {
            if (open) {
              handleFocus();
            } else {
              handleBlur();
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger
            ref={selectRef}
            className={cn(
              "transition-all duration-200",
              hasErrors && "border-red-500 focus:ring-red-500",
              shouldAnimate && "animate-pulse",
              selectClassName
            )}
            style={{
              animationName: shouldAnimate ? "validation-pulse" : undefined,
              animationDuration: shouldAnimate ? "0.8s" : undefined,
              animationTimingFunction: shouldAnimate ? "ease-in-out" : undefined,
              animationIterationCount: shouldAnimate ? "3" : undefined,
            }}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Validation Icon */}
        {showValidationIcon && hasErrors && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>

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

export default ValidatedSelect; 