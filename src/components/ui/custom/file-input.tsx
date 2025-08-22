import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { FileSpreadsheet, Upload, X, Download, Info } from "lucide-react";
import { useRef, useState } from "react";
import Link from "next/link";

export default function StylishFileUpload({
  title,
  description,
  templateUrl,
  multiple = false,
  accept = ".pdf",
  onChange,
}: {
  title: string;
  description: string;
  templateUrl?: string;
  multiple?: boolean;
  accept?: string;
  onChange?: (file: File | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const updated = multiple ? [...files, ...selected] : selected;
    setFiles(updated);
    onChange?.(updated[0]);
    e.target.value = ""; // allow re-upload of same file
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    // Prevent dropping if not allowed
    if (!multiple && files.length >= 1) return;

    const dropped = Array.from(e.dataTransfer.files);
    const updated = multiple ? [...files, ...dropped] : dropped;
    setFiles(updated);
    onChange?.(updated[0]);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
  };

  const isSingleFileFull = !multiple && files.length >= 1;

  return (
    <div className="max-w-xl w-full mx-auto p-6 bg-white rounded-2xl border border-muted shadow-md space-y-4">
      {/* Title and Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </TooltipTrigger>
              <TooltipContent className="text-xs  border shadow-sm">
                {description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {templateUrl && (
          <Link
            href={templateUrl}
            target="_blank"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Link>
        )}
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isSingleFileFull) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`w-full h-40 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition cursor-pointer 
          ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-muted hover:border-primary hover:bg-muted/50"
          }
          ${isSingleFileFull ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={() => {
          if (!isSingleFileFull) fileInputRef.current?.click();
        }}
      >
        <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Drag & drop or{" "}
          <span className="text-primary font-semibold">browse files</span>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          disabled={isSingleFileFull}
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Acceptable Types: {accept || "PDF only"}
        </p>
        <Badge variant="outline" className="mt-2 text-xs">
          {multiple ? "Multiple files allowed" : "Only one file allowed"}
        </Badge>
      </div>

      {/* File Preview */}
      {files.length > 0 && (
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
