"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ValidationRule } from "@/types";
import { validateField } from "@/lib/validation/form-validation";
import { AlertCircle } from "lucide-react";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface ValidatedRadioGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  validationRules?: ValidationRule[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
  radioGroupClassName?: string;
  labelClassName?: string;
  description?: string;
  showValidationIcon?: boolean;
  validateOnChange?: boolean;
  options: RadioOption[];
  orientation?: "horizontal" | "vertical";
  // New props for enhanced validation
  fieldPath?: string;
  registerValidation?: (fieldPath: string, callback: (force?: boolean) => void) => void;
  unregisterValidation?: (fieldPath: string) => void;
}

export const ValidatedRadioGroup: React.FC<ValidatedRadioGroupProps> = ({
  label,
  value,
  onChange,
  onValidationChange,
  validationRules = [],
  required = false,
  disabled = false,
  className,
  radioGroupClassName,
  labelClassName,
  description,
  showValidationIcon = true,
  validateOnChange = true,
  options,
  orientation = "vertical",
  fieldPath,
  registerValidation,
  unregisterValidation,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  const radioGroupRef = useRef<HTMLDivElement>(null);
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
      
      // Focus the first radio button if it's invalid during forced validation
      if (radioGroupRef.current) {
        const firstRadio = radioGroupRef.current.querySelector('[role="radio"]') as HTMLElement;
        if (firstRadio) {
          firstRadio.focus();
        }
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
    setIsTouched(true); // For radio groups, selecting an option counts as meaningful interaction
    
    // Clear animation when user makes a selection
    if (showAnimation) {
      setShowAnimation(false);
    }
    
    if (validateOnChange) {
      validateValue(newValue);
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

      {/* Radio Group Container */}
      <div className="relative">
        <RadioGroup
          ref={radioGroupRef}
          value={value}
          onValueChange={handleChange}
          disabled={disabled}
          className={cn(
            "transition-all duration-200",
            orientation === "horizontal" ? "flex flex-wrap gap-6" : "space-y-2",
            hasErrors && "border border-red-500 rounded-md p-3",
            shouldAnimate && "animate-pulse",
            radioGroupClassName
          )}
          style={{
            animationName: shouldAnimate ? "validation-pulse" : undefined,
            animationDuration: shouldAnimate ? "0.5s" : undefined,
            animationTimingFunction: shouldAnimate ? "ease-in-out" : undefined,
            animationIterationCount: shouldAnimate ? "1" : undefined,
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center space-x-2",
                option.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <RadioGroupItem
                value={option.value}
                id={`${label}-${option.value}`}
                disabled={disabled || option.disabled}
                className={cn(
                  "transition-all duration-200",
                  hasErrors && "border-red-500"
                )}
              />
              <Label
                htmlFor={`${label}-${option.value}`}
                className={cn(
                  "text-sm font-normal cursor-pointer",
                  hasErrors && "text-red-500",
                  (disabled || option.disabled) && "cursor-not-allowed"
                )}
              >
                {option.label}
              </Label>
              {option.description && (
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </div>
          ))}
        </RadioGroup>

        {/* Validation Icon */}
        {showValidationIcon && hasErrors && (
          <div className="absolute -top-1 -right-1">
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

export default ValidatedRadioGroup; 