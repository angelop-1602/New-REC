"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
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
import { DocumentsType } from "@/types";
import SimplePdfViewer from "./simple-pdf-viewer";
import { enhancedDocumentManagementService } from "@/lib/services/documents/enhancedDocumentManagementService";
import { useAuth } from "@/hooks/useAuth";
import { customToast } from "@/components/ui/custom/toast";

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
  const lastPropSelectedId = React.useRef<string | undefined>(undefined);
  const [error, setError] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showAcceptDialog, setShowAcceptDialog] = React.useState(false);
  const [showReviseDialog, setShowReviseDialog] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // PDF pre-rendering cache
  const pdfCacheRef = React.useRef<Map<string, string>>(new Map());
  const preloadAbortControllersRef = React.useRef<Map<string, AbortController>>(new Map());

  // Filter out documents with "requested" status - only show uploaded documents
  const uploadedDocuments = React.useMemo(() => {
    return documents.filter(doc => {
      const docStatus = (doc as any).currentStatus || doc.status;
      return docStatus !== 'requested';
    });
  }, [documents]);

  // Auto-select document when documents change or selectedDocumentId is provided
  React.useEffect(() => {
    if (uploadedDocuments.length === 0) return;

    // Respond only when the prop selectedDocumentId changes
    if (selectedDocumentId && selectedDocumentId !== lastPropSelectedId.current) {
      const foundIndex = uploadedDocuments.findIndex(doc => doc.id === selectedDocumentId);
      if (foundIndex !== -1) {
        handleDocumentSelect(uploadedDocuments[foundIndex], foundIndex);
        lastPropSelectedId.current = selectedDocumentId;
        return;
      }
    }

    // On first load (no selection yet), select the first document
    if (!selectedDocument) {
      handleDocumentSelect(uploadedDocuments[0], 0);
      lastPropSelectedId.current = selectedDocumentId || uploadedDocuments[0].id;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedDocuments, selectedDocumentId, selectedDocument]);

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


  // Pre-render PDF function
  const preloadPdf = React.useCallback(async (document: DocumentsType) => {
    if (!submissionId || pdfCacheRef.current.has(document.id)) {
      return; // Already cached or no submissionId
    }

    // Cancel any existing preload for this document
    const existingController = preloadAbortControllersRef.current.get(document.id);
    if (existingController) {
      existingController.abort();
    }

    const abortController = new AbortController();
    preloadAbortControllersRef.current.set(document.id, abortController);

    try {
      // Get storagePath from document
      const docWithVersions = document as any;
      let documentStoragePath = document.storagePath;
      
      if (docWithVersions.versions && Array.isArray(docWithVersions.versions) && docWithVersions.versions.length > 0) {
        const currentVersion = docWithVersions.currentVersion || docWithVersions.versions.length;
        const latestVersion = docWithVersions.versions.find((v: any) => v.version === currentVersion) || 
                             docWithVersions.versions[docWithVersions.versions.length - 1];
        if (latestVersion && latestVersion.storagePath) {
          documentStoragePath = latestVersion.storagePath;
        }
      }
      
      const fileName = documentStoragePath?.split('/').pop() || 
                       document.originalFileName || 
                       `${document.id}.zip`;

      const qs = new URLSearchParams({
        submissionId,
        auto: '1',
        ...(documentStoragePath ? { storagePath: documentStoragePath } : {})
      }).toString();

      const url = `/api/documents/preview/document/${encodeURIComponent(fileName)}?${qs}`;
      
      const response = await fetch(url, { signal: abortController.signal });
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('pdf')) {
        return; // Not a PDF, skip caching
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      pdfCacheRef.current.set(document.id, blobUrl);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Preload was cancelled, ignore
        return;
      }
      console.warn(`Failed to preload PDF for document ${document.id}:`, error);
    } finally {
      preloadAbortControllersRef.current.delete(document.id);
    }
  }, [submissionId]);

  // Pre-render adjacent documents when current document changes
  React.useEffect(() => {
    if (!selectedDocument || uploadedDocuments.length === 0) return;

    // Pre-render current document
    preloadPdf(selectedDocument);

    // Pre-render next document
    if (currentIndex < uploadedDocuments.length - 1) {
      const nextDoc = uploadedDocuments[currentIndex + 1];
      preloadPdf(nextDoc);
    }

    // Pre-render previous document
    if (currentIndex > 0) {
      const prevDoc = uploadedDocuments[currentIndex - 1];
      preloadPdf(prevDoc);
    }
  }, [selectedDocument, currentIndex, uploadedDocuments, preloadPdf]);

  // Cleanup blob URLs on unmount
  React.useEffect(() => {
    return () => {
      // Revoke all cached blob URLs
      pdfCacheRef.current.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
      pdfCacheRef.current.clear();
      
      // Abort all pending preloads
      preloadAbortControllersRef.current.forEach((controller) => {
        controller.abort();
      });
      preloadAbortControllersRef.current.clear();
    };
  }, []);

  // Handle document selection
  const handleDocumentSelect = (document: DocumentsType, index: number) => {
    setSelectedDocument(document);
    setCurrentIndex(index);
    setError(null);
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
      
      customToast.success(
        "Document Accepted",
        "The document has been marked as accepted successfully."
      );
      onDocumentStatusUpdate?.(selectedDocument.id, 'accepted');
      setShowAcceptDialog(false);
    } catch (error) {
      console.error('Error accepting document:', error);
      customToast.error(
        "Accept Failed",
        "Failed to accept document. Please try again."
      );
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
      
      customToast.success(
        "Revision Requested",
        "Document revision has been requested successfully."
      );
      onDocumentStatusUpdate?.(selectedDocument.id, 'revise', comment.trim());
      setComment("");
      setShowReviseDialog(false);
      // Refresh the document to update status
      const updatedDoc = uploadedDocuments.find(d => d.id === selectedDocument.id);
      if (updatedDoc) {
        (updatedDoc as any).currentStatus = 'revise';
      }
    } catch (error) {
      console.error('Error requesting document revision:', error);
      customToast.error(
        "Request Failed",
        "Failed to request document revision. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'revise':
        return <Badge variant="default" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"><AlertTriangle className="w-3 h-3 mr-1" />Needs Revision</Badge>;
      case 'requested':
        return <Badge variant="default" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"><FileText className="w-3 h-3 mr-1" />Requested</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary" className="bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  // Check if document is already accepted
  const isDocumentAccepted = selectedDocument && ((selectedDocument as any).currentStatus === 'accepted' || selectedDocument.status === 'accepted');

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-[96vw] h-[90vh] flex flex-col transform-none animate-none overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">{selectedDocument ? selectedDocument.title || selectedDocument.originalFileName : 'Preview'}</h2>
            {selectedDocument && (
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {uploadedDocuments.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Navigation Button */}
          {selectedDocument && uploadedDocuments.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="absolute left-[2%] top-1/2 -translate-y-1/2 z-10 bg-background/80 rounded-full backdrop-blur-sm border-border hover:bg-background shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          {/* Right Navigation Button */}
          {selectedDocument && uploadedDocuments.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === uploadedDocuments.length - 1}
              className="absolute right-[32.33%] top-1/2 -translate-y-1/2 z-10 bg-background/80 rounded-full backdrop-blur-sm border-border hover:bg-background shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}

          {/* Left: Document Preview */}
          <div className="flex-[7] flex flex-col">
                 {error ? (
                   <div className="flex items-center justify-center h-full">
                     <div className="text-center">
                       <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
                       <p className="text-destructive mb-2 font-semibold">Preview Error</p>
                       <p className="text-sm text-muted-foreground">{error}</p>
                     </div>
                   </div>
                 ) : selectedDocument ? (() => {
                   // Get storagePath from document - check versions array first, then root level
                   const docWithVersions = selectedDocument as any;
                   let documentStoragePath = selectedDocument.storagePath;
                   
                   // If document has versions array, get storagePath from latest version
                   if (docWithVersions.versions && Array.isArray(docWithVersions.versions) && docWithVersions.versions.length > 0) {
                     const currentVersion = docWithVersions.currentVersion || docWithVersions.versions.length;
                     const latestVersion = docWithVersions.versions.find((v: any) => v.version === currentVersion) || 
                                          docWithVersions.versions[docWithVersions.versions.length - 1];
                     if (latestVersion && latestVersion.storagePath) {
                       documentStoragePath = latestVersion.storagePath;
                     }
                   }
                   
                   // Get filename from storagePath or use fallback
                   const fileName = documentStoragePath?.split('/').pop() || 
                                    selectedDocument.originalFileName || 
                                    `${selectedDocument.id}.zip`;
                   
                   // Get preloaded blob URL from cache if available
                   const cachedBlobUrl = pdfCacheRef.current.get(selectedDocument.id);
                   
                   return (
                     <SimplePdfViewer
                       key={selectedDocument.id} // Force re-render when document changes
                       file={fileName}
                       submissionId={submissionId || ''}
                       auto={true}
                       className="w-full h-full"
                       storagePath={documentStoragePath} // Pass the actual storagePath (from version if available)
                       preloadedBlobUrl={cachedBlobUrl} // Pass pre-rendered blob URL if available
                     />
                   );
                 })() : (
                   <div className="flex items-center justify-center h-full">
                     <span className="text-muted-foreground">No document selected</span>
                   </div>
                 )}
          </div>

          {/* Right: Document List & Actions */}
          <div className="flex-[3] flex flex-col min-h-0">
            <Card className="m-4 flex-1 min-h-0 border-border">
              <CardHeader className="flex-shrink-0 bg-card">
                <CardTitle className="text-foreground">Documents & Actions</CardTitle>
              </CardHeader>

              {/* Make CardContent a column, and keep it non-scrolling.
                  Only the ScrollArea (list) should scroll. */}
              <CardContent className="flex flex-col gap-4 p-4 flex-1 min-h-0 overflow-hidden bg-card">
                {/* Document List Section */}
                <div className="flex-1 min-h-0">
                  {/* Let the list fill the available height and be scrollable */}
                  <ScrollArea className="h-full border rounded border-border">
                    <ul className="divide-y divide-border">
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
                                <span className="truncate text-foreground">
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

                {/* Actions Section - stays pinned at the bottom, only show if document is not accepted */}
                {selectedDocument && !isDocumentAccepted && (
                  <div className="flex-shrink-0 flex flex-col gap-2 pt-4 border-t border-border bg-card">
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
                        onClick={() => {
                          if (showReviseDialog) {
                            setShowReviseDialog(false);
                            setComment("");
                          } else {
                            setShowReviseDialog(true);
                          }
                        }}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {showReviseDialog ? 'Cancel' : 'Revise'}
                      </Button>
                    </div>
                    {/* Revise textarea - shown below buttons when revise is clicked */}
                    {showReviseDialog && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Comments (required for revision)..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowReviseDialog(false);
                              setComment("");
                            }}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={submitRevise}
                            disabled={!comment.trim() || isSubmitting}
                            className="flex-1"
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Revision'}
                          </Button>
                        </div>
                      </div>
                    )}
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
      </div>
    </div>
  );
}
