"use client";

import React from "react";
import { cn } from "@/lib/utils";

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

  // Legacy "simple" variant now delegates to skeleton for consistency
  if (variant === "simple") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div
          className={cn(
            "animate-pulse rounded-md bg-muted",
            size === "sm"
              ? "h-3 w-10"
              : size === "md"
              ? "h-4 w-16"
              : size === "lg"
              ? "h-5 w-24"
              : "h-6 w-32"
          )}
        />
        {showText && (
          <span className={cn("ml-3 text-muted-foreground", textSizes[size])}>
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

  // Default "spinner" variant now uses a skeleton-style placeholder instead of an actual spinner
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "animate-pulse rounded-full bg-muted",
          size === "sm"
            ? "h-6 w-6"
            : size === "md"
            ? "h-8 w-8"
            : size === "lg"
            ? "h-10 w-10"
            : "h-12 w-12"
        )}
      />
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
  // Simple loader now just uses the skeleton-based layout
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

// Full page loading component – skeleton-based layout for pages
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-4">
        <div className="space-y-2">
          <LoadingSkeleton className="h-6 w-40 mx-auto rounded-md" />
          <LoadingSkeleton className="h-4 w-64 mx-auto rounded-md" />
        </div>
        <div className="space-y-2">
          <LoadingSkeleton className="h-10 w-full rounded-md" />
          <LoadingSkeleton className="h-32 w-full rounded-md" />
          <LoadingSkeleton className="h-8 w-2/3 rounded-md" />
        </div>
        {text && (
          <p className="text-center text-xs text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  );
}

// Inline loading component for buttons and small areas – subtle skeleton bar
export function InlineLoading({ size = "sm", text }: { size?: "sm" | "md"; text?: string }) {
  const barClasses =
    size === "sm"
      ? "h-3 w-6 sm:w-8"
      : "h-4 w-8 sm:w-10";

  return (
    <div className="flex items-center gap-2">
      <div className={cn("animate-pulse rounded-md bg-muted", barClasses)} />
      {text && <span className="text-xs text-muted-foreground">{text}</span>}
    </div>
  );
}