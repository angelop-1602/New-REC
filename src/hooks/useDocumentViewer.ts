"use client";

import { useState, useCallback } from 'react';
import { ref, getStorage, getBlob, getDownloadURL } from 'firebase/storage';
import firebaseApp from '@/lib/firebaseConfig';
import JSZip from 'jszip';
import { getFileExtension } from '@/lib/utils/zip';

// Enhanced document viewer hook with better error handling and performance
export interface DocumentViewerState {
  loading: boolean;
  error: string | null;
  progress: number;
}

// Supported file types with priorities and MIME types
const SUPPORTED_FILE_TYPES = {
  pdf: { priority: 1, type: 'application/pdf', name: 'PDF Document' },
  png: { priority: 2, type: 'image/png', name: 'PNG Image' },
  jpg: { priority: 2, type: 'image/jpeg', name: 'JPEG Image' },
  jpeg: { priority: 2, type: 'image/jpeg', name: 'JPEG Image' },
  html: { priority: 3, type: 'text/html', name: 'HTML Document' },
  htm: { priority: 3, type: 'text/html', name: 'HTML Document' },
  txt: { priority: 4, type: 'text/plain', name: 'Text Document' },
  md: { priority: 4, type: 'text/markdown', name: 'Markdown Document' },
} as const;

// Enhanced cache with metadata
interface CachedFile {
  blob: Blob;
  type: string;
  name: string;
  timestamp: number;
  size: number;
  extension: string;
}

// Memory cache with size limit (50MB total)
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const fileCache = new Map<string, CachedFile>();

