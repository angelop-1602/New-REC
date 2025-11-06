"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { DocumentsType } from "@/types/documents.types";

interface DocumentPreviewButtonProps {
  documents: DocumentsType[];
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  onDocumentStatusUpdate?: (documentId: string, status: 'accepted' | 'revise', comment?: string) => void;
  onPreviewToggle?: (documentId?: string) => void;
  isPreviewOpen?: boolean;
  documentId?: string; // Add prop for specific document ID
}

export default function DocumentPreviewButton({
  documents,
  variant = "ghost",
  size = "sm",
  className,
  disabled = false,
  children,
  onDocumentStatusUpdate,
  onPreviewToggle,
  isPreviewOpen = false,
  documentId
}: DocumentPreviewButtonProps) {
  const handlePreview = () => {
    if (documents.length === 0) return;
    onPreviewToggle?.(documentId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || documents.length === 0}
      onClick={handlePreview}
    >
      {children || (
        <>
          <Eye className="w-4 h-4 mr-2" />
          {isPreviewOpen ? 'Hide Preview' : 'Preview Documents'}
        </>
      )}
    </Button>
  );
}
