"use client";

import React, { useState, useEffect } from "react";
import { InformationType, DocumentsType } from "@/types";
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import DocumentUploadDialog from "@/components/rec/shared/dialogs/document-upload-dialog";
import DocumentRevisionUploadDialog from "@/components/rec/shared/dialogs/document-revision-upload-dialog";
import { enhancedDocumentManagementService } from "@/lib/services/documents/enhancedDocumentManagementService";
import { toast } from "sonner";
import { useRealtimeDocuments } from "@/hooks/useRealtimeDocuments";
import { useRealtimeProtocol } from "@/hooks/useRealtimeProtocol";
import { ProtocolDocumentsCard } from "./protocol-overview/protocol-documents-card";
import { ProtocolInformationCard } from "./protocol-overview/protocol-information-card";

interface ProtocolOverviewProps {
  information: InformationType;
  documents?: DocumentsType[];
  userType: "proponent" | "reviewer" | "chairperson";
  showDocuments?: boolean;
  protocolId: string;
  submissionId: string;
  onDocumentStatusUpdate?: () => void;
  onDocumentEdit?: (documentId: string) => void;
  onProtocolUpdate?: (protocol: Record<string, unknown>) => void;
}

export default function ProtocolOverview({
  information,
  documents: initialDocuments = [],
  userType,
  showDocuments = true,
  protocolId,
  submissionId,
  onDocumentStatusUpdate,
  onDocumentEdit: _onDocumentEdit, // eslint-disable-line @typescript-eslint/no-unused-vars
  onProtocolUpdate,
}: ProtocolOverviewProps) {
  // ⚡ Use real-time protocol hook for all protocol data updates
  const { protocol: realtimeProtocol, loading: protocolLoading } = useRealtimeProtocol({
    protocolId: submissionId,
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: true,
  });

  // ⚡ Use real-time documents hook for document updates
  const { documents: realtimeDocs, loading: documentsLoading } = useRealtimeDocuments({
    protocolId: submissionId,
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: true,
  });

  // Use realtime data if available, fallback to initial props
  const protocol = realtimeProtocol || { information };
  const displayInformation = protocol.information || information;
  const documents = realtimeDocs.length > 0 ? realtimeDocs : initialDocuments;
  const loading = protocolLoading || documentsLoading;

  // Notify parent of protocol updates
  React.useEffect(() => {
    if (realtimeProtocol && onProtocolUpdate) {
      onProtocolUpdate(realtimeProtocol);
    }
  }, [realtimeProtocol, onProtocolUpdate]);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedDocumentForPreview, setSelectedDocumentForPreview] = useState<string | null>(null);
  const [, setRefreshKey] = useState(0);
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [selectedDocumentForAction, setSelectedDocumentForAction] = useState<DocumentsType | null>(null);
  
  // Collapsible states for reviewers
  const [isStudyDetailsOpen, setIsStudyDetailsOpen] = useState(false);
  const [isDurationParticipantsOpen, setIsDurationParticipantsOpen] = useState(false);

  // Update refreshKey when documents change (for preview component)
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [documents]);

  const handleRequestCreated = async () => {
    // Real-time listener will automatically update documents
    if (onDocumentStatusUpdate) {
      onDocumentStatusUpdate();
    }
    
    console.log("✅ Request created - real-time listener will update UI");
  };

  const handlePreviewDocument = (documentId: string) => {
    // For chairperson, use inline preview
    if (userType === 'chairperson') {
      setSelectedDocumentForPreview(documentId);
      setIsPreviewOpen(true);
      return;
    }
    
    // For proponent and reviewer, open in new tab
    const document = documents.find(doc => doc.id === documentId);
    if (!document) {
      toast.error("Document not found");
      return;
    }
    
    // Build preview URL
    const filename = document.storagePath 
      ? document.storagePath.split('/').pop() 
      : document.originalFileName || document.id;
    
    if (!filename) {
      toast.error("Document filename not available");
      return;
    }
    
    const params = new URLSearchParams({
      submissionId: submissionId,
      auto: '1'
    });
    
    // Add storagePath if available
    if (document.storagePath) {
      params.set('storagePath', document.storagePath);
    }
    
    const previewUrl = `/api/documents/preview/document/${encodeURIComponent(filename)}?${params.toString()}`;
    window.open(previewUrl, '_blank');
  };

  const handleDownloadDocument = async (document: DocumentsType) => {
    if (document.downloadUrl) {
      window.open(document.downloadUrl, '_blank');
    }
  };

  const handleCancelRequest = async (documentId: string) => {
    try {
      await enhancedDocumentManagementService.cancelDocumentRequest(submissionId, documentId);
      toast.success("Document request cancelled successfully");
      
      // Real-time listener will automatically update the list
      if (onDocumentStatusUpdate) {
        onDocumentStatusUpdate();
      }
      
      console.log("✅ Request cancelled - real-time listener will update UI");
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel document request");
    }
  };

  const handleUploadComplete = async () => {
    // Real-time listener will automatically update documents
    // Just close dialogs and notify parent
    setUploadDialogOpen(false);
    setRevisionDialogOpen(false);
    setSelectedDocumentForAction(null);
    
    if (onDocumentStatusUpdate) {
      onDocumentStatusUpdate();
    }
    
    console.log("✅ Upload complete - real-time listener will update UI");
  };

  const handleOpenUploadDialog = (document: DocumentsType) => {
    setSelectedDocumentForAction(document);
    setUploadDialogOpen(true);
  };

  const handleOpenRevisionDialog = (document: DocumentsType) => {
    setSelectedDocumentForAction(document);
    setRevisionDialogOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedDocumentForPreview(null);
  };

  if (!displayInformation) {
    return null;
  }

  // For reviewers, use single column layout; for others, use 2 columns on large screens
  const isReviewer = userType === "reviewer";
  
  return (
    <div className={`grid ${isReviewer ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
      {/* For reviewers, show Documents first */}
      {isReviewer && showDocuments && (
        <ProtocolDocumentsCard
          documents={documents}
          loading={loading}
          userType={userType}
          submissionId={submissionId}
          protocolId={protocolId}
          isPreviewOpen={isPreviewOpen}
          selectedDocumentForPreview={selectedDocumentForPreview}
          onPreviewDocument={handlePreviewDocument}
          onDownloadDocument={handleDownloadDocument}
          onUploadDocument={undefined}
          onUploadRevision={undefined}
          onCancelRequest={undefined}
          onRequestCreated={handleRequestCreated}
          onDocumentStatusUpdate={onDocumentStatusUpdate}
          onClosePreview={handleClosePreview}
        />
      )}
      
      <ProtocolInformationCard
        information={displayInformation}
        isReviewer={isReviewer}
        isStudyDetailsOpen={isStudyDetailsOpen}
        onStudyDetailsOpenChange={setIsStudyDetailsOpen}
        isDurationParticipantsOpen={isDurationParticipantsOpen}
        onDurationParticipantsOpenChange={setIsDurationParticipantsOpen}
      />

      {/* For non-reviewers, show Documents after Protocol Information */}
      {!isReviewer && showDocuments && (
        <ProtocolDocumentsCard
          documents={documents}
          loading={loading}
          userType={userType}
          submissionId={submissionId}
          protocolId={protocolId}
          isPreviewOpen={isPreviewOpen}
          selectedDocumentForPreview={selectedDocumentForPreview}
          onPreviewDocument={handlePreviewDocument}
          onDownloadDocument={handleDownloadDocument}
          onUploadDocument={userType === 'proponent' ? handleOpenUploadDialog : undefined}
          onUploadRevision={userType === 'proponent' ? handleOpenRevisionDialog : undefined}
          onCancelRequest={userType === 'chairperson' ? handleCancelRequest : undefined}
          onRequestCreated={handleRequestCreated}
          onDocumentStatusUpdate={onDocumentStatusUpdate}
          onClosePreview={handleClosePreview}
        />
      )}

      {/* Upload Dialog for Requested Documents */}
      {selectedDocumentForAction && uploadDialogOpen && (
        <DocumentUploadDialog
          documentId={selectedDocumentForAction.id}
          documentTitle={selectedDocumentForAction.title}
          documentDescription={selectedDocumentForAction.description || ''}
          category={selectedDocumentForAction?.category || 'basic'}
          protocolId={submissionId}
          submissionId={submissionId}
          trigger={<div />}
          onUploadComplete={handleUploadComplete}
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
        />
      )}

      {/* Revision Dialog for Documents Needing Revision */}
      {selectedDocumentForAction && revisionDialogOpen && (
        <DocumentRevisionUploadDialog
          documentId={selectedDocumentForAction.id}
          documentTitle={selectedDocumentForAction.title}
          documentDescription={selectedDocumentForAction.description || ''}
          category={selectedDocumentForAction?.category || 'basic'}
          protocolId={submissionId}
          submissionId={submissionId}
          storagePath={selectedDocumentForAction.storagePath}
          chairpersonComment={selectedDocumentForAction?.chairpersonComment as string | undefined}
          trigger={<div />}
          onUploadComplete={handleUploadComplete}
          open={revisionDialogOpen}
          onOpenChange={setRevisionDialogOpen}
        />
      )}
    </div>
  );
}
