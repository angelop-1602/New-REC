"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentsType } from "@/types";
import { Eye, Download, Upload, Trash2, MoreVertical } from "lucide-react";

interface DocumentActionsMenuProps {
  document: DocumentsType;
  userType: "proponent" | "reviewer" | "chairperson";
  submissionStatus?: string;
  onPreview: (documentId: string) => void;
  onDownload: (document: DocumentsType) => void;
  onUpload?: (document: DocumentsType) => void;
  onUploadRevision?: (document: DocumentsType) => void;
  onReplace?: (document: DocumentsType) => void;
  onCancelRequest?: (documentId: string) => void;
}

export function DocumentActionsMenu({
  document,
  userType,
  submissionStatus,
  onPreview,
  onDownload,
  onUpload,
  onUploadRevision,
  onReplace,
  onCancelRequest,
}: DocumentActionsMenuProps) {
  const docStatus = (document as { currentStatus?: string; status?: string }).currentStatus || document.status;
  const canEdit = userType === "proponent" && 
                  (submissionStatus === "pending" || submissionStatus === "draft");

  const renderMenuItems = () => {
    // If document is requested
    if (docStatus === 'requested') {
      // Proponent can upload
      if (userType === 'proponent' && onUpload) {
        return (
          <DropdownMenuItem onClick={() => onUpload(document)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </DropdownMenuItem>
        );
      }
      
      // Chairperson can cancel
      if (userType === 'chairperson' && onCancelRequest) {
        return (
          <DropdownMenuItem
            onClick={() => onCancelRequest(document.id)}
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
      if (userType === 'proponent' && onUploadRevision) {
        return (
          <>
            <DropdownMenuItem onClick={() => onUploadRevision(document)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Revision
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPreview(document.id)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </DropdownMenuItem>
          </>
        );
      }
    }
    
    // For all other statuses, show preview/download
    // If can edit (pending/draft) and proponent, also show replace option
    return (
      <>
        <DropdownMenuItem onClick={() => onPreview(document.id)}>
          <Eye className="h-4 w-4 mr-2" />
          Preview Document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload(document)}>
          <Download className="h-4 w-4 mr-2" />
          Download Document
        </DropdownMenuItem>
        {canEdit && userType === 'proponent' && onReplace && (
          <DropdownMenuItem onClick={() => onReplace(document)}>
            <Upload className="h-4 w-4 mr-2" />
            Replace Document
          </DropdownMenuItem>
        )}
      </>
    );
  };

  return (
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
        {renderMenuItems()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

