# Unified Loading Component

This document explains how to use the new unified loading component system that consolidates all loading states in the application.

## Overview

The loading system provides multiple variants and sizes for different use cases, ensuring consistency across the application.

## Components

### Main Loading Component

```tsx
import { Loading } from "@/components/ui/loading";

<Loading 
  variant="spinner" // "spinner" | "dots" | "skeleton" | "bar" | "simple"
  size="md" // "sm" | "md" | "lg" | "xl"
  text="Loading..." // Custom text
  showText={true} // Whether to show text
  className="custom-class" // Additional CSS classes
/>
```

### Convenience Components

#### LoadingSpinner
```tsx
import { LoadingSpinner } from "@/components/ui/loading";

<LoadingSpinner size="lg" text="Loading submissions..." />
```

#### LoadingSimple
```tsx
import { LoadingSimple } from "@/components/ui/loading";

<LoadingSimple size="md" text="Loading..." />
```

#### LoadingDots
```tsx
import { LoadingDots } from "@/components/ui/loading";

<LoadingDots size="sm" text="Processing..." />
```

#### LoadingSkeleton
```tsx
import { LoadingSkeleton } from "@/components/ui/loading";

<LoadingSkeleton className="h-20 w-full" />
```

#### LoadingBar
```tsx
import { LoadingBar } from "@/components/ui/loading";

<LoadingBar text="Uploading files..." />
```

### Specialized Components

#### PageLoading
For full-page loading states:
```tsx
import { PageLoading } from "@/components/ui/loading";

<PageLoading text="Loading application..." />
```

#### InlineLoading
For buttons and small areas:
```tsx
import { InlineLoading } from "@/components/ui/loading";

<InlineLoading size="sm" text="Saving..." />
```

## Variants

1. **spinner** - Sophisticated SVG spinner with custom animations (default)
2. **simple** - Basic CSS spinner with border animation
3. **dots** - Animated dots
4. **skeleton** - Pulse animation for content placeholders
5. **bar** - Progress bar style loading

## Sizes

- **sm** - Small (4x4 for spinner, 1x1 for dots)
- **md** - Medium (6x6 for spinner, 1.5x1.5 for dots) - default
- **lg** - Large (8x8 for spinner, 2x2 for dots)
- **xl** - Extra large (12x12 for spinner)

## Usage Examples

### Page Loading
```tsx
if (loading) {
  return <PageLoading text="Loading dashboard..." />;
}
```

### Component Loading
```tsx
{loading ? (
  <LoadingSpinner size="lg" text="Loading submissions..." />
) : (
  <SubmissionsList data={submissions} />
)}
```

### Button Loading
```tsx
<Button disabled={isSubmitting}>
  {isSubmitting ? (
    <InlineLoading size="sm" text="Submitting..." />
  ) : (
    "Submit"
  )}
</Button>
```

### Skeleton Loading
```tsx
{loading ? (
  <div className="space-y-4">
    <LoadingSkeleton className="h-20 w-full" />
    <LoadingSkeleton className="h-16 w-3/4" />
    <LoadingSkeleton className="h-12 w-1/2" />
  </div>
) : (
  <Content />
)}
```

## Migration Guide

### Before (Old way)
```tsx
// Different loading implementations
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
<CustomSpinner />
<Loader2 className="w-4 h-4 animate-spin" />
```

### After (New unified way)
```tsx
// Consistent loading implementation
<LoadingSpinner size="lg" text="Loading..." />
<LoadingSimple size="md" />
<InlineLoading size="sm" />
```

## Benefits

1. **Consistency** - All loading states look and behave the same
2. **Maintainability** - Single source of truth for loading components
3. **Flexibility** - Multiple variants for different use cases
4. **Accessibility** - Proper ARIA labels and semantic markup
5. **Performance** - Optimized animations and minimal bundle size 