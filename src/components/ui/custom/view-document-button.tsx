"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { ref, getStorage, getBlob } from 'firebase/storage';
import firebaseApp from '@/lib/firebaseConfig';
import JSZip from 'jszip';
import { getFileExtension } from '@/lib/utils/zip';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InlineLoading } from "@/components/ui/loading";

interface ViewDocumentButtonProps {
  storagePath: string;
  documentTitle?: string;
  className?: string;
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

// Supported file types for viewing
const SUPPORTED_FILE_TYPES = {
  pdf: { priority: 1, type: 'application/pdf' },
  png: { priority: 2, type: 'image/png' },
  jpg: { priority: 2, type: 'image/jpeg' },
  jpeg: { priority: 2, type: 'image/jpeg' },
  html: { priority: 3, type: 'text/html' },
  htm: { priority: 3, type: 'text/html' },
  txt: { priority: 4, type: 'text/plain' },
  md: { priority: 4, type: 'text/markdown' },
} as const;

// Cache for extracted files (using Map for better performance)
const fileCache = new Map<string, { blob: Blob; type: string; name: string; timestamp: number }>();

// Cache cleanup - remove files older than 1 hour
const cleanupCache = () => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [key, value] of fileCache.entries()) {
    if (value.timestamp < oneHourAgo) {
      fileCache.delete(key);
    }
  }
};

export default function ViewDocumentButton({
  storagePath,
  documentTitle,
  className = "",
  variant = "ghost",
  size = "sm",
  disabled = false
}: ViewDocumentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const findBestFileToView = (files: JSZip.JSZipObject[]): JSZip.JSZipObject | null => {
    const viewableFiles = files
      .filter(file => !file.dir)
      .map(file => {
        const extension = getFileExtension(file.name);
        const supportedType = SUPPORTED_FILE_TYPES[extension as keyof typeof SUPPORTED_FILE_TYPES];
        return {
          file,
          extension,
          priority: supportedType?.priority || 999,
          type: supportedType?.type || 'application/octet-stream'
        };
      })
      .filter(item => item.priority < 999)
      .sort((a, b) => a.priority - b.priority);

    return viewableFiles.length > 0 ? viewableFiles[0].file : null;
  };

  const openFileInNewTab = (blob: Blob, fileName: string, mimeType: string) => {
    try {
      // Create a Blob with the correct MIME type
      const typedBlob = new Blob([blob], { type: mimeType });
      
      // Create object URL
      const url = URL.createObjectURL(typedBlob);
      
      // Open in new tab
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        // Fallback: trigger download if popup blocked
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      // Clean up object URL after a short delay to ensure it loads
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 3000);
      
    } catch (error) {
      console.error('Error opening file:', error);
      throw new Error('Failed to open file in browser');
    }
  };

  const handleViewDocument = async () => {
    if (!storagePath || disabled) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Clean up old cache entries
      cleanupCache();
      
      // Check cache first
      const cacheKey = storagePath;
      const cachedFile = fileCache.get(cacheKey);
      
      if (cachedFile) {
        openFileInNewTab(cachedFile.blob, cachedFile.name, cachedFile.type);
        return;
      }

      // Use server-side proxy to bypass CORS issues completely
      let zipBlob: Blob | null = null;
      
      try {
        // Call our API route that downloads the file server-side
        const response = await fetch('/api/download-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storagePath }),
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        zipBlob = await response.blob();
        
      } catch {
        // Fallback: try direct Firebase getBlob() as backup
        try {
          const storage = getStorage(firebaseApp);
          const storageRef = ref(storage, storagePath);
          zipBlob = await getBlob(storageRef);
        } catch (getBlobError) {
          console.error('Download failed:', getBlobError);
          throw new Error('Unable to download file. All methods failed.');
        }
      }
      
      if (!zipBlob || zipBlob.size === 0) {
        throw new Error('Downloaded file is empty or invalid');
      }
      
      // Extract ZIP contents
      const zip = await JSZip.loadAsync(zipBlob);
      const files = Object.values(zip.files);
      
      if (files.length === 0) {
        throw new Error('ZIP file is empty');
      }
      
      // Find the best file to view
      const fileToView = findBestFileToView(files);
      
      if (!fileToView) {
        // No viewable files found - offer direct ZIP download as fallback
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documentTitle ? `${documentTitle}.zip` : 'document.zip';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        throw new Error('No viewable files found in ZIP. ZIP file downloaded instead.');
      }
      
      // Extract the file content
      const fileBlob = await fileToView.async('blob');
      const extension = getFileExtension(fileToView.name);
      const mimeType = SUPPORTED_FILE_TYPES[extension as keyof typeof SUPPORTED_FILE_TYPES]?.type || 'application/octet-stream';
      
      // Cache the extracted file
      fileCache.set(cacheKey, {
        blob: fileBlob,
        type: mimeType,
        name: fileToView.name,
        timestamp: Date.now()
      });
      
      // Open file in new tab
      openFileInNewTab(fileBlob, fileToView.name, mimeType);
      
      // Show success state briefly
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to view document';
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${loading ? 'animate-pulse' : ''} ${success ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
      disabled={disabled || loading || !storagePath}
      onClick={handleViewDocument}
    >
      {loading ? (
        <InlineLoading size="sm" />
      ) : success ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : error ? (
        <AlertCircle className="w-4 h-4 text-destructive" />
      ) : (
        <ExternalLink className="w-4 h-4" />
      )}
      {size !== "icon" && (
        <span className="ml-2">
          {loading ? "Opening..." : success ? "Opened" : error ? "Error" : "View"}
        </span>
      )}
    </Button>
  );

  // Show tooltip if there's an error, loading, or success state
  if (error || loading || success) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              {loading ? "Extracting and loading document..." : success ? "Document opened successfully!" : error}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}

// Export utility function for cache management
export const clearDocumentCache = () => {
  fileCache.clear();
};

// Export function to get cache size (for debugging)
export const getDocumentCacheSize = () => {
  return fileCache.size;
};