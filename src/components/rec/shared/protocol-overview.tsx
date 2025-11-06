"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InformationType } from "@/types/information.types";
import { DocumentsType } from "@/types/documents.types";
import { User, MapPin, Calendar, Users, FileText, GraduationCap, Eye, Download, CheckCircle, Clock, XCircle, AlertCircle, MoreVertical, Upload, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import InlineDocumentPreview from "@/components/ui/custom/inline-document-preview";
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import DocumentRequestDialog from "@/components/rec/shared/dialogs/document-request-dialog";
import DocumentUploadDialog from "@/components/rec/shared/dialogs/document-upload-dialog";
import DocumentRevisionUploadDialog from "@/components/rec/shared/dialogs/document-revision-upload-dialog";
import { enhancedDocumentManagementService } from "@/lib/services/enhancedDocumentManagementService";
import { toast } from "sonner";
import { useRealtimeDocuments } from "@/hooks/useRealtimeDocuments";
import { useRealtimeProtocol } from "@/hooks/useRealtimeProtocol";

interface ProtocolOverviewProps {
  information: InformationType;
  documents?: DocumentsType[];
  userType: "proponent" | "reviewer" | "chairperson";
  showDocuments?: boolean;
  protocolId: string;
  submissionId: string;
  onDocumentStatusUpdate?: () => void;
  onDocumentEdit?: (documentId: string) => void;
  onProtocolUpdate?: (protocol: any) => void; // New callback for protocol updates
}

export default function ProtocolOverview({
  information,
  documents: initialDocuments = [],
  userType,
  showDocuments = true,
  protocolId,
  submissionId,
  onDocumentStatusUpdate,
  onDocumentEdit,
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
  const [refreshKey, setRefreshKey] = useState(0);
  
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "revise":
        return (
          <Badge variant="default" className="bg-amber-100 text-amber-800 border-amber-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Needs Revision
          </Badge>
        );
      case "requested":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
            <FileText className="w-3 h-3 mr-1" />
            Requested
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {status || "Pending"}
          </Badge>
        );
    }
  };

  const handlePreviewDocument = (documentId: string) => {
    setSelectedDocumentForPreview(documentId);
    setIsPreviewOpen(true);
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

  if (!displayInformation) {
    return null;
  }

  // For reviewers, use single column layout; for others, use 2 columns on large screens
  const isReviewer = userType === "reviewer";
  
  // Render Documents card component
  const renderDocumentsCard = () => (
    showDocuments && (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documents
            </CardTitle>
            {userType === "chairperson" && (
              <DocumentRequestDialog
                protocolId={submissionId}
                existingDocuments={documents}
                onRequestCreated={handleRequestCreated}
                trigger={
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Request Documents
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          ) : documents && documents.length > 0 ? (
            <>
              {!isPreviewOpen ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Document Name</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((document) => (
                          <TableRow key={document.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{document.title}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge((document as any).currentStatus || document.status || 'pending')}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {(() => {
                                    const docStatus = (document as any).currentStatus || document.status;
                                    
                                    // If document is requested
                                    if (docStatus === 'requested') {
                                      // Proponent can upload
                                      if (userType === 'proponent') {
                                        return (
                                          <DropdownMenuItem
                                            onClick={() => handleOpenUploadDialog(document)}
                                          >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload Document
                                          </DropdownMenuItem>
                                        );
                                      }
                                      
                                      // Chairperson can cancel
                                      if (userType === 'chairperson') {
                                        return (
                                          <DropdownMenuItem
                                            onClick={() => handleCancelRequest(document.id)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Cancel Request
                                          </DropdownMenuItem>
                                        );
                                      }
                                      
                                      // Reviewer has no actions
                                      return (
                                        <DropdownMenuItem disabled>
                                          No actions available
                                        </DropdownMenuItem>
                                      );
                                    }
                                    
                                    // If document needs revision
                                    if (docStatus === 'revise') {
                                      // Proponent can upload revision
                                      if (userType === 'proponent') {
                                        return (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() => handleOpenRevisionDialog(document)}
                                            >
                                              <Upload className="h-4 w-4 mr-2" />
                                              Upload Revision
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handlePreviewDocument(document.id)}
                                            >
                                              <Eye className="h-4 w-4 mr-2" />
                                              Preview Document
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleDownloadDocument(document)}
                                            >
                                              <Download className="h-4 w-4 mr-2" />
                                              Download Document
                                            </DropdownMenuItem>
                                          </>
                                        );
                                      }
                                    }
                                    
                                    // For all other statuses, show preview/download
                                    return (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => handlePreviewDocument(document.id)}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          Preview Document
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDownloadDocument(document)}
                                        >
                                          <Download className="h-4 w-4 mr-2" />
                                          Download Document
                                        </DropdownMenuItem>
                                      </>
                                    );
                                  })()}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <InlineDocumentPreview
                  documents={documents}
                  submissionId={submissionId}
                  protocolId={protocolId}
                  isPreviewOpen={isPreviewOpen}
                  selectedDocumentId={selectedDocumentForPreview || undefined}
                  onDocumentStatusUpdate={onDocumentStatusUpdate}
                  onClose={() => {
                    setIsPreviewOpen(false);
                    setSelectedDocumentForPreview(null);
                  }}
                />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No documents available</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  );
  
  return (
    <div className={`grid ${isReviewer ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
      {/* For reviewers, show Documents first */}
      {isReviewer && renderDocumentsCard()}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Protocol Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
              <User className="h-4 w-4" />
              General Information
            </h3>
            <div className={`grid ${isReviewer ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3 text-sm`}>
              <div>
                <p className="text-muted-foreground">Principal Investigator</p>
                <p className="font-medium">{displayInformation.general_information.principal_investigator.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{displayInformation.general_information.principal_investigator.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contact Number</p>
                <p className="font-medium">{displayInformation.general_information.principal_investigator.contact_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Position & Institution</p>
                <p className="font-medium">
                  {displayInformation.general_information.principal_investigator.position_institution || ''}
                </p>
              </div>
              {displayInformation.general_information.principal_investigator.course_program && (
                <div>
                  <p className="text-muted-foreground">Course/Program</p>
                  <p className="font-medium">{displayInformation.general_information.principal_investigator.course_program}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{displayInformation.general_information.principal_investigator.address}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Adviser</p>
                <p className="font-medium">{displayInformation.general_information.adviser.name}</p>
              </div>
            </div>

            {displayInformation.general_information.co_researchers && displayInformation.general_information.co_researchers.length > 0 && (
              <div className="mt-3">
                <p className="text-muted-foreground text-sm mb-2">Co-Researchers</p>
                <div className="flex flex-wrap gap-2">
                  {displayInformation.general_information.co_researchers.map((researcher: any, index: number) => (
                    <Badge key={index} variant="secondary">
                      {researcher.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isReviewer ? (
            <Collapsible open={isStudyDetailsOpen} onOpenChange={setIsStudyDetailsOpen} className="pt-4 border-t">
              <CollapsibleTrigger className="w-full">
                <h3 className="font-semibold text-sm text-primary flex items-center justify-between w-full hover:text-primary/80">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Study Details
                  </span>
                  {isStudyDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </h3>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nature of Study</p>
                    <p className="font-medium">{information.nature_and_type_of_study.level}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type of Study</p>
                    <p className="font-medium">{information.nature_and_type_of_study.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Study Site</p>
                    <p className="font-medium">
                      {information.study_site?.location === "within" ? "Within University" : information.study_site?.outside_specify || "Outside University"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Source of Funding</p>
                    <p className="font-medium">
                      {information.source_of_funding?.selected === "pharmaceutical_company" 
                        ? information.source_of_funding?.pharmaceutical_company_specify 
                        : information.source_of_funding?.selected === "others"
                        ? information.source_of_funding?.others_specify
                        : information.source_of_funding?.selected || ''}
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Study Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Nature of Study</p>
                  <p className="font-medium">{information.nature_and_type_of_study.level}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type of Study</p>
                  <p className="font-medium">{information.nature_and_type_of_study.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Study Site</p>
                  <p className="font-medium">
                    {information.study_site?.location === "within" ? "Within University" : information.study_site?.outside_specify || "Outside University"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Source of Funding</p>
                  <p className="font-medium">
                    {information.source_of_funding?.selected === "pharmaceutical_company" 
                      ? information.source_of_funding?.pharmaceutical_company_specify 
                      : information.source_of_funding?.selected === "others"
                      ? information.source_of_funding?.others_specify
                      : information.source_of_funding?.selected || ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isReviewer ? (
            <Collapsible open={isDurationParticipantsOpen} onOpenChange={setIsDurationParticipantsOpen} className="pt-4 border-t">
              <CollapsibleTrigger className="w-full">
                <h3 className="font-semibold text-sm text-primary flex items-center justify-between w-full hover:text-primary/80">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Duration & Participants
                  </span>
                  {isDurationParticipantsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </h3>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{information.duration_of_study?.start_date || ''}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End Date</p>
                    <p className="font-medium">{information.duration_of_study?.end_date || ''}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Number of Participants</p>
                    <p className="font-medium">{information.participants?.number_of_participants || ''}</p>
                  </div>
                </div>
                {information.participants?.type_and_description && (
                  <div className="mt-2">
                    <p className="text-muted-foreground text-sm mb-1">Participant Description</p>
                    <p className="text-sm">{information.participants.type_and_description}</p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Duration & Participants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{information.duration_of_study?.start_date || ''}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">{information.duration_of_study?.end_date || ''}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Number of Participants</p>
                  <p className="font-medium">{information.participants?.number_of_participants || ''}</p>
                </div>
              </div>
              {information.participants?.type_and_description && (
                <div className="mt-2">
                  <p className="text-muted-foreground text-sm mb-1">Participant Description</p>
                  <p className="text-sm">{information.participants.type_and_description}</p>
                </div>
              )}
            </div>
          )}

          {information.brief_description_of_study && (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold text-sm text-primary">Brief Description of Study</h3>
              <p className="text-sm text-muted-foreground">{information.brief_description_of_study}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* For non-reviewers, show Documents after Protocol Information */}
      {!isReviewer && renderDocumentsCard()}

      {/* Upload Dialog for Requested Documents */}
      {selectedDocumentForAction && uploadDialogOpen && (
        <DocumentUploadDialog
          documentId={selectedDocumentForAction.id}
          documentTitle={selectedDocumentForAction.title}
          documentDescription={selectedDocumentForAction.description || ''}
          category={(selectedDocumentForAction as any).category || 'basic'}
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
          category={(selectedDocumentForAction as any).category || 'basic'}
          protocolId={submissionId}
          submissionId={submissionId}
          storagePath={selectedDocumentForAction.storagePath}
          chairpersonComment={(selectedDocumentForAction as any).chairpersonComment}
          trigger={<div />}
          onUploadComplete={handleUploadComplete}
          open={revisionDialogOpen}
          onOpenChange={setRevisionDialogOpen}
        />
      )}
    </div>
  );
}

