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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  MessageSquare,
  FileText
} from "lucide-react";
import { DocumentsType, DocumentStatus } from "@/types";
import { enhancedDocumentManagementService } from "@/lib/services/documents/enhancedDocumentManagementService";
import { toast } from "sonner";

interface DocumentReviewDialogProps {
  document: DocumentsType;
  protocolId: string;
  trigger?: React.ReactNode;
  onStatusUpdate?: () => void;
  // External control (shadcn best practice)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const STATUS_OPTIONS: Array<{
  value: DocumentStatus;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}> = [
  {
    value: 'accepted',
    label: 'Accepted',
    description: 'Document is good and ready for review',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  {
    value: 'rejected',
    label: 'Rejected',
    description: 'Document is rejected and needs to be resubmitted',
    icon: XCircle,
    color: 'text-red-600'
  },
  {
    value: 'rework',
    label: 'Needs Rework',
    description: 'Document needs adjustment/improvement',
    icon: AlertTriangle,
    color: 'text-orange-600'
  },
  {
    value: 'revise',
    label: 'Needs Revision',
    description: 'Document needs to be edited/revised',
    icon: AlertTriangle,
    color: 'text-yellow-600'
  }
];

export default function DocumentReviewDialog({
  document,
  protocolId,
  trigger,
  onStatusUpdate,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: DocumentReviewDialogProps) {
  // Use external control if provided, otherwise use internal state
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus>(
    document.status === 'pending' ? 'accepted' : (document.status || 'accepted')
  );
  const [comment, setComment] = useState(document.chairpersonComment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await enhancedDocumentManagementService.updateDocumentStatus(
        protocolId,
        document.id,
        selectedStatus,
        comment.trim() || undefined,
        'current-chairperson-id' // TODO: Get actual chairperson ID from auth context
      );
      
      toast.success('Document status updated successfully');
      onStatusUpdate?.();
      setOpen(false);
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDocumentName = (doc: DocumentsType) => {
    if (doc.title) return doc.title;
    if (doc.originalFileName) return doc.originalFileName;
    return doc.id?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown Document';
  };

  const currentStatusOption = STATUS_OPTIONS.find(opt => opt.value === (document.status || 'accepted')) || 
                            (document.status === 'pending' ? { 
                              value: 'pending' as DocumentStatus, 
                              label: 'Pending Review', 
                              icon: Clock, 
                              color: 'text-gray-600' 
                            } : STATUS_OPTIONS[0]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Review Document
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md border-[#036635]/20 dark:border-[#FECC07]/30 animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#036635] dark:text-[#FECC07]" />
            <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Review Document</span>
          </DialogTitle>
          <DialogDescription>
            Set the status and add comments for this document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{formatDocumentName(document)}</h4>
                {document.version && document.version > 1 && (
                  <p className="text-xs text-muted-foreground">Version {document.version}</p>
                )}
              </div>
              
              {currentStatusOption && (
                <div className="flex items-center gap-1">
                  <currentStatusOption.icon className={`w-4 h-4 ${currentStatusOption.color}`} />
                  <Badge variant="outline" className="text-xs">
                    {currentStatusOption.label}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Document Status</Label>
            <RadioGroup 
              value={selectedStatus} 
              onValueChange={(value) => setSelectedStatus(value as DocumentStatus)}
              className="space-y-2"
            >
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <div 
                    key={option.value}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedStatus(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div className="flex items-center gap-2 flex-1">
                      <Icon className={`w-4 h-4 ${option.color}`} />
                      <div className="flex-1">
                        <label 
                          htmlFor={option.value}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {option.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

           {/* Comment - Show for revise and rework status */}
           {(selectedStatus === 'revise' || selectedStatus === 'rework') && (
             <div className="space-y-2">
               <Label htmlFor="comment" className="text-sm font-medium">
                 Comments <span className="text-red-500">*</span>
               </Label>
               <Textarea
                 id="comment"
                 placeholder={`Please specify what needs to be ${selectedStatus === 'revise' ? 'revised' : 'reworked'} (required)...`}
                 value={comment}
                 onChange={(e) => setComment(e.target.value)}
                 rows={3}
                 className="resize-none"
               />
               {!comment.trim() && (
                 <Alert>
                   <AlertTriangle className="h-4 w-4" />
                   <AlertDescription className="text-xs">
                     Comments are required when marking a document for {selectedStatus === 'revise' ? 'revision' : 'rework'}.
                   </AlertDescription>
                 </Alert>
               )}
             </div>
           )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting || 
                ((selectedStatus === 'revise' || selectedStatus === 'rework') && !comment.trim()) ||
                (selectedStatus === document.status && comment === (document.chairpersonComment || ''))
              }
            >
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
