"use client";

/**
 * File Reference Manager
 * 
 * Manages File objects in memory separately from localStorage to prevent
 * file reference loss during serialization/deserialization.
 * 
 * Files are stored in memory using a Map keyed by document ID.
 * When documents are saved to localStorage, only metadata is stored.
 * When documents are loaded from localStorage, file references are
 * restored from this manager.
 */

class FileReferenceManager {
  private static instance: FileReferenceManager;
  private fileReferences: Map<string, File>;

  private constructor() {
    this.fileReferences = new Map();
  }

  static getInstance(): FileReferenceManager {
    if (!FileReferenceManager.instance) {
      FileReferenceManager.instance = new FileReferenceManager();
    }
    return FileReferenceManager.instance;
  }

  /**
   * Store a file reference for a document
   */
  setFile(documentId: string, file: File): void {
    this.fileReferences.set(documentId, file);
    console.log(`📁 File reference stored for document: ${documentId}`);
  }

  /**
   * Get a file reference for a document
   */
  getFile(documentId: string): File | undefined {
    return this.fileReferences.get(documentId);
  }

  /**
   * Check if a file reference exists for a document
   */
  hasFile(documentId: string): boolean {
    return this.fileReferences.has(documentId);
  }

  /**
   * Remove a file reference for a document
   */
  removeFile(documentId: string): boolean {
    const removed = this.fileReferences.delete(documentId);
    if (removed) {
      console.log(`🗑️ File reference removed for document: ${documentId}`);
    }
    return removed;
  }

  /**
   * Get all file references as an array of [documentId, File] tuples
   */
  getAllFiles(): Array<[string, File]> {
    return Array.from(this.fileReferences.entries());
  }

  /**
   * Clear all file references (e.g., after successful submission)
   */
  clearAll(): void {
    const count = this.fileReferences.size;
    this.fileReferences.clear();
    console.log(`🧹 Cleared ${count} file references`);
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
   * Log current state for debugging
   */
  logState(): void {
    console.log('📊 File Reference Manager State:');
    console.log(`  - Total files: ${this.getCount()}`);
    console.log(`  - Total size: ${(this.getTotalSize() / 1024 / 1024).toFixed(2)} MB`);
    
    const files = this.getAllFileInfo();
    if (files.length > 0) {
      console.log('  - Files:');
      files.forEach(({ documentId, name, size, type }) => {
        console.log(`    - ${documentId}: ${name} (${(size / 1024).toFixed(2)} KB, ${type})`);
      });
    }
  }
}

// Export singleton instance
export const fileReferenceManager = FileReferenceManager.getInstance();

// Convenience functions
export const setFileReference = (documentId: string, file: File) => 
  fileReferenceManager.setFile(documentId, file);

export const getFileReference = (documentId: string): File | undefined => 
  fileReferenceManager.getFile(documentId);

export const hasFileReference = (documentId: string): boolean => 
  fileReferenceManager.hasFile(documentId);

export const removeFileReference = (documentId: string): boolean => 
  fileReferenceManager.removeFile(documentId);

export const clearAllFileReferences = () => 
  fileReferenceManager.clearAll();

export const getFileReferenceCount = (): number => 
  fileReferenceManager.getCount();

export const logFileReferences = () => 
  fileReferenceManager.logState();

