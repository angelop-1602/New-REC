'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

type Props = {
  file: string;
  submissionId: string;
  entry?: string;
  auto?: boolean;
  className?: string;
  storagePath?: string; // Add storagePath parameter
};

export default function SimplePdfViewer({ 
  file, 
  submissionId, 
  entry, 
  auto,
  className = "w-full h-[90vh]",
  storagePath
}: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');

  // Build API URL
  useEffect(() => {
    const qs = new URLSearchParams({
      submissionId,
      ...(entry ? { entry } : {}),
      ...(auto ? { auto: '1' } : {}),
      ...(storagePath ? { storagePath } : {})
    }).toString();

    const url = `/api/documents/preview/document/${encodeURIComponent(file)}?${qs}`;
    setApiUrl(url);

    // Create blob URL for iframe
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Clear previous PDF URL if it exists
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl('');
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        
        if (!contentType.includes('pdf')) {
          throw new Error(`Expected PDF but got ${contentType}`);
        }
        
        const blob = await response.blob();
        
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
        setLoading(false);
      } catch (err: any) {
        console.error('SimplePdfViewer: Error loading document:', err);
        setError(err.message || 'Failed to load document');
        setLoading(false);
      }
    };

    loadDocument();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [file, submissionId, entry, auto, storagePath, pdfUrl]);

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading PDF preview...</p>
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
            <div className="text-red-500 text-lg">⚠️</div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">PDF Preview Error</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(apiUrl, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => window.open(apiUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} flex flex-col`}>
      {/* Simple iframe-based PDF viewer */}
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          title="PDF Preview"
          style={{
            backgroundColor: '#ffffff',
            display: 'block'
          }}
          onError={() => {
            console.error('SimplePdfViewer: PDF iframe failed to load');
            setError('Failed to display PDF in iframe');
          }}
        />
    </div>
  );
}
