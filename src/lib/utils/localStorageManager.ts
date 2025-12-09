"use client";

import { FormState } from "@/hooks/useSubmissionFormReducer";
import { InformationType, DocumentsType } from "@/types";

// Constants for localStorage keys
export const DRAFT_STORAGE_KEY = "submission_draft";
export const DRAFT_TIMESTAMP_KEY = "submission_draft_timestamp";
export const DRAFT_EXPIRY_HOURS = 24; // Draft expires after 24 hours

// Interface for serialized draft data
interface SerializedDraftData {
  formData: InformationType;
  documents: DocumentsType[];
  currentStep: number;
  timestamp: number;
  version: string; // For future compatibility
}

// Utility functions for localStorage operations
class LocalStorageManager {
  private static instance: LocalStorageManager;
  private readonly version = "1.0.0";

  static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  // Check if localStorage is available
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = "__test_localStorage__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  // Save draft data to localStorage
  saveDraft(formState: Partial<FormState>): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn("localStorage is not available");
      return false;
    }

    try {
      // Filter out _fileRef properties from documents before saving to localStorage
      // File objects cannot be serialized to JSON
      // Also mark documents as having lost their file reference
      const documentsForStorage = (formState.documents || []).map(doc => {
        if (doc._fileRef) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _fileRef, ...docWithoutFileRef } = doc;
          console.warn(`Document "${doc.title}" file reference will be lost during localStorage save`);
          return {
            ...docWithoutFileRef,
            _fileRefLost: true, // Mark that file reference was lost during save
            _lastSaved: new Date().toISOString(), // Track when it was saved
          };
        }
        return doc;
      });

      const draftData: SerializedDraftData = {
        formData: formState.formData || {} as InformationType,
        documents: documentsForStorage,
        currentStep: formState.currentStep || 0,
        timestamp: Date.now(),
        version: this.version,
      };

      const serializedData = JSON.stringify(draftData);
      localStorage.setItem(DRAFT_STORAGE_KEY, serializedData);
      localStorage.setItem(DRAFT_TIMESTAMP_KEY, Date.now().toString());

      return true;
    } catch (error) {
      console.error("Failed to save draft:", error);
      return false;
    }
  }

  // Load draft data from localStorage
  loadDraft(): Partial<FormState> | null {
    if (!this.isLocalStorageAvailable()) {
      console.warn("localStorage is not available");
      return null;
    }

    try {
      const serializedData = localStorage.getItem(DRAFT_STORAGE_KEY);
      const timestampStr = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

      if (!serializedData || !timestampStr) {
        return null;
      }

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      const hoursElapsed = (now - timestamp) / (1000 * 60 * 60);

      // Check if draft has expired
      if (hoursElapsed > DRAFT_EXPIRY_HOURS) {
        this.clearDraft();
        return null;
      }

      const draftData: SerializedDraftData = JSON.parse(serializedData);

      // Version compatibility check
      if (draftData.version !== this.version) {
        console.warn("Draft data version mismatch, clearing...");
        this.clearDraft();
        return null;
      }

      // Validate draft data structure
      if (!this.validateDraftData(draftData)) {
        console.warn("Invalid draft data structure, clearing...");
        this.clearDraft();
        return null;
      }

      return {
        formData: draftData.formData,
        documents: draftData.documents,
        currentStep: draftData.currentStep,
        lastSaved: new Date(timestamp),
        isDraftSaved: true,
      };
    } catch (error) {
      console.error("Failed to load draft:", error);
      this.clearDraft(); // Clear corrupted data
      return null;
    }
  }

  // Clear draft data from localStorage
  clearDraft(): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
      return true;
    } catch (error) {
      console.error("Failed to clear draft:", error);
      return false;
    }
  }

  // Check if draft exists and is valid
  hasDraft(): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    const serializedData = localStorage.getItem(DRAFT_STORAGE_KEY);
    const timestampStr = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

    if (!serializedData || !timestampStr) {
      return false;
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const hoursElapsed = (now - timestamp) / (1000 * 60 * 60);

    return hoursElapsed <= DRAFT_EXPIRY_HOURS;
  }

  // Get draft age in hours
  getDraftAge(): number | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    const timestampStr = localStorage.getItem(DRAFT_TIMESTAMP_KEY);
    if (!timestampStr) {
      return null;
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    return (now - timestamp) / (1000 * 60 * 60);
  }

  // Validate draft data structure
  private validateDraftData(data: any): data is SerializedDraftData {
    return (
      data &&
      typeof data === 'object' &&
      data.formData &&
      Array.isArray(data.documents) &&
      typeof data.currentStep === 'number' &&
      typeof data.timestamp === 'number' &&
      typeof data.version === 'string'
    );
  }

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; percentage: number } | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      let used = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Rough estimate of available space (5MB is typical limit)
      const estimated_limit = 5 * 1024 * 1024; // 5MB in bytes
      const available = estimated_limit - used;
      const percentage = (used / estimated_limit) * 100;

      return {
        used,
        available,
        percentage: Math.round(percentage * 100) / 100,
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return null;
    }
  }

  // Export draft data (for backup/debugging)
  exportDraft(): string | null {
    const draftData = this.loadDraft();
    if (!draftData) {
      return null;
    }

    try {
      return JSON.stringify(draftData, null, 2);
    } catch (error) {
      console.error("Failed to export draft:", error);
      return null;
    }
  }

  // Import draft data (for restore/debugging)
  importDraft(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      return this.saveDraft(data);
    } catch (error) {
      console.error("Failed to import draft:", error);
      return false;
    }
  }
}

// Export singleton instance
export const localStorageManager = LocalStorageManager.getInstance();

// Convenience functions
export const saveDraft = (formState: Partial<FormState>) => 
  localStorageManager.saveDraft(formState);

export const loadDraft = () => 
  localStorageManager.loadDraft();

export const clearDraft = () => 
  localStorageManager.clearDraft();

export const hasDraft = () => 
  localStorageManager.hasDraft();

export const getDraftAge = () => 
  localStorageManager.getDraftAge();

// Hook for using localStorage in React components
export const useLocalStorageDraft = () => {
  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    getDraftAge,
    getStorageInfo: () => localStorageManager.getStorageInfo(),
    exportDraft: () => localStorageManager.exportDraft(),
    importDraft: (data: string) => localStorageManager.importDraft(data),
  };
};

