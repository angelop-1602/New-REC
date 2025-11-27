"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { ValidationRule } from "@/types";
import { validateField } from "@/lib/validation/form-validation";

export interface ValidatedDateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  validationRules?: ValidationRule[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  description?: string;
  showValidationIcon?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  dateFormat?: string;
  minDate?: string;
  maxDate?: string;
  showTodayButton?: boolean;
  // New props for enhanced validation
  fieldPath?: string;
  registerValidation?: (fieldPath: string, callback: (force?: boolean) => void) => void;
  unregisterValidation?: (fieldPath: string) => void;
}

export const ValidatedDateInput: React.FC<ValidatedDateInputProps> = ({
  label,
  value,
  onChange,
  onValidationChange,
  validationRules = [],
  placeholder = "Select date",
  required = false,
  disabled = false,
  className,
  inputClassName,
  labelClassName,
  description,
  showValidationIcon = true,
  validateOnBlur = true,
  validateOnChange = true,
  dateFormat = "MMM dd, yyyy",
  minDate,
  maxDate,
  showTodayButton = true,
  fieldPath,
  registerValidation,
  unregisterValidation,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const onValidationChangeRef = useRef(onValidationChange);

  // Update the ref when the callback changes
  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  }, [onValidationChange]);

  // Memoize validation rules to prevent unnecessary re-renders
  const memoizedValidationRules = useMemo(() => validationRules, [validationRules]);

  // Determine if field is required from props or validation rules
  const isRequired = required || memoizedValidationRules.some(rule => rule.required);

  // Parse date value
  const selectedDate = value ? new Date(value) : undefined;
  const isValidDate = selectedDate && !isNaN(selectedDate.getTime());

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
      
      // Focus the date button if it's invalid during forced validation
      if (dateButtonRef.current) {
        dateButtonRef.current.focus();
      }
    }
  }, [memoizedValidationRules]);

  // Force validation callback for external use
  const forceValidation = useCallback((force = false) => {
    validateValue(value, force);
  }, [value, validateValue]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      onChange(dateStr);
      setHasUserInteracted(true);
      setIsTouched(true);
      
      // Clear animation when user selects a date
      if (showAnimation) {
        setShowAnimation(false);
      }
      
      if (validateOnChange) {
        validateValue(dateStr);
      }
    }
    setIsCalendarOpen(false);
  };

  // Handle "Today" button click
  const handleTodayClick = () => {
    const today = new Date();
    const dateStr = format(today, "yyyy-MM-dd");
    onChange(dateStr);
    setHasUserInteracted(true);
    setIsTouched(true);
    
    // Clear animation when user clicks Today
    if (showAnimation) {
      setShowAnimation(false);
    }
    
    if (validateOnChange) {
      validateValue(dateStr);
    }
    setIsCalendarOpen(false);
  };

  // Handle clear
  const handleClear = () => {
    onChange("");
    setHasUserInteracted(true);
    setIsTouched(false); // Reset touched state when clearing
    
    // Clear animation when user clears
    if (showAnimation) {
      setShowAnimation(false);
    }
    
    if (validateOnChange) {
      validateValue("");
    }
  };

  // Handle blur
  const handleBlur = () => {
    // Only set touched if user has actually entered a date
    if (hasUserInteracted && value !== "") {
      setIsTouched(true);
      if (validateOnBlur) {
        validateValue(value);
      }
    }
  };

  // Handle focus/opening
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

      {/* Date Input Container */}
      <div className="relative">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={dateButtonRef}
              id={label}
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal transition-all duration-200",
                !isValidDate && "text-muted-foreground",
                hasErrors && "border-red-500 focus:ring-red-500",
                shouldAnimate && "animate-pulse",
                inputClassName
              )}
              disabled={disabled}
              onBlur={handleBlur}
              onFocus={handleFocus}
              style={{
                animationName: shouldAnimate ? "validation-pulse" : undefined,
                animationDuration: shouldAnimate ? "0.5s" : undefined,
                animationTimingFunction: shouldAnimate ? "ease-in-out" : undefined,
                animationIterationCount: shouldAnimate ? "1" : undefined,
              }}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isValidDate ? format(selectedDate, dateFormat) : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              fromDate={minDate ? new Date(minDate) : undefined}
              toDate={maxDate ? new Date(maxDate) : undefined}
              initialFocus
            />
            {showTodayButton && (
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTodayClick}
                  className="w-full"
                >
                  Today
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Clear Button */}
        {isValidDate && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-9 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <span className="sr-only">Clear date</span>
            <span className="text-lg leading-none">×</span>
          </Button>
        )}

        {/* Validation Icon */}
        {showValidationIcon && hasErrors && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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

export default ValidatedDateInput; 