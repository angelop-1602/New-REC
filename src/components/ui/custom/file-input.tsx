import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { FileSpreadsheet, Upload, X, Download, Info } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { DocumentsType } from "@/types";

export default function StylishFileUpload({
  title,
  description,
  templateUrl,
  multiple = false,
  accept = ".pdf",
  disabled = false,
  onChange,
  existingDocuments = [],
  onRemoveDocument,
}: {
  title: string;
  description: string;
  templateUrl?: string;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  onChange?: (file: File | null) => void;
  existingDocuments?: DocumentsType[];
  onRemoveDocument?: (documentId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return;
    const selected = Array.from(e.target.files);
    const updated = multiple ? [...files, ...selected] : selected;
    setFiles(updated);
    onChange?.(updated[0]);
    e.target.value = ""; // allow re-upload of same file
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    // Prevent dropping if disabled or not allowed
    if (disabled || (!multiple && files.length >= 1)) return;

    const dropped = Array.from(e.dataTransfer.files);
    const updated = multiple ? [...files, ...dropped] : dropped;
    setFiles(updated);
    onChange?.(updated[0]);
  };

  const removeFile = (index: number) => {
    if (disabled) return;
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onChange?.(null);
  };

  const isSingleFileFull = !multiple && files.length >= 1;
  // Deduplicate existing documents by ID
  const uniqueExistingDocs = existingDocuments?.filter((doc, index, self) =>
    index === self.findIndex((d) => d.id === doc.id)
  ) || [];
  const hasExistingDocs = uniqueExistingDocs.length > 0;
  const isInputDisabled = disabled || isSingleFileFull || (hasExistingDocs && !multiple);

  // Clear local files when documents are saved to context (to prevent duplicates)
  useEffect(() => {
    if (hasExistingDocs && files.length > 0) {
      // Clear local files state when existing documents appear (file was saved)
      setFiles([]);
    }
  }, [hasExistingDocs]);

  return (
    <div className="max-w-xl w-full mx-auto p-4 sm:p-6 bg-card rounded-2xl border border-border shadow-md space-y-3 sm:space-y-4">
      {/* Title and Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate text-foreground">{title}</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground hover:text-primary flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent className="text-xs border shadow-sm">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {templateUrl && (
          <Link
            href={templateUrl}
            target="_blank"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 whitespace-nowrap flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Template</span>
            <span className="sm:hidden">Template</span>
          </Link>
        )}
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isInputDisabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`w-full h-40 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition
          ${
            isInputDisabled
              ? "opacity-50 cursor-not-allowed border-muted bg-muted/20"
              : isDragging
              ? "border-primary bg-primary/10 cursor-pointer"
              : "border-muted hover:border-primary hover:bg-muted/50 cursor-pointer"
          }
        `}
        onClick={() => {
          if (!isInputDisabled) fileInputRef.current?.click();
        }}
      >
        <Upload className={`w-6 h-6 mb-2 ${isInputDisabled ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
        <p className={`text-sm text-center ${isInputDisabled ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
          {isInputDisabled ? (
            "Document already uploaded"
          ) : (
            <>
              Drag & drop or{" "}
              <span className="text-primary font-semibold">browse files</span>
            </>
          )}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          disabled={isInputDisabled}
          onChange={handleFileChange}
          aria-label={`Upload ${title}`}
          title={`Upload ${title}`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Acceptable Types: {accept || "PDF only"}
        </p>
        <Badge variant="outline" className="mt-2 text-xs">
          {multiple ? "Multiple files allowed" : "Only one file allowed"}
        </Badge>
      </div>

      {/* File Preview - Show existing documents from context (persists across navigation) */}
      {hasExistingDocs && (
        <div className="space-y-3">
          {uniqueExistingDocs.map((doc) => {
            // Calculate file size from documents
            const fileSize = doc.files && doc.files.length > 0
              ? doc.files.reduce((total, f) => total + (f.size || 0), 0)
              : 0;
            const fileName = doc.originalFileName || doc.title;
            
            return (
              <div
                key={doc.id}
                className="relative flex items-center p-3 rounded-lg border bg-muted/40"
              >
                <FileSpreadsheet className="w-6 h-6 text-primary mr-3" />
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium truncate">{fileName}</span>
                  <span className="text-xs text-muted-foreground">
                    {fileSize > 0 ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : "File uploaded"}
                  </span>
                </div>
                {onRemoveDocument && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemoveDocument(doc.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview - For newly selected files (only show if no existing documents) */}
      {files.length > 0 && !hasExistingDocs && (
        <div className="space-y-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative flex items-center p-3 rounded-lg border bg-muted/40"
            >
              <FileSpreadsheet className="w-6 h-6 text-primary mr-3" />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-destructive absolute right-2 top-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
