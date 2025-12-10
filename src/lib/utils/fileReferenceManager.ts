"use client";

/**
 * Enhanced File Reference Manager
 * 
 * Manages File objects using a dual-layer approach:
 * 1. In-memory Map for fast access (L1 cache)
 * 2. IndexedDB for persistent storage (survives page refresh)
 * 
 * This ensures file references are never lost, even after:
 * - Page refresh
 * - Browser restart
 * - localStorage expiration
 */

import {
  storeFileInIndexedDB,
  getFileFromIndexedDB,
  hasFileInIndexedDB,
  removeFileFromIndexedDB,
  clearAllFilesFromIndexedDB,
} from "./indexedDBFileStorage";

class FileReferenceManager {
  private static instance: FileReferenceManager;
  private fileReferences: Map<string, File>; // L1: In-memory cache
  private restorePromise: Promise<void> | null = null;

  private constructor() {
    this.fileReferences = new Map();
    // Auto-restore files from IndexedDB on initialization
    this.restoreFromIndexedDB();
  }

  static getInstance(): FileReferenceManager {
    if (!FileReferenceManager.instance) {
      FileReferenceManager.instance = new FileReferenceManager();
    }
    return FileReferenceManager.instance;
  }

  /**
   * Restore files from IndexedDB to memory cache
   */
  private async restoreFromIndexedDB(): Promise<void> {
    if (this.restorePromise) {
      return this.restorePromise;
    }

    this.restorePromise = (async () => {
      try {
        // Get all document IDs from IndexedDB
        const { indexedDBFileStorage } = await import("./indexedDBFileStorage");
        const documentIds = await indexedDBFileStorage.getAllDocumentIds();

        // Restore each file to memory
        for (const documentId of documentIds) {
          const file = await getFileFromIndexedDB(documentId);
          if (file) {
            this.fileReferences.set(documentId, file);
          }
        }
      } catch (error) {
        console.warn("Failed to restore files from IndexedDB:", error);
      }
    })();

    return this.restorePromise;
  }

  /**
   * Store a file reference for a document (both memory and IndexedDB)
   */
  async setFile(documentId: string, file: File): Promise<void> {
    // Store in memory (L1 cache) for fast access
    this.fileReferences.set(documentId, file);

    // Store in IndexedDB for persistence
    try {
      await storeFileInIndexedDB(documentId, file);
    } catch (error) {
      console.warn(`Failed to store file ${documentId} in IndexedDB:`, error);
      // Continue even if IndexedDB fails - memory storage still works
    }
  }

  /**
   * Get a file reference for a document
   * Tries memory first, then IndexedDB
   */
  async getFile(documentId: string): Promise<File | undefined> {
    // Try memory first (fastest)
    const memoryFile = this.fileReferences.get(documentId);
    if (memoryFile) {
      return memoryFile;
    }

    // Try IndexedDB (slower but persistent)
    try {
      const indexedFile = await getFileFromIndexedDB(documentId);
      if (indexedFile) {
        // Restore to memory for future fast access
        this.fileReferences.set(documentId, indexedFile);
        return indexedFile;
      }
    } catch (error) {
      console.warn(`Failed to get file ${documentId} from IndexedDB:`, error);
    }

    return undefined;
  }

  /**
   * Synchronous get (memory only) - for immediate access
   */
  getFileSync(documentId: string): File | undefined {
    return this.fileReferences.get(documentId);
  }

  /**
   * Check if a file reference exists for a document
   */
  async hasFile(documentId: string): Promise<boolean> {
    // Check memory first
    if (this.fileReferences.has(documentId)) {
      return true;
    }

    // Check IndexedDB
    try {
      return await hasFileInIndexedDB(documentId);
    } catch (error) {
      return false;
    }
  }

  /**
   * Synchronous has check (memory only)
   */
  hasFileSync(documentId: string): boolean {
    return this.fileReferences.has(documentId);
  }

  /**
   * Remove a file reference for a document (both memory and IndexedDB)
   */
  async removeFile(documentId: string): Promise<boolean> {
    // Remove from memory
    const memoryRemoved = this.fileReferences.delete(documentId);

    // Remove from IndexedDB
    try {
      await removeFileFromIndexedDB(documentId);
    } catch (error) {
      console.warn(`Failed to remove file ${documentId} from IndexedDB:`, error);
    }

    return memoryRemoved;
  }

  /**
   * Get all file references as an array of [documentId, File] tuples
   */
  getAllFiles(): Array<[string, File]> {
    return Array.from(this.fileReferences.entries());
  }

  /**
   * Clear all file references (both memory and IndexedDB)
   */
  async clearAll(): Promise<void> {
    // Clear memory
    this.fileReferences.clear();

    // Clear IndexedDB
    try {
      await clearAllFilesFromIndexedDB();
    } catch (error) {
      console.warn("Failed to clear IndexedDB:", error);
    }
  }

  /**
   * Get count of stored file references
   */
  getCount(): number {
    return this.fileReferences.size;
  }

  /**
   * Get total size of all stored files in bytes
   */
  getTotalSize(): number {
    let total = 0;
    this.fileReferences.forEach(file => {
      total += file.size;
    });
    return total;
  }

  /**
   * Get file info for debugging
   */
  getFileInfo(documentId: string): { name: string; size: number; type: string } | null {
    const file = this.fileReferences.get(documentId);
    if (!file) return null;
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
    };
  }

  /**
   * Get all file info for debugging
   */
  getAllFileInfo(): Array<{ documentId: string; name: string; size: number; type: string }> {
    const info: Array<{ documentId: string; name: string; size: number; type: string }> = [];
    
    this.fileReferences.forEach((file, documentId) => {
      info.push({
        documentId,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    });
    
    return info;
  }

  /**
   * Validate all documents have file references
   */
  async validateDocuments(documents: Array<{ id: string; title: string }>): Promise<{
    valid: boolean;
    missing: Array<{ id: string; title: string }>;
  }> {
    const missing: Array<{ id: string; title: string }> = [];

    for (const doc of documents) {
      const hasFile = await this.hasFile(doc.id);
      if (!hasFile) {
        missing.push(doc);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Log current state for debugging
   */
  logState(): void {
    if (process.env.NODE_ENV === "development") {
      console.log("File Reference Manager State:", {
        memoryCount: this.fileReferences.size,
        totalSize: this.getTotalSize(),
        files: this.getAllFileInfo(),
      });
    }
  }
}

// Export singleton instance
export const fileReferenceManager = FileReferenceManager.getInstance();

// Convenience functions (async versions)
export const setFileReference = async (documentId: string, file: File) => 
  fileReferenceManager.setFile(documentId, file);

export const getFileReference = async (documentId: string): Promise<File | undefined> => 
  fileReferenceManager.getFile(documentId);

export const getFileReferenceSync = (documentId: string): File | undefined => 
  fileReferenceManager.getFileSync(documentId);

export const hasFileReference = async (documentId: string): Promise<boolean> => 
  fileReferenceManager.hasFile(documentId);

export const hasFileReferenceSync = (documentId: string): boolean => 
  fileReferenceManager.hasFileSync(documentId);

export const removeFileReference = async (documentId: string): Promise<boolean> => 
  fileReferenceManager.removeFile(documentId);

export const clearAllFileReferences = async () => 
  fileReferenceManager.clearAll();

export const getFileReferenceCount = (): number => 
  fileReferenceManager.getCount();

export const validateDocumentFiles = async (documents: Array<{ id: string; title: string }>) =>
  fileReferenceManager.validateDocuments(documents);

export const logFileReferences = () => 
  fileReferenceManager.logState();