export const useDocumentViewer = () => {
  const [state, setState] = useState<DocumentViewerState>({
    loading: false,
    error: null,
    progress: 0,
  });

  // Enhanced cache cleanup with size management
  const cleanupCache = useCallback(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    let totalSize = 0;
    
    // Calculate current cache size and remove old entries
    const entries = Array.from(fileCache.entries());
    const validEntries = entries.filter(([key, value]) => {
      if (value.timestamp < oneHourAgo) {
        fileCache.delete(key);
        return false;
      }
      totalSize += value.size;
      return true;
    });

    // If cache is too large, remove oldest entries
    if (totalSize > MAX_CACHE_SIZE) {
      const sortedByAge = validEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      let currentSize = totalSize;
      
      for (const [key, value] of sortedByAge) {
        if (currentSize <= MAX_CACHE_SIZE * 0.8) break; // Keep 80% of max size
        fileCache.delete(key);
        currentSize -= value.size;
      }
    }
  }, []);

  // Find best file to view from ZIP contents
  const findBestFileToView = useCallback((files: JSZip.JSZipObject[]) => {
    const viewableFiles = files
      .filter(file => !file.dir)
      .map(file => {
        const extension = getFileExtension(file.name);
        const supportedType = SUPPORTED_FILE_TYPES[extension as keyof typeof SUPPORTED_FILE_TYPES];
        return {
          file,
          extension,
          priority: supportedType?.priority || 999,
          type: supportedType?.type || 'application/octet-stream',
          name: supportedType?.name || 'Unknown File Type'
        };
      })
      .filter(item => item.priority < 999)
      .sort((a, b) => {
        // Sort by priority first, then by filename
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.file.name.localeCompare(b.file.name);
      });

    return viewableFiles.length > 0 ? viewableFiles[0] : null;
  }, []);

  // Open file in new tab with enhanced error handling
  const openFileInNewTab = useCallback((blob: Blob, fileName: string, mimeType: string) => {
    try {
      // Create a Blob with the correct MIME type
      const typedBlob = new Blob([blob], { type: mimeType });
      
      // Create object URL
      const url = URL.createObjectURL(typedBlob);
      
      // Try to open in new tab
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback: trigger download if popup blocked
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Notify user about download
        setState(prev => ({ 
          ...prev, 
          error: `Popup blocked. File "${fileName}" has been downloaded instead.` 
        }));
      }
      
      // Clean up object URL after delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 3000);
      
    } catch (error) {
      console.error('Error opening file:', error);
      throw new Error(`Failed to open file "${fileName}" in browser`);
    }
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const entries = Array.from(fileCache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const fileTypes = entries.reduce((acc, entry) => {
      acc[entry.extension] = (acc[entry.extension] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFiles: entries.length,
      totalSize,
      fileTypes,
      maxSize: MAX_CACHE_SIZE,
      utilizationPercent: Math.round((totalSize / MAX_CACHE_SIZE) * 100)
    };
  }, []);

  // Main document viewing function
  const viewDocument = useCallback(async (storagePath: string, documentTitle?: string) => {
    if (!storagePath) {
      throw new Error('Storage path is required');
    }

    setState({ loading: true, error: null, progress: 0 });
    
    try {
      // Clean up cache
      cleanupCache();
      
      // Check cache first
      const cacheKey = storagePath;
      const cachedFile = fileCache.get(cacheKey);
      
      if (cachedFile) {
        console.log('Opening cached file:', cachedFile.name);
        openFileInNewTab(cachedFile.blob, cachedFile.name, cachedFile.type);
        setState({ loading: false, error: null, progress: 100 });
        return;
      }

      setState(prev => ({ ...prev, progress: 10 }));

      // Try multiple approaches to download and extract ZIP file
      const storage = getStorage(firebaseApp);
      const storageRef = ref(storage, storagePath);
      
      let zipBlob: Blob | null = null;
      
      // Method 1: Try getBlob() first (most reliable when it works)
      try {
        zipBlob = await getBlob(storageRef);
        setState(prev => ({ ...prev, progress: 40 }));
        console.log('Successfully downloaded via getBlob(), size:', zipBlob.size);
      } catch (getBlobError) {
        console.log('getBlob() failed, trying fetch method:', getBlobError);
        
        // Method 2: Try fetch with download URL (fallback)
        try {
          const downloadUrl = await getDownloadURL(storageRef);
          setState(prev => ({ ...prev, progress: 30 }));
          
          const response = await fetch(downloadUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Accept': 'application/zip, application/octet-stream, */*',
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          zipBlob = await response.blob();
          setState(prev => ({ ...prev, progress: 40 }));
          console.log('Successfully downloaded via fetch(), size:', zipBlob.size);
        } catch (fetchError) {
          console.log('Fetch also failed, trying XHR method:', fetchError);
          
          // Method 3: Use XMLHttpRequest (sometimes bypasses CORS restrictions)
          try {
            const downloadUrl = await getDownloadURL(storageRef);
            
            const response = await new Promise<Response>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', downloadUrl, true);
              xhr.responseType = 'blob';
              xhr.onload = () => {
                if (xhr.status === 200) {
                  resolve(new Response(xhr.response));
                } else {
                  reject(new Error(`XHR failed: ${xhr.status}`));
                }
              };
              xhr.onerror = () => reject(new Error('XHR network error'));
              xhr.send();
            });
            
            zipBlob = await response.blob();
            setState(prev => ({ ...prev, progress: 40 }));
            console.log('Successfully downloaded via XHR, size:', zipBlob.size);
          } catch (xhrError) {
            console.error('All download methods failed:', xhrError);
            throw new Error('Unable to download file. All methods failed due to browser restrictions.');
          }
        }
      }
      
      if (!zipBlob || zipBlob.size === 0) {
        throw new Error('Downloaded file is empty or invalid');
      }
      
      setState(prev => ({ ...prev, progress: 50 }));
      
      setState(prev => ({ ...prev, progress: 70 }));
      
      // Load and extract ZIP contents
      const zip = await JSZip.loadAsync(zipBlob);
      const files = Object.values(zip.files);
      
      if (files.length === 0) {
        throw new Error('ZIP file is empty');
      }
      
      setState(prev => ({ ...prev, progress: 85 }));
      
      // Find the best file to view
      const bestFile = findBestFileToView(files);
      
      if (!bestFile) {
        // No viewable files found - offer direct ZIP download
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
      const fileBlob = await bestFile.file.async('blob');
      
      // Cache the extracted file
      const cacheEntry: CachedFile = {
        blob: fileBlob,
        type: bestFile.type,
        name: bestFile.file.name,
        timestamp: Date.now(),
        size: fileBlob.size,
        extension: bestFile.extension
      };
      
      fileCache.set(cacheKey, cacheEntry);
      
      setState(prev => ({ ...prev, progress: 95 }));
      
      // Open file in new tab
      openFileInNewTab(fileBlob, bestFile.file.name, bestFile.type);
      
      setState({ loading: false, error: null, progress: 100 });
      
    } catch (error) {
      console.error('Error viewing document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to view document';
      setState({ loading: false, error: errorMessage, progress: 0 });
      
      // Auto-clear error after 10 seconds
      setTimeout(() => {
        setState(prev => prev.error === errorMessage ? { ...prev, error: null } : prev);
      }, 10000);
      
      throw error;
    }
  }, [cleanupCache, findBestFileToView, openFileInNewTab]);

  // Clear all cached files
  const clearCache = useCallback(() => {
    fileCache.clear();
  }, []);

  // Get supported file types info
  const getSupportedTypes = useCallback(() => {
    return Object.entries(SUPPORTED_FILE_TYPES).map(([ext, info]) => ({
      extension: ext,
      ...info
    }));
  }, []);

  return {
    ...state,
    viewDocument,
    clearCache,
    getCacheStats,
    getSupportedTypes,
  };
};

// Export utility functions
export { fileCache };
export const clearDocumentCache = () => fileCache.clear();
export const getDocumentCacheSize = () => fileCache.size;