"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText } from "lucide-react";
import { DocumentRequirement } from "@/types";

export interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (requirement: DocumentRequirement) => void;
}

export const AddDocumentDialog: React.FC<AddDocumentDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [allowMultiple, setAllowMultiple] = useState<"single" | "multiple">("single");

  const handleClose = () => {
    setDocumentTitle("");
    setDocumentDescription("");
    setAllowMultiple("single");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentTitle.trim()) {
      return;
    }

    // Generate unique ID for the custom document requirement
    const customRequirement: DocumentRequirement = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: documentTitle.trim(),
      description: documentDescription.trim() || "Custom document uploaded by user",
      required: false, // Custom documents are always optional
      multiple: allowMultiple === "multiple",
      category: "custom",
    };

    onAdd?.(customRequirement);
    handleClose();
  };

  const canSubmit = documentTitle.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Custom Document
          </DialogTitle>
          <DialogDescription>
            Create a custom document requirement that will appear in your supplementary documents section.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Title */}
          <div className="space-y-2">
            <Label htmlFor="documentTitle">
              Document Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="documentTitle"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g., Additional Survey Tool, Ethics Clearance Letter"
              required
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              This will be the title shown in your document list
            </p>
          </div>

          {/* Document Description */}
          <div className="space-y-2">
            <Label htmlFor="documentDescription">
              Description <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="documentDescription"
              value={documentDescription}
              onChange={(e) => setDocumentDescription(e.target.value)}
              placeholder="Brief description of what this document contains or why it's needed"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Help reviewers understand the purpose of this document
            </p>
          </div>

          {/* File Upload Type */}
          <div className="space-y-3">
            <Label>File Upload Type</Label>
            <RadioGroup
              value={allowMultiple}
              onValueChange={(value) => setAllowMultiple(value as "single" | "multiple")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="text-sm">Single file only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple" id="multiple" />
                <Label htmlFor="multiple" className="text-sm">Allow multiple files</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Choose whether users can upload one file or multiple files for this document
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">What happens next?</p>
                <p className="text-blue-700 mt-1">
                  This custom document will appear in your Supplementary Documents section 
                  where you can upload the actual files before submitting your application.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              Add Document Requirement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 