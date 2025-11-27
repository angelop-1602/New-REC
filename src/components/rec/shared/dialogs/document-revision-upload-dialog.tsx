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
import { Upload, FileText, AlertCircle, MessageSquare, Eye } from "lucide-react";
import { toast } from "sonner";
import { useEnhancedDocumentUpload } from "@/hooks/useEnhancedDocumentUpload";
import { DocumentCategory } from "@/types";

interface DocumentRevisionUploadDialogProps {
  documentId: string;
  documentTitle: string;
  documentDescription: string;
  category: DocumentCategory;
  protocolId: string;
  submissionId?: string; // Add submissionId for document viewing
  storagePath?: string; // Add storagePath for document viewing
  chairpersonComment?: string;
  trigger: React.ReactNode;
  onUploadComplete?: () => void;
  open?: boolean; // External control
  onOpenChange?: (open: boolean) => void; // External control
}

export default function DocumentRevisionUploadDialog({
  documentId,
  documentTitle,
  documentDescription,
  category,
  protocolId,
  submissionId,
  storagePath,
  chairpersonComment,
  trigger,
  onUploadComplete,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: DocumentRevisionUploadDialogProps) {
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
    uploadDocumentToRequest
  } = useEnhancedDocumentUpload({
    protocolId,
    onUploadComplete: () => {
      toast.success("Document revision uploaded successfully!");
      setIsOpen(false);
      onUploadComplete?.();
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error}`);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleViewDocument = () => {
    if (!storagePath || !submissionId) {
      toast.error("Document preview not available");
      return;
    }

    // Use the same preview API as other components
    const filename = storagePath.split('/').pop();
    const previewUrl = `/api/documents/preview/document/${filename}?submissionId=${submissionId}&auto=1&storagePath=${encodeURIComponent(storagePath)}`;
    window.open(previewUrl, '_blank');
  };

  const handleUpload = async () => {
    if (!selectedFile || !protocolId) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      await uploadDocumentToRequest(
        selectedFile,
        documentTitle,
        uploadDescription,
        category,
        documentId // Pass the existing document ID as requestId
      );

      // Success handling is done in the hook's onUploadComplete callback
    } catch (error) {
      console.error("Upload error:", error);
      // Error handling is done in the hook's onUploadError callback
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setIsOpen(false);
      setSelectedFile(null);
      // Note: error state is managed by the hook, no need to reset it here
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-[#036635]/20 dark:border-[#FECC07]/30 animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#036635] dark:text-[#FECC07]" />
            <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Upload Document Revision</span>
          </DialogTitle>
          <DialogDescription>
            Upload a revised version of &quot;{documentTitle}&quot; based on the chairperson&apos;s feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Chairperson Comment Section */}
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

          {/* View Current Document Section */}
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
                  onClick={handleViewDocument}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Document
                </Button>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.doc,.docx,.zip"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                {selectedFile.name}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional notes about this revision..."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              rows={3}
              disabled={isUploading}
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Progress Display */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading revision...</span>
                <span>{progress.percentage.toFixed(0)}%</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Revision
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
