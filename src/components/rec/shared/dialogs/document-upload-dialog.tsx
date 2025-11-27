"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useEnhancedDocumentUpload } from "@/hooks/useEnhancedDocumentUpload";
import { DocumentCategory } from "@/types";

interface DocumentUploadDialogProps {
  documentId: string;
  documentTitle: string;
  documentDescription: string;
  category: DocumentCategory;
  protocolId: string;
  chairpersonComment?: string; // optional; shown for revised docs
  submissionId?: string; // optional; for previewing existing doc (revised)
  storagePath?: string; // optional; for previewing existing doc (revised)
  trigger: React.ReactNode;
  onUploadComplete?: () => void;
  // External control (shadcn best practice)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function DocumentUploadDialog({
  documentId,
  documentTitle,
  documentDescription,
  category,
  protocolId,
  chairpersonComment,
  submissionId,
  storagePath,
  trigger,
  onUploadComplete,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: DocumentUploadDialogProps) {
  // Use external control if provided, otherwise use internal state
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState(documentDescription);

  const {
    isUploading,
    progress,
    error,
    uploadedDocumentId,
    uploadDocumentToRequest,
    validateFile,
    resetUploadState
  } = useEnhancedDocumentUpload({
    protocolId,
    onUploadComplete: () => {
      toast.success("Document uploaded successfully!");
      setIsOpen(false);
      onUploadComplete?.();
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error}`);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      await uploadDocumentToRequest(
        selectedFile,
        documentTitle,
        uploadDescription,
        category,
        documentId // This will fulfill the existing request
      );
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setSelectedFile(null);
      setUploadDescription(documentDescription);
      resetUploadState();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-[#036635]/20 dark:border-[#FECC07]/30 animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#036635] dark:text-[#FECC07]" />
            <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Upload Document</span>
          </DialogTitle>
          <DialogDescription>
            Upload the document: <strong>{documentTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Optional current document preview action (for revised docs) */}
          {storagePath && submissionId && (
            <div className="space-y-2">
              <Label>Current Document</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{documentTitle}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const filename = storagePath.split('/').pop();
                    const previewUrl = `/api/documents/preview/document/${filename}?submissionId=${submissionId}&auto=1&storagePath=${encodeURIComponent(storagePath)}`;
                    window.open(previewUrl, '_blank');
                  }}
                  className="flex items-center gap-2"
                >
                  View Document
                </Button>
              </div>
            </div>
          )}

   

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Add any additional context about this document..."
              rows={3}
            />
          </div>
       {/* Optional Chairperson Comment (shown for revised docs) */}
       {chairpersonComment && (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-sm">Chairperson&apos;s Feedback:</p>
                  <p className="text-sm text-muted-foreground p-2 rounded">
                    {chairpersonComment}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              disabled={isUploading}
            />
            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{progress.percentage.toFixed(0)}%</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
            </div>
          )}

          {/* Success State */}
          {uploadedDocumentId && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Document uploaded successfully! The document is now pending review.
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="min-w-[100px]"
            >
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
