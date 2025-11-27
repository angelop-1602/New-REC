"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  FileText, 
  Image, 
  Archive,
  Trash2,
  Replace
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  url?: string;
}

interface DocumentWorkspaceProps {
  current: Document;
  docs: Document[];
  onSelectDoc: (id: string) => void;
  onDownload: (id: string) => void;
  onReplace: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DocumentWorkspace({
  current,
  docs,
  onSelectDoc,
  onDownload,
  onReplace,
  onDelete,
}: DocumentWorkspaceProps) {
  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="w-4 h-4" />;
      case 'zip':
        return <Archive className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Document List Sidebar */}
      <div className="w-64 border-r">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            <h3 className="font-semibold mb-4">Documents</h3>
            {docs.map((doc) => (
              <Card
                key={doc.id}
                className={`cursor-pointer transition-colors ${
                  current.id === doc.id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelectDoc(doc.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    {getFileIcon(doc.type)}
                    <span className="text-sm truncate flex-1">{doc.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFileIcon(current.type)}
            <h2 className="font-semibold">{current.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(current.id)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReplace(current.id)}
            >
              <Replace className="w-4 h-4 mr-2" />
              Replace
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(current.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 p-4 overflow-auto">
          <Card className="h-full">
            <CardContent className="p-6 h-full flex items-center justify-center">
              {current.type === 'pdf' && current.url ? (
                <iframe
                  src={current.url}
                  className="w-full h-full border-0"
                  title={current.name}
                />
              ) : current.type === 'image' && current.url ? (
                <img
                  src={current.url}
                  alt={current.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Preview not available for this file type</p>
                  <p className="text-sm mt-2">{current.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

