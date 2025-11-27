/**
 * Utility functions for handling Firestore timestamps and dates
 */

// Type for Firestore Timestamp
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

/**
 * Convert Firestore timestamp to JavaScript Date
 */
export function firestoreTimestampToDate(timestamp: FirestoreTimestamp | string | Date | null | undefined): Date | null {
  if (!timestamp) return null;
  
  if (timestamp instanceof Date) return timestamp;
  
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }
  
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }
  
  return null;
}

/**
 * Convert Firestore timestamp to ISO string
 */
export function firestoreTimestampToISOString(timestamp: FirestoreTimestamp | string | Date | null | undefined): string | null {
  const date = firestoreTimestampToDate(timestamp);
  return date ? date.toISOString() : null;
}

/**
 * Convert Firestore timestamp to locale date string
 */
export function firestoreTimestampToLocaleDateString(timestamp: FirestoreTimestamp | string | Date | null | undefined): string {
  const date = firestoreTimestampToDate(timestamp);
  return date ? date.toLocaleDateString() : 'Unknown Date';
}

/**
 * Convert Firestore timestamp to locale date time string
 */
export function firestoreTimestampToLocaleDateTimeString(timestamp: FirestoreTimestamp | string | Date | null | undefined): string {
  const date = firestoreTimestampToDate(timestamp);
  return date ? date.toLocaleString() : 'Unknown Date';
}

/**
 * Convert Firestore timestamp to relative time string (e.g., "2 hours ago")
 */
export function firestoreTimestampToRelativeTime(timestamp: FirestoreTimestamp | string | Date | null | undefined): string {
  const date = firestoreTimestampToDate(timestamp);
  if (!date) return 'Unknown Date';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}

/**
 * Process Firestore document data to convert all timestamps
 */
export function processFirestoreDocument<T extends Record<string, any>>(doc: T): T {
  const processed = { ...doc };
  
  // Convert common timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'uploadedAt', 'reviewedAt', 'assignedAt', 'dueDate'];
  
  timestampFields.forEach(field => {
    if (processed[field]) {
      (processed as Record<string, unknown>)[field] = firestoreTimestampToISOString(processed[field] as any);
    }
  });
  
  return processed;
}

/**
 * Process array of Firestore documents
 */
export function processFirestoreDocuments<T extends Record<string, any>>(docs: T[]): T[] {
  return docs.map(processFirestoreDocument);
}
