/**
 * Utils - Barrel Export
 * 
 * Centralized exports for all utility functions
 */

// Class name utility
export { cn } from './cn';

// File reference management
export {
  fileReferenceManager,
  setFileReference,
  getFileReference,
  hasFileReference,
  removeFileReference,
  clearAllFileReferences,
  getFileReferenceCount,
  logFileReferences
} from './fileReferenceManager';

// Local storage management
export {
  localStorageManager,
  saveDraft,
  loadDraft,
  clearDraft,
  hasDraft,
  getDraftAge,
  useLocalStorageDraft,
  DRAFT_STORAGE_KEY,
  DRAFT_TIMESTAMP_KEY,
  DRAFT_EXPIRY_MINUTES
} from './localStorageManager';

// Message utilities
export {
  isMessageFromUser,
  getMessageSenderDisplayName
} from './messageUtils';

// Firestore utilities
export * from './firestoreUtils';

// Data transformation
export * from './dataTransformation';

// Form prepopulation
export * from './formPrepopulation';

// Status utilities
export * from './statusUtils';

// Zip utilities
export * from './zip';

