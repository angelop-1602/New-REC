"use client";

/**
 * IndexedDB File Storage Manager
 * 
 * Provides persistent storage for File objects using IndexedDB.
 * Files are stored as Blobs and can be restored even after page refresh.
 * 
 * This solves the problem of file references being lost when:
 * - Page is refreshed
 * - localStorage expires
 * - Browser session ends
 */

const DB_NAME = "submission_file_storage";
const DB_VERSION = 1;
const STORE_NAME = "files";

interface FileMetadata {
  documentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  lastModified: number;
  storedAt: number;
}

class IndexedDBFileStorage {
  private static instance: IndexedDBFileStorage;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): IndexedDBFileStorage {
    if (!IndexedDBFileStorage.instance) {
      IndexedDBFileStorage.instance = new IndexedDBFileStorage();
    }
    return IndexedDBFileStorage.instance;
  }

  /**
   * Initialize IndexedDB database
   */
  private async init(): Promise<void> {
    if (this.db) {
      return; // Already initialized
    }

    if (this.initPromise) {
      return this.initPromise; // Initialization in progress
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (typeof window === "undefined" || !window.indexedDB) {
        console.warn("IndexedDB is not available. File persistence will not work.");
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "documentId" });
          objectStore.createIndex("storedAt", "storedAt", { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Store a file in IndexedDB
   */
  async storeFile(documentId: string, file: File): Promise<void> {
    await this.init();

    if (!this.db) {
      console.warn("IndexedDB not available. File will not be persisted.");
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const metadata: FileMetadata = {
        documentId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        lastModified: file.lastModified,
        storedAt: Date.now(),
      };

      const data = {
        documentId,
        blob: file,
        metadata,
      };

      const request = store.put(data);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("Failed to store file in IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Retrieve a file from IndexedDB
   */
  async getFile(documentId: string): Promise<File | null> {
    await this.init();

    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(documentId);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.blob instanceof File) {
          resolve(result.blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error("Failed to retrieve file from IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if a file exists in IndexedDB
   */
  async hasFile(documentId: string): Promise<boolean> {
    const file = await this.getFile(documentId);
    return file !== null;
  }

  /**
   * Remove a file from IndexedDB
   */
  async removeFile(documentId: string): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(documentId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("Failed to remove file from IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all stored file document IDs
   */
  async getAllDocumentIds(): Promise<string[]> {
    await this.init();

    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        console.error("Failed to get document IDs from IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all files from IndexedDB
   */
  async clearAll(): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("Failed to clear IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    fileCount: number;
    totalSize: number;
    documentIds: string[];
  }> {
    await this.init();

    if (!this.db) {
      return { fileCount: 0, totalSize: 0, documentIds: [] };
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;
        const fileCount = results.length;
        let totalSize = 0;
        const documentIds: string[] = [];

        results.forEach((result: any) => {
          if (result.metadata) {
            totalSize += result.metadata.fileSize || 0;
            documentIds.push(result.documentId);
          }
        });

        resolve({ fileCount, totalSize, documentIds });
      };

      request.onerror = () => {
        console.error("Failed to get storage stats from IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const indexedDBFileStorage = IndexedDBFileStorage.getInstance();

// Convenience functions
export const storeFileInIndexedDB = (documentId: string, file: File) =>
  indexedDBFileStorage.storeFile(documentId, file);

export const getFileFromIndexedDB = (documentId: string) =>
  indexedDBFileStorage.getFile(documentId);

export const hasFileInIndexedDB = (documentId: string) =>
  indexedDBFileStorage.hasFile(documentId);

export const removeFileFromIndexedDB = (documentId: string) =>
  indexedDBFileStorage.removeFile(documentId);

export const clearAllFilesFromIndexedDB = () =>
  indexedDBFileStorage.clearAll();

export const getIndexedDBStorageStats = () =>
  indexedDBFileStorage.getStorageStats();

