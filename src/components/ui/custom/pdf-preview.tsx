"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle, FileText, ExternalLink } from "lucide-react";

interface PdfPreviewProps {
  file: string;
  submissionId: string;
  entry?: string;
  auto?: boolean;
  className?: string;
}

export default function PdfPreview({
  file,
  submissionId,
  entry,
  auto,
  className = "w-full h-[90vh]"
}: PdfPreviewProps) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [contentType, setContentType] = React.useState<string>('');
  const [previewEntry, setPreviewEntry] = React.useState<string>('');
  const [apiUrl, setApiUrl] = React.useState<string>('');
  const [pdfLoadFailed, setPdfLoadFailed] = React.useState(false);
  const [useDirectUrl, setUseDirectUrl] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Build API URL
  React.useEffect(() => {
    const baseUrl = `/api/preview/document/${encodeURIComponent(file)}`;
    const params = new URLSearchParams();
    params.set('submissionId', submissionId);
    
    if (entry) {
      params.set('entry', entry);
    }
    if (auto) {
      params.set('auto', '1');
    }
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    setApiUrl(fullUrl);
  }, [file, submissionId, entry, auto]);

  // Fetch and create blob URL
  React.useEffect(() => {
    if (!apiUrl) return;

    let isCancelled = false;
    
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('PdfPreview: Fetching from', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        if (isCancelled) return;
        
        // Get response headers for diagnostics
        const responseContentType = response.headers.get('content-type') || 'application/octet-stream';
        const responsePreviewEntry = response.headers.get('x-preview-entry') || '';
        
        console.log('PdfPreview: Response headers:', {
          'content-type': responseContentType,
          'content-length': response.headers.get('content-length'),
          'x-preview-entry': responsePreviewEntry
        });
        
        setContentType(responseContentType);
        setPreviewEntry(decodeURIComponent(responsePreviewEntry));
        
        // Convert response to blob
        const blob = await response.blob();
        console.log('PdfPreview: Blob created:', {
          size: blob.size,
          type: blob.type
        });
        
        if (isCancelled) return;
        
        // Create object URL
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        
      } catch (err) {
        if (isCancelled) return;
        
        console.error('PdfPreview: Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchDocument();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [apiUrl]);

  // Cleanup blob URL on unmount or when it changes
  React.useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Loading preview...</p>
              <p className="text-xs text-muted-foreground">
                {entry ? `Loading ${entry}` : auto ? 'Finding previewable file' : `Loading ${file}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">Preview Error</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(apiUrl, '_blank')}
              className="mt-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - render based on content type
  if (!blobUrl) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">No content to display</p>
        </div>
      </div>
    );
  }

  // Determine render method based on content type
  const isImage = contentType.includes('image');
  const isPdf = contentType.includes('pdf');

  return (
    <div className={`${className} relative`}>
      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 p-2 bg-gray-100 text-xs rounded">
          <div>Content-Type: {contentType}</div>
          {previewEntry && <div>Preview Entry: {previewEntry}</div>}
          <div>Blob URL: {blobUrl.substring(0, 50)}...</div>
        </div>
      )}
      
      {/* Fallback button for debugging */}
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(blobUrl, '_blank', 'noopener,noreferrer')}
          className="bg-white/90 backdrop-blur-sm"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Open in new tab
        </Button>
      </div>
      
      {isPdf ? (
        // PDF: Smart rendering with fallback detection
        <div className="w-full h-[90vh] relative">
          {!pdfLoadFailed ? (
            <>
              {/* Primary: iframe with PDF parameters */}
              <iframe
                ref={iframeRef}
                src={useDirectUrl ? apiUrl : `${blobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="w-full h-full border-0"
                title="PDF Preview"
                style={{
                  backgroundColor: '#ffffff',
                  display: 'block'
                }}
                onLoad={() => {
                  console.log(`PDF iframe loaded successfully using ${useDirectUrl ? 'direct URL' : 'blob URL'}`);
                  // Check if iframe actually loaded PDF content
                  setTimeout(() => {
                    try {
                      const iframe = iframeRef.current;
                      if (iframe && iframe.contentWindow) {
                        // If we can't access content or it's empty, consider it failed
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (!iframeDoc || iframeDoc.body.children.length === 0) {
                          console.warn('PDF iframe appears empty, trying fallback');
                          if (!useDirectUrl) {
                            console.log('Switching to direct URL approach');
                            setUseDirectUrl(true);
                          } else {
                            setPdfLoadFailed(true);
                          }
                        }
                      }
                    } catch (e) {
                      // Cross-origin error is expected for blob URLs, this is actually good
                      console.log('PDF iframe loaded (cross-origin restriction is normal for blob URLs)');
                    }
                  }, 2000);
                }}
                onError={(e) => {
                  console.error('PDF iframe failed to load:', e);
                  if (!useDirectUrl) {
                    console.log('Blob URL failed, trying direct URL');
                    setUseDirectUrl(true);
                  } else {
                    setPdfLoadFailed(true);
                  }
                }}
              />
              
              {/* Backup: object element as secondary option */}
              <object
                data={blobUrl}
                type="application/pdf"
                className="w-full h-full absolute inset-0 -z-10"
                style={{ display: 'none' }}
              >
                <embed
                  src={blobUrl}
                  type="application/pdf"
                  className="w-full h-full"
                />
              </object>
            </>
          ) : (
            // Fallback: Manual PDF handling
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-8">
              <FileText className="w-16 h-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">PDF Preview</p>
                <p className="text-sm text-muted-foreground">
                  This PDF cannot be displayed inline in your browser.
                </p>
                <p className="text-xs text-muted-foreground">
                  Try enabling PDF viewing in your browser settings or use the button below.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(blobUrl, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open PDF in New Tab
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPdfLoadFailed(false);
                    setUseDirectUrl(!useDirectUrl);
                    console.log(`Switching to ${!useDirectUrl ? 'direct URL' : 'blob URL'} approach`);
                    // Force reload
                    if (iframeRef.current) {
                      const newSrc = !useDirectUrl ? apiUrl : `${blobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&t=${Date.now()}`;
                      iframeRef.current.src = newSrc;
                    }
                  }}
                >
                  Try {useDirectUrl ? 'Blob URL' : 'Direct URL'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : isImage ? (
        // Image: Use img element with proper sizing
        <img
          src={blobUrl}
          alt="Document Preview"
          className="w-full h-[90vh] object-contain bg-white"
        />
      ) : (
        // Other file types: Use iframe as fallback
        <iframe
          src={blobUrl}
          className="w-full h-[90vh]"
          title="Document Preview"
        />
      )}
    </div>
  );
}
