import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentsType } from "@/types/documents.types";
import ViewDocumentButton from "@/components/ui/custom/view-document-button";
import { ref, getStorage, getDownloadURL } from 'firebase/storage';
import firebaseApp from '@/lib/firebaseConfig';

interface ProtocolDocumentProps {
  documents?: DocumentsType[];
}

// Helper function to format document name
const formatDocumentName = (doc: DocumentsType) => {
  // Prioritize title field first
  if (doc.title) {
    return doc.title;
  }
  
  if (doc.originalFileName) {
    return doc.originalFileName;
  }

  // Fallback to document id with proper formatting
  return doc.id?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown Document';
};

// Helper function to get document status badge variant
const getStatusVariant = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'uploaded':
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Helper function to handle document download
const handleDownload = async (doc: DocumentsType) => {
  if (doc.storagePath) {
    try {
      // Use Firebase getDownloadURL and direct download (simpler approach)
      const storage = getStorage(firebaseApp);
      const storageRef = ref(storage, doc.storagePath);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Direct download link approach
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.originalFileName || `${doc.id}.zip`;
      a.target = '_blank';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  }
};

// Note: Document viewing is now handled by ViewDocumentButton component

export default function ProtocolDocument({ documents = [] }: ProtocolDocumentProps) {
  return (
    <Card className="w-full flex flex-col shadow-sm border border-muted-foreground/10 bg-white">
      <CardHeader>
        <CardTitle className="flex flex-row items-center gap-2 text-base sm:text-lg font-semibold text-primary">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <h3 className="text-sm sm:text-base font-semibold text-primary uppercase tracking-wide">
            Protocol Document
          </h3>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1">
        {/* Desktop Table View */}
        <div className="hidden sm:block">
       
            <Table className="max-h-[300px] lg:max-h-[350px] overflow-y-auto rounded-md border">
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="text-center font-medium">Document Name</TableHead>
                  <TableHead className="text-center font-medium">Status</TableHead>
                  <TableHead className="text-center font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document, index) => (
                  <TableRow
                    key={document.id || index}
                    className={`hover:bg-muted/50 transition-colors ${
                      index % 2 === 0 ? "bg-primary/5" : ""
                    }`}
                  >
                    <TableCell className="font-medium text-sm p-4">
                      {formatDocumentName(document)}
                    </TableCell>
                    <TableCell className="text-center p-4">
                      <Badge variant={getStatusVariant(document.status)} className="text-xs">
                        {document.status || 'Uploaded'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <EllipsisVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <ViewDocumentButton
                              storagePath={document.storagePath}
                              documentTitle={formatDocumentName(document)}
                              variant="ghost"
                              size="sm"
                              className="h-auto w-full justify-start font-normal"
                              disabled={!document.storagePath}
                            />
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleDownload(document)}
                            disabled={!document.storagePath}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download ZIP
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3 max-h-[300px] overflow-y-auto">
          {documents.map((document, index) => (
            <div
              key={document.id || index}
              className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{formatDocumentName(document)}</h4>
                  <div className="mt-2">
                    <Badge variant={getStatusVariant(document.status)} className="text-xs">
                      {document.status || 'Uploaded'}
                    </Badge>
                  </div>
                </div>
                <div className="ml-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <EllipsisVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <ViewDocumentButton
                          storagePath={document.storagePath}
                          documentTitle={formatDocumentName(document)}
                          variant="ghost"
                          size="sm"
                          className="h-auto w-full justify-start font-normal"
                          disabled={!document.storagePath}
                        />
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => handleDownload(document)}
                        disabled={!document.storagePath}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download ZIP
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No documents uploaded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
