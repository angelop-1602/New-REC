'use client';

import { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

type Props = {
  file: string;
  submissionId: string;
  entry?: string;
  auto?: boolean;
  className?: string;
};

export default function ReactPdfViewer({ 
  file, 
  submissionId, 
  entry, 
  auto,
  className = "w-full h-[90vh]"
}: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [documentData, setDocumentData] = useState<ArrayBuffer | null>(null);

  // Build API URL and load document data
  useEffect(() => {
    const qs = new URLSearchParams({
      submissionId,
      ...(entry ? { entry } : {}),
      ...(auto ? { auto: '1' } : {})
    }).toString();

    const url = `/api/preview/document/${encodeURIComponent(file)}?${qs}`;
    setApiUrl(url);

    // Fetch document data
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('ReactPdfViewer: Loading document from', url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        console.log('ReactPdfViewer: Content-Type:', contentType);
        
        if (!contentType.includes('pdf')) {
          throw new Error(`Expected PDF but got ${contentType}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log('ReactPdfViewer: Document loaded, size:', arrayBuffer.byteLength);
        
        setDocumentData(arrayBuffer);
      } catch (err: any) {
        console.error('ReactPdfViewer: Error loading document:', err);
        setError(err.message || 'Failed to load document');
        setLoading(false);
      }
    };

    loadDocument();
  }, [file, submissionId, entry, auto]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);
    console.log(`ReactPdfViewer: PDF loaded successfully, pages: ${numPages}`);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('ReactPdfViewer: Error loading PDF:', error);
    setError(error.message || 'Failed to load PDF');
    setLoading(false);
  }, []);

  const goToPreviousPage = () => setPageNumber(page => Math.max(1, page - 1));
  const goToNextPage = () => setPageNumber(page => Math.min(numPages, page + 1));
  const zoomIn = () => setScale(s => Math.min(3, s * 1.25));
  const zoomOut = () => setScale(s => Math.max(0.25, s * 0.8));
  const rotateClockwise = () => setRotation(r => (r + 90) % 360);
  const resetZoom = () => setScale(1.0);

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(apiUrl, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} flex flex-col`}>
      {/* Toolbar */}
      <div className="flex-shrink-0 p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {pageNumber} / {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetZoom}>
              Fit
            </Button>
            <Button variant="outline" size="sm" onClick={rotateClockwise}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Viewer - Continuous Scrolling */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex flex-col items-center space-y-2">
          {documentData && (
            <Document
              file={documentData}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              className="w-full"
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"></div>
                </div>
              }
            >
              {/* Render all pages continuously */}
              {Array.from({ length: numPages }, (_, index) => (
                <div key={index + 1} className="mb-2">
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    rotate={rotation}
                    className="shadow-lg bg-white"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="flex items-center justify-center h-[600px] bg-white shadow-lg">
                        <div className="animate-pulse text-gray-400">Loading page {index + 1}...</div>
                      </div>
                    }
                  />
                </div>
              ))}
            </Document>
          )}
        </div>
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex-shrink-0 p-2 bg-gray-100 text-xs text-gray-600 border-t">
          <div>API: {apiUrl}</div>
          <div>Pages: {numPages} | Current: {pageNumber} | Scale: {Math.round(scale * 100)}% | Rotation: {rotation}°</div>
        </div>
      )}
    </div>
  );
}
