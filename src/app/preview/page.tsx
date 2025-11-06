"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Upload, 
  Pencil, 
  Eye, 
  FileText, 
  Image, 
  Archive,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
  ArrowLeft
} from "lucide-react";
import { DocumentsType } from "@/types/documents.types";

export default function DocumentPreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [documents, setDocuments] = React.useState<DocumentsType[]>([]);
  const [selectedDocument, setSelectedDocument] = React.useState<DocumentsType | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<'accepted' | 'revise'>('accepted');

  // Parse documents from URL params
  React.useEffect(() => {
    const documentsParam = searchParams.get('documents');
    if (documentsParam) {
      try {
        const parsedDocs = JSON.parse(documentsParam);
        setDocuments(parsedDocs);
      } catch (err) {
        console.error('Error parsing documents:', err);
        setError('Failed to load documents');
      }
    }
  }, [searchParams]);

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
  const handleDocumentSelect = async (document: DocumentsType) => {
    setSelectedDocument(document);
    setLoading(true);
    setError(null);

    try {
      // Use our API route for same-origin preview
      const previewUrl = `/api/preview/document/${document.id}`;
      setPreviewUrl(previewUrl);
    } catch (err) {
      console.error('Error loading document preview:', err);
      setError('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = () => {
    if (!selectedDocument) return;
    
    // Update the document status in the local state
    setDocuments(prev => prev.map(doc => 
      doc.id === selectedDocument.id 
        ? { ...doc, status: selectedStatus }
        : doc
    ));
    
    // Reset form
    setComment("");
    setSelectedStatus('accepted');
    
    // Show success message (you can add toast notification here)
    console.log('Document status updated:', selectedDocument.id, selectedStatus);
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'revise':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Revise</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="h-screen w-full flex gap-3 p-4">
        {/* Left: Document Preview */}
        <div className="flex-[7]">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleGoBack}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <CardTitle>
                  {selectedDocument ? selectedDocument.title || selectedDocument.originalFileName : 'Preview'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-full p-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading preview...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600 mb-2">Preview Error</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <div className="h-full">
                  {getFileType(selectedDocument?.originalFileName || '') === 'pdf' ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0"
                      title="PDF Preview"
                    />
                  ) : getFileType(selectedDocument?.originalFileName || '') === 'image' ? (
                    <img
                      src={previewUrl}
                      alt="Document Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : getFileType(selectedDocument?.originalFileName || '') === 'text' ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0"
                      title="Text Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">Document Preview</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          This file type cannot be previewed directly
                        </p>
                        <Button onClick={() => window.open(previewUrl, '_blank')} variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download to view
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">No document selected</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Document List & Actions */}
        <div className="flex-[3]">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Documents & Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 h-full">
              {/* Document List Section */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 border rounded">
                  <ul className="divide-y">
                    {documents.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-muted-foreground">
                        No documents found
                      </li>
                    ) : (
                      documents.map((doc) => (
                        <li
                          key={doc.id}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 ${
                            selectedDocument?.id === doc.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleDocumentSelect(doc)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getFileIcon(doc.originalFileName || doc.title || '')}
                              <span className="truncate">
                                {doc.title || doc.originalFileName || 'Untitled'}
                              </span>
                            </div>
                            {getStatusBadge(doc.status)}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </ScrollArea>
              </div>

              {/* Actions Section */}
              {selectedDocument && (
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <div className="flex gap-2">
                    <Button 
                      variant={selectedStatus === 'accepted' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedStatus('accepted')}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button 
                      variant={selectedStatus === 'revise' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedStatus('revise')}
                      className="flex-1"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Revise
                    </Button>
                  </div>
                  
                  {selectedStatus === 'revise' && (
                    <Textarea
                      placeholder="Comments (required for revision)..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  )}
                  
                  <Button 
                    onClick={handleStatusUpdate}
                    disabled={selectedStatus === 'revise' && !comment.trim()}
                    className="w-full"
                  >
                    Submit Review
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
