"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Download, 
  Pencil, 
  FileText, 
  Image, 
  Archive,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { DocumentsType } from "@/types/documents.types";
import SimplePdfViewer from "./simple-pdf-viewer";
import { enhancedDocumentManagementService } from "@/lib/services/enhancedDocumentManagementService";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface InlineDocumentPreviewProps {
  documents: DocumentsType[];
  submissionId?: string;
  protocolId?: string; // Add protocolId for document status updates
  isPreviewOpen?: boolean;
  selectedDocumentId?: string; // Add prop to specify which document to start with
  onDocumentStatusUpdate?: (documentId: string, status: 'accepted' | 'revise', comment?: string) => void;
  onClose?: () => void;
}

export default function InlineDocumentPreview({ 
  documents, 
  submissionId,
  protocolId,
  isPreviewOpen = true,
  selectedDocumentId,
  onDocumentStatusUpdate,
  onClose 
}: InlineDocumentPreviewProps) {
  const { user } = useAuth();
  const [selectedDocument, setSelectedDocument] = React.useState<DocumentsType | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<'accepted' | 'revise'>('accepted');
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showAcceptDialog, setShowAcceptDialog] = React.useState(false);
  const [showReviseDialog, setShowReviseDialog] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Filter out documents with "requested" status - only show uploaded documents
  const uploadedDocuments = React.useMemo(() => {
    return documents.filter(doc => {
      const docStatus = (doc as any).currentStatus || doc.status;
      return docStatus !== 'requested';
    });
  }, [documents]);

  // Auto-select document when documents change or selectedDocumentId is provided
  React.useEffect(() => {
    if (uploadedDocuments.length > 0) {
      let documentToSelect = uploadedDocuments[0];
      let indexToSelect = 0;
      
      // If a specific document ID is provided, try to find and select it
      if (selectedDocumentId) {
        const foundIndex = uploadedDocuments.findIndex(doc => doc.id === selectedDocumentId);
        if (foundIndex !== -1) {
          documentToSelect = uploadedDocuments[foundIndex];
          indexToSelect = foundIndex;
        }
      }
      
      // Only select if no document is currently selected or if we found a specific document
      if (!selectedDocument || selectedDocumentId) {
        handleDocumentSelect(documentToSelect, indexToSelect);
      }
    }
  }, [uploadedDocuments, selectedDocumentId]);

  // Prevent background scrolling when preview is open
  React.useEffect(() => {
    if (isPreviewOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPreviewOpen]);

  // Get file type icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-4 h-4" />;
      case 'zip':
        return <Archive className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get file type for preview
  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
    if (['txt', 'md', 'json', 'xml', 'csv'].includes(extension || '')) return 'text';
    if (['zip'].includes(extension || '')) return 'zip';
    return 'other';
  };

  // Handle document selection
  const handleDocumentSelect = (document: DocumentsType, index: number) => {
    setSelectedDocument(document);
    setCurrentIndex(index);
    setError(null);

    console.log('Document selected:', {
      id: document.id,
      title: document.title,
      originalFileName: document.originalFileName,
      storagePath: document.storagePath
    });
    
    console.log('File parameter will be:', document.storagePath?.split('/').pop() || document.originalFileName || `${document.id}.zip`);
  };

  // Navigate to previous document
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      handleDocumentSelect(uploadedDocuments[newIndex], newIndex);
    }
  };

  // Navigate to next document
  const handleNext = () => {
    if (currentIndex < uploadedDocuments.length - 1) {
      const newIndex = currentIndex + 1;
      handleDocumentSelect(uploadedDocuments[newIndex], newIndex);
    }
  };

  // Accept document
  const confirmAccept = async () => {
    if (!selectedDocument || !protocolId || !user) return;
    
    setIsSubmitting(true);
    try {
      await enhancedDocumentManagementService.updateDocumentStatus(
        protocolId,
        selectedDocument.id,
        'accepted',
        undefined, // No comment needed for acceptance
        user.uid
      );
      
      toast.success('Document accepted successfully');
      onDocumentStatusUpdate?.(selectedDocument.id, 'accepted');
      setShowAcceptDialog(false);
    } catch (error) {
      console.error('Error accepting document:', error);
      toast.error('Failed to accept document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revise document
  const submitRevise = async () => {
    if (!selectedDocument || !protocolId || !user) return;
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await enhancedDocumentManagementService.updateDocumentStatus(
        protocolId,
        selectedDocument.id,
        'revise',
        comment.trim(),
        user.uid
      );
      
      toast.success('Document revision requested successfully');
      onDocumentStatusUpdate?.(selectedDocument.id, 'revise', comment.trim());
      setComment("");
      setShowReviseDialog(false);
    } catch (error) {
      console.error('Error requesting document revision:', error);
      toast.error('Failed to request document revision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'revise':
        return <Badge variant="default" className="bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3 mr-1" />Needs Revision</Badge>;
      case 'requested':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" />Requested</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-[96vw] h-[90vh] flex flex-col transform-none animate-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">{selectedDocument ? selectedDocument.title || selectedDocument.originalFileName : 'Preview'}</h2>
            {selectedDocument && (
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {uploadedDocuments.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
             {selectedDocument && (
               <>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handlePrevious}
                   disabled={currentIndex === 0}
                 >
                   <ChevronLeft className="w-4 h-4" />
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleNext}
                   disabled={currentIndex === uploadedDocuments.length - 1}
                 >
                   <ChevronRight className="w-4 h-4" />
                 </Button>
               </>
             )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Document Preview */}
          <div className="flex-[7] flex flex-col">
            <Card className="h-full m-4">
              <CardContent className="p-0 h-[calc(90vh-120px)] overflow-hidden">
                 {error ? (
                   <div className="flex items-center justify-center h-full">
                     <div className="text-center">
                       <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                       <p className="text-red-600 mb-2">Preview Error</p>
                       <p className="text-sm text-muted-foreground">{error}</p>
                     </div>
                   </div>
                 ) : selectedDocument ? (
                   <SimplePdfViewer
                     key={selectedDocument.id} // Force re-render when document changes
                     file={selectedDocument.storagePath?.split('/').pop() || selectedDocument.originalFileName || `${selectedDocument.id}.zip`}
                     submissionId={submissionId || ''}
                     auto={true}
                     className="w-full h-full"
                     storagePath={selectedDocument.storagePath} // Pass the actual storagePath
                   />
                 ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-muted-foreground">No document selected</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Document List & Actions */}
          <div className="flex-[3] flex flex-col min-h-0">
            <Card className="m-4 flex-1 min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Documents & Actions</CardTitle>
              </CardHeader>

              {/* Make CardContent a column, and keep it non-scrolling.
                  Only the ScrollArea (list) should scroll. */}
              <CardContent className="flex flex-col gap-4 p-4 flex-1 min-h-0 overflow-hidden">
                {/* Document List Section */}
                <div className="flex-1 min-h-0">
                  {/* Let the list fill the available height and be scrollable */}
                  <ScrollArea className="h-full border rounded">
                    <ul className="divide-y">
                      {uploadedDocuments.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">
                          No uploaded documents found
                        </li>
                      ) : (
                        uploadedDocuments.map((doc, index) => (
                          <li
                            key={doc.id}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors ${
                              selectedDocument?.id === doc.id ? "bg-muted" : ""
                            }`}
                            onClick={() => handleDocumentSelect(doc, index)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getFileIcon(doc.originalFileName || doc.title || "")}
                                <span className="truncate">
                                  {doc.title || doc.originalFileName || "Untitled"}
                                </span>
                              </div>
                              {getStatusBadge((doc as any).currentStatus || doc.status)}
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </ScrollArea>
                </div>

                {/* Actions Section - stays pinned at the bottom */}
                {selectedDocument && (
                  <div className="flex-shrink-0 flex flex-col gap-2 pt-4 border-t bg-white">
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowAcceptDialog(true)}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowReviseDialog(true)}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Revise
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        
        </div>
        {/* Accept Dialog */}
        <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Accept document?</DialogTitle>
              <DialogDescription>
                This will mark the selected document as accepted and ready for review.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAcceptDialog(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={confirmAccept} disabled={isSubmitting}>
                {isSubmitting ? 'Accepting...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revise Dialog */}
        <Dialog open={showReviseDialog} onOpenChange={setShowReviseDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request revision</DialogTitle>
              <DialogDescription>
                Add comments explaining what needs to be revised.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Textarea
                placeholder="Comments (required for revision)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReviseDialog(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={submitRevise} disabled={!comment.trim() || isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
