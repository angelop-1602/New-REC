"use client";

import React, { useEffect, useState } from "react";
import { 
  CheckCircleIcon, 
  InfoIcon, 
  TriangleAlertIcon, 
  XCircleIcon,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast as sonnerToast } from "sonner";

interface CustomToastProps {
  title: string;
  description: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

const CustomToast = ({ 
  title, 
  description, 
  variant, 
  duration = 5000,
  onClose 
}: CustomToastProps) => {
  const [progress, setProgress] = useState(100);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          setIsClosing(true);
          setTimeout(() => onClose?.(), 300);
          return 0;
        }
        return prev - (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose?.(), 300);
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <TriangleAlertIcon className="h-5 w-5 text-amber-500" />;
      case 'info':
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
          title: 'text-green-800 dark:text-green-300',
          description: 'text-green-700 dark:text-green-400',
          progress: 'bg-green-500'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
          title: 'text-red-800 dark:text-red-300',
          description: 'text-red-700 dark:text-red-400',
          progress: 'bg-red-500'
        };
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
          title: 'text-amber-800 dark:text-amber-300',
          description: 'text-amber-700 dark:text-amber-400',
          progress: 'bg-amber-500'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
          title: 'text-blue-800 dark:text-blue-300',
          description: 'text-blue-700 dark:text-blue-400',
          progress: 'bg-blue-500'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
          title: 'text-blue-800 dark:text-blue-300',
          description: 'text-blue-700 dark:text-blue-400',
          progress: 'bg-blue-500'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border-2 p-4 shadow-lg transition-all duration-300 transform max-w-md",
        styles.container,
        isClosing ? "scale-95 opacity-0 translate-x-2" : "scale-100 opacity-100 translate-x-0"
      )}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-3 pr-6">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn("text-sm font-semibold leading-5", styles.title)}>
            {title}
          </h4>
          <p className={cn("text-xs mt-1 leading-4", styles.description)}>
            {description}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className={cn(
            "h-full transition-all duration-100 ease-linear",
            styles.progress
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Custom toast functions
export const customToast = {
  success: (title: string, description: string, duration?: number, position: 'top-center' | 'bottom-right' = 'bottom-right') => {
    sonnerToast.custom((t) => (
      <CustomToast
        title={title}
        description={description}
        variant="success"
        duration={duration}
        onClose={() => sonnerToast.dismiss(t)}
      />
    ), { position });
  },
  
  error: (title: string, description: string, duration?: number, position: 'top-center' | 'bottom-right' = 'bottom-right') => {
    sonnerToast.custom((t) => (
      <CustomToast
        title={title}
        description={description}
        variant="error"
        duration={duration}
        onClose={() => sonnerToast.dismiss(t)}
      />
    ), { position });
  },
  
  warning: (title: string, description: string, duration?: number, position: 'top-center' | 'bottom-right' = 'bottom-right') => {
    sonnerToast.custom((t) => (
      <CustomToast
        title={title}
        description={description}
        variant="warning"
        duration={duration}
        onClose={() => sonnerToast.dismiss(t)}
      />
    ), { position });
  },
  
  info: (title: string, description: string, duration?: number, position: 'top-center' | 'bottom-right' = 'bottom-right') => {
    sonnerToast.custom((t) => (
      <CustomToast
        title={title}
        description={description}
        variant="info"
        duration={duration}
        onClose={() => sonnerToast.dismiss(t)}
      />
    ), { position });
  },
  
  confirm: (title: string, description: string, onConfirm: () => void, onCancel?: () => void, buttonText: string = "Confirm") => {
    sonnerToast.custom((t) => (
      <div className="bg-amber-50 border-amber-200 min-w-[400px] dark:bg-amber-900/20 dark:border-amber-800 relative overflow-hidden rounded-lg border-2 p-4 shadow-lg max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold leading-5 text-amber-800 dark:text-amber-300">
              {title}
            </h4>
            <p className="text-xs mt-1 leading-4 text-amber-700 dark:text-amber-400">
              {description}
            </p>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  onConfirm();
                  sonnerToast.dismiss(t);
                }}
                className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition-colors"
              >
                {buttonText}
              </button>
              <button
                onClick={() => {
                  onCancel?.();
                  sonnerToast.dismiss(t);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    ), { position: 'top-center', duration: 15000 });
  }
};

export default CustomToast; 