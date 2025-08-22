import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  variant?: "spinner" | "dots" | "skeleton" | "bar" | "simple";
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
  showText?: boolean;
}

export function Loading({
  variant = "spinner",
  size = "md",
  text = "Loading...",
  className,
  showText = true,
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  if (variant === "simple") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div
          className={cn(
            "animate-spin rounded-full border-b-2 border-primary",
            sizeClasses[size]
          )}
        />
        {showText && (
          <span className={cn("ml-2 text-muted-foreground", textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center space-x-1", className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "animate-pulse rounded-full bg-primary",
                size === "sm" ? "h-1 w-1" : size === "md" ? "h-1.5 w-1.5" : "h-2 w-2"
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        {showText && (
          <span className={cn("ml-2 text-muted-foreground", textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("animate-pulse rounded-md bg-muted", className)} />
    );
  }

  if (variant === "bar") {
    return (
      <div className={cn("w-full", className)}>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
          <div className="h-full w-full bg-primary transition-all animate-pulse">
            <div className="absolute left-0 w-6 h-full bg-primary-foreground blur-[10px] inset-y-0 animate-pulse" />
          </div>
        </div>
        {showText && (
          <span className={cn("mt-2 block text-muted-foreground", textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  // Default spinner variant (the sophisticated one)
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative">
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          
          @keyframes spin2 {
            0% {
              stroke-dasharray: 1, 800;
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dasharray: 400, 400;
              stroke-dashoffset: -200px;
            }
            100% {
              stroke-dasharray: 800, 1;
              stroke-dashoffset: -800px;
            }
          }
          
          .spin2 {
            transform-origin: center;
            animation: spin2 1.5s ease-in-out infinite,
              spin 2s linear infinite;
            animation-direction: alternate;
          }
        `}</style>
        
        <svg
          viewBox="0 0 800 800"
          className={cn(
            "stroke-primary",
            size === "sm" ? "h-6 w-6" : 
            size === "md" ? "h-8 w-8" : 
            size === "lg" ? "h-12 w-12" : "h-16 w-16"
          )}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="spin2"
            cx="400"
            cy="400"
            fill="none"
            r="200"
            strokeWidth="50"
            strokeDasharray="700 1400"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showText && (
        <span className={cn("mt-2 text-muted-foreground", textSizes[size])}>
          {text}
        </span>
      )}
    </div>
  );
}

// Convenience components for common use cases
export function LoadingSpinner(props: Omit<LoadingProps, "variant">) {
  return <Loading variant="spinner" {...props} />;
}

export function LoadingSimple(props: Omit<LoadingProps, "variant">) {
  return <Loading variant="simple" {...props} />;
}

export function LoadingDots(props: Omit<LoadingProps, "variant">) {
  return <Loading variant="dots" {...props} />;
}

export function LoadingSkeleton(props: Omit<LoadingProps, "variant">) {
  return <Loading variant="skeleton" {...props} />;
}

export function LoadingBar(props: Omit<LoadingProps, "variant">) {
  return <Loading variant="bar" {...props} />;
}

// Full page loading component
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Inline loading component for buttons and small areas
export function InlineLoading({ size = "sm", text }: { size?: "sm" | "md"; text?: string }) {
  return (
    <div className="flex items-center">
      <Loader2 className={cn("animate-spin", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
      {text && <span className="ml-2 text-sm">{text}</span>}
    </div>
  );
} 