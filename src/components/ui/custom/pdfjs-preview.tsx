'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

// Dynamic import for PDF.js to avoid SSR issues
let pdfjsLib: any = null;

// Initialize PDF.js with worker
const initializePdfJs = async () => {
  if (pdfjsLib) return pdfjsLib;
  
  try {
    const pdfjs = await import('pdfjs-dist');
    
    // Set worker source to local file
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
    
    console.log('PDF.js initialized with worker:', pdfjs.GlobalWorkerOptions.workerSrc);
    pdfjsLib = pdfjs;
    return pdfjs;
  } catch (error) {
    console.error('Failed to initialize PDF.js:', error);
    throw error;
  }
};

type Props = {
  file: string;
  submissionId: string;
  entry?: string;
  auto?: boolean;
  className?: string;
  storagePath?: string; // Add storagePath parameter
};

export default function PdfJsPreview({ 
  file, 
  submissionId, 
  entry, 
  auto,
  className = "w-full h-[90vh]",
  storagePath
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const renderTasksRef = useRef<Map<number, any>>(new Map());

  // Build API URL
  useEffect(() => {
    const qs = new URLSearchParams({
      submissionId,
      ...(entry ? { entry } : {}),
      ...(auto ? { auto: '1' } : {}),
      ...(storagePath ? { storagePath } : {})
    }).toString();

    const url = `/api/preview/document/${encodeURIComponent(file)}?${qs}`;
    setApiUrl(url);
  }, [file, submissionId, entry, auto, storagePath]);

  // Load PDF bytes
  useEffect(() => {
    if (!apiUrl) return;
    
    let cancelled = false;
    
    const loadPdf = async () => {
      try {
        setError(null);
        setPdf(null);
        setCurrentPage(1);
        setLoading(true);

        // Initialize PDF.js dynamically
        const pdfjs = await initializePdfJs();

        console.log('PdfJsPreview: Loading PDF from', apiUrl);
        console.log('PdfJsPreview: Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);

        // Test worker accessibility
        try {
          const workerTest = await fetch('/pdfjs/pdf.worker.min.js', { method: 'HEAD' });
          console.log('PdfJsPreview: Worker file accessible:', workerTest.ok);
        } catch (workerError) {
          console.warn('PdfJsPreview: Worker file test failed:', workerError);
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Preview failed ${response.status}: ${await response.text()}`);
        }

        const contentType = response.headers.get('content-type') || '';
        console.log('PdfJsPreview: Content-Type:', contentType);
        
        if (!contentType.includes('pdf')) {
          throw new Error(`Expected PDF but got ${contentType}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log('PdfJsPreview: ArrayBuffer size:', arrayBuffer.byteLength);

        const loadingTask = pdfjs.getDocument({ 
          data: arrayBuffer,
          // Add worker configuration for better reliability
          isEvalSupported: false,
          disableAutoFetch: true,
          disableStream: true
        });
        const pdfDoc = await loadingTask.promise;
        
        if (cancelled) return;

        console.log('PdfJsPreview: PDF loaded successfully, pages:', pdfDoc.numPages);
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
      } catch (e: any) {
        if (!cancelled) {
          console.error('PdfJsPreview: Error loading PDF:', e);
          setError(e.message || 'Failed to load PDF');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      // Cancel all ongoing render tasks
      renderTasksRef.current.forEach((task, pageNum) => {
        console.log(`Cancelling render task for page ${pageNum} during load cleanup`);
        task.cancel();
      });
      renderTasksRef.current.clear();
    };
  }, [apiUrl]);

  // Calculate optimal scale for fit-to-width
  const calculateFitToWidthScale = useCallback(async () => {
    if (!pdf || !containerRef.current) return 1;
    
    try {
      const pageObj = await pdf.getPage(1);
      const unscaledViewport = pageObj.getViewport({ scale: 1, rotation });
      const containerWidth = containerRef.current.clientWidth - 40; // Account for padding
      const fitScale = containerWidth / unscaledViewport.width;
      return Math.min(2.5, Math.max(0.5, fitScale)); // Cap between 0.5x and 2.5x
    } catch (e) {
      console.error('Error calculating scale:', e);
      return 1;
    }
  }, [pdf, rotation]);

  // Render specific page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdf || pageNum < 1 || pageNum > numPages) return;
    
    const canvas = canvasRefs.current[pageNum - 1];
    if (!canvas) return;

    // Cancel any ongoing render task for this page
    const existingTask = renderTasksRef.current.get(pageNum);
    if (existingTask) {
      console.log(`Cancelling previous render task for page ${pageNum}`);
      existingTask.cancel();
      renderTasksRef.current.delete(pageNum);
    }

    try {
      console.log(`PdfJsPreview: Rendering page ${pageNum}`);
      
      const pageObj = await pdf.getPage(pageNum);
      const viewport = pageObj.getViewport({ scale, rotation });

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      // Store render task for cancellation
      const renderTask = pageObj.render(renderContext);
      renderTasksRef.current.set(pageNum, renderTask);
      
      await renderTask.promise;
      renderTasksRef.current.delete(pageNum);
      
      // Mark page as rendered
      setRenderedPages(prev => new Set(prev).add(pageNum));
      
      console.log(`PdfJsPreview: Page ${pageNum} rendered successfully`);
    } catch (e: any) {
      // Don't log cancellation errors as they're expected
      if (e.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${pageNum}:`, e);
        setError(`Failed to render page ${pageNum}`);
      } else {
        console.log(`Render task for page ${pageNum} was cancelled`);
      }
    }
  }, [pdf, scale, rotation, numPages]);

  // Render all pages
  const renderAllPages = useCallback(async () => {
    if (!pdf || numPages === 0) return;
    
    console.log(`Rendering all ${numPages} pages`);
    
    // Render pages sequentially to avoid overwhelming the browser
    for (let i = 1; i <= numPages; i++) {
      await renderPage(i);
      // Small delay to prevent blocking UI
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }, [pdf, numPages, renderPage]);

  // Auto-fit to width when PDF loads
  useEffect(() => {
    if (pdf && containerRef.current) {
      calculateFitToWidthScale().then(fitScale => {
        setScale(fitScale);
      });
    }
  }, [pdf, calculateFitToWidthScale]);

  // Render all pages when PDF loads or scale/rotation changes
  useEffect(() => {
    if (pdf && numPages > 0) {
      // Initialize canvas refs array
      canvasRefs.current = new Array(numPages).fill(null);
      setRenderedPages(new Set());
      renderAllPages();
    }
  }, [pdf, numPages, renderAllPages]);

  // Re-render all pages when scale or rotation changes
  useEffect(() => {
    if (pdf && numPages > 0 && renderedPages.size > 0) {
      setRenderedPages(new Set());
      renderAllPages();
    }
  }, [scale, rotation]);

  // Track which page is currently in view during scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const handleScroll = () => {
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const containerCenter = containerTop + containerHeight / 2;

      // Find which page is in the center of the view
      for (let i = 0; i < numPages; i++) {
        const canvas = canvasRefs.current[i];
        if (canvas) {
          const canvasTop = canvas.offsetTop;
          const canvasBottom = canvasTop + canvas.offsetHeight;
          
          if (containerCenter >= canvasTop && containerCenter <= canvasBottom) {
            setCurrentPage(i + 1);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [numPages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all ongoing render tasks
      renderTasksRef.current.forEach((task, pageNum) => {
        console.log(`Cancelling render task for page ${pageNum}`);
        task.cancel();
      });
      renderTasksRef.current.clear();
    };
  }, []);

  // Navigation handlers - scroll to specific page
  const scrollToPage = (pageNum: number) => {
    const canvas = canvasRefs.current[pageNum - 1];
    if (canvas && containerRef.current) {
      canvas.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      setCurrentPage(pageNum);
    }
  };

  const goToPreviousPage = () => {
    const prevPage = Math.max(1, currentPage - 1);
    scrollToPage(prevPage);
  };
  
  const goToNextPage = () => {
    const nextPage = Math.min(numPages, currentPage + 1);
    scrollToPage(nextPage);
  };

  const zoomIn = () => setScale(s => Math.min(3, s * 1.25));
  const zoomOut = () => setScale(s => Math.max(0.25, s * 0.8));
  const rotateClockwise = () => setRotation(r => (r + 90) % 360);
  const fitToWidth = async () => {
    const fitScale = await calculateFitToWidthScale();
    setScale(fitScale);
  };

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

  // Success state
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
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {currentPage} / {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
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
            <Button variant="outline" size="sm" onClick={fitToWidth}>
              Fit Width
            </Button>
            <Button variant="outline" size="sm" onClick={rotateClockwise}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Canvas Container - Seamless Continuous View */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-white"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="flex flex-col items-center">
          {Array.from({ length: numPages }, (_, index) => {
            const pageNum = index + 1;
            return (
              <canvas
                key={pageNum}
                ref={(el) => {
                  canvasRefs.current[index] = el;
                }}
                className="bg-white block"
                style={{ 
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  marginBottom: index === numPages - 1 ? '0' : '-1px' // Seamless connection between pages
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex-shrink-0 p-2 bg-gray-100 text-xs text-gray-600 border-t">
          <div>API: {apiUrl}</div>
          <div>Pages: {numPages} | Current: {currentPage} | Scale: {Math.round(scale * 100)}% | Rotation: {rotation}° | Rendered: {renderedPages.size}</div>
        </div>
      )}
    </div>
  );
}
