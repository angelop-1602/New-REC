"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";
import { DocumentsType } from "@/types";
import InlineDocumentPreview from "@/components/ui/custom/inline-document-preview";
import DocumentRequestDialog from "@/components/rec/shared/dialogs/document-request-dialog";
import { DocumentStatusBadge } from "./document-status-badge";
import { DocumentActionsMenu } from "./document-actions-menu";

interface ProtocolDocumentsCardProps {
  documents: DocumentsType[];
  loading: boolean;
  userType: "proponent" | "reviewer" | "chairperson";
  submissionId: string;
  protocolId: string;
  submissionStatus?: string;
  isPreviewOpen: boolean;
  selectedDocumentForPreview: string | null;
  onPreviewDocument: (documentId: string) => void;
  onDownloadDocument: (document: DocumentsType) => void;
  onUploadDocument?: (document: DocumentsType) => void;
  onUploadRevision?: (document: DocumentsType) => void;
  onReplaceDocument?: (document: DocumentsType) => void;
  onCancelRequest?: (documentId: string) => void;
  onRequestCreated?: () => void;
  onDocumentStatusUpdate?: () => void;
  onClosePreview: () => void;
}

export function ProtocolDocumentsCard({
  documents,
  loading,
  userType,
  submissionId,
  protocolId,
  submissionStatus,
  isPreviewOpen,
  selectedDocumentForPreview,
  onPreviewDocument,
  onDownloadDocument,
  onUploadDocument,
  onUploadRevision,
  onReplaceDocument,
  onCancelRequest,
  onRequestCreated,
  onDocumentStatusUpdate,
  onClosePreview,
}: ProtocolDocumentsCardProps) {
  return (
    <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden p-0">
      <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 rounded-t-lg pt-6 pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#036635] dark:text-[#FECC07]" />
            <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Documents</span>
          </CardTitle>
          {userType === "chairperson" && (
            <DocumentRequestDialog
              protocolId={submissionId}
              existingDocuments={documents}
              onRequestCreated={onRequestCreated}
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
      <CardContent className="py-4">
        {loading ? (
          <div className="flex items-center justify-center pb-6">
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
                            <DocumentStatusBadge
                              status={(document as { currentStatus?: string; status?: string }).currentStatus || document.status || 'pending'}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <DocumentActionsMenu
                              document={document}
                              userType={userType}
                              submissionStatus={submissionStatus}
                              onPreview={onPreviewDocument}
                              onDownload={onDownloadDocument}
                              onUpload={onUploadDocument}
                              onUploadRevision={onUploadRevision}
                              onReplace={onReplaceDocument}
                              onCancelRequest={onCancelRequest}
                            />
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
                onClose={onClosePreview}
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
  );
}

