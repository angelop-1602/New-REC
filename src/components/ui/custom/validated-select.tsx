"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useId,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ValidationRule } from "@/types";
import { validateField } from "@/lib/validation/form-validation";
import { AlertCircle } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Short help text to show in a tooltip when hovering an option */
  description?: string;
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

  const selectRef = useRef<HTMLButtonElement>(null);
  const onValidationChangeRef = useRef(onValidationChange);

  // a11y ids
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const errorId = `${baseId}-error`;
  const descId = `${baseId}-desc`;

  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  }, [onValidationChange]);

  const memoizedValidationRules = useMemo(() => validationRules, [validationRules]);

  const isRequired = required || memoizedValidationRules.some((rule) => rule.required);

  const validateValue = useCallback(
    (inputValue: string, force = false) => {
      if (memoizedValidationRules.length === 0) return;

      const result = validateField(inputValue, memoizedValidationRules);

      setErrors(result.errors);
      onValidationChangeRef.current?.(result.isValid, result.errors);

      if (force && !result.isValid) {
        setIsTouched(true);
        setShowAnimation(true);

        if (selectRef.current) {
          selectRef.current.focus();
        }
      }
    },
    [memoizedValidationRules]
  );

  const forceValidation = useCallback(
    (force = false) => {
      validateValue(value, force);
    },
    [value, validateValue]
  );

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setHasUserInteracted(true);
    setIsTouched(true);

    if (showAnimation) setShowAnimation(false);
    if (validateOnChange) validateValue(newValue);
  };

  const handleBlur = () => {
    if (hasUserInteracted && value !== "") {
      setIsTouched(true);
      if (validateOnBlur) validateValue(value);
    }
  };

  const handleFocus = () => {
    setHasUserInteracted(true);
    if (showAnimation) setShowAnimation(false);
  };

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

  useEffect(() => {
    if (onValidationChange && errors.length > 0) {
      setIsTouched(true);
    }
  }, [errors, onValidationChange]);

  useEffect(() => {
    if (value && memoizedValidationRules.length > 0) {
      validateValue(value);
    }
  }, [value, memoizedValidationRules, validateValue]);

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  const hasErrors = errors.length > 0 && isTouched;
  const shouldAnimate = showAnimation && hasErrors;

  const describedByIds: string[] = [];
  if (description) describedByIds.push(descId);
  if (hasErrors) describedByIds.push(errorId);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <Label
        htmlFor={triggerId}
        className={cn(
          "text-sm font-medium flex items-center gap-2 transition-all duration-200",
          hasErrors && "text-destructive",
          labelClassName
        )}
      >
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>

      {/* Helper Description */}
      {description && (
        <p id={descId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {/* Select + Items (with tooltips) */}
      <div className="relative">
        <TooltipProvider delayDuration={150}>
          <Select
            value={value}
            onValueChange={handleChange}
            onOpenChange={(open) => {
              if (open) handleFocus();
              else handleBlur();
            }}
            disabled={disabled}
          >
            <SelectTrigger
              id={triggerId}
              ref={selectRef}
              aria-invalid={hasErrors || undefined}
              aria-describedby={describedByIds.join(" ") || undefined}
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
              {options.map((option) => {
                const hasDesc = Boolean(option.description);
                // Native title helps for long text + provides a fallback tooltip
                const nativeTitle = option.description ?? option.label;

                if (!hasDesc) {
                  return (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      title={nativeTitle}
                      className="truncate"
                    >
                      {option.label}
                    </SelectItem>
                  );
                }

                return (
                  <Tooltip key={option.value}>
                    <TooltipTrigger asChild>
                      <SelectItem
                        value={option.value}
                        disabled={option.disabled}
                        className="truncate"
                      >
                        {option.label}
                      </SelectItem>
                    </TooltipTrigger>
                    <TooltipContent className=" text-xs leading-snug">
                      {option.description}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </SelectContent>
          </Select>
        </TooltipProvider>

        {/* Validation Icon */}
        {showValidationIcon && hasErrors && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Error Messages */}
      {hasErrors && (
        <div id={errorId} className="space-y-1">
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
