import { useCallback } from 'react';

/**
 * Hook for generating document IDs
 * Format: REC_yyyy_(6 random characters)
 * Example: REC_2025_A3X7M9
 */
export const useDocumentIdGenerator = () => {
  // Generate random string with uppercase letters and numbers
  const generateRandomString = useCallback((length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Generate document ID
  const generateDocumentId = useCallback((): string => {
    const year = new Date().getFullYear();
    const randomChars = generateRandomString(6);
    return `REC_${year}_${randomChars}`;
  }, [generateRandomString]);

  // Generate multiple unique IDs (useful for batch operations)
  const generateMultipleDocumentIds = useCallback((count: number): string[] => {
    // const ids: string[] = []; // Currently not used
    const idsSet = new Set<string>();
    
    while (idsSet.size < count) {
      const newId = generateDocumentId();
      idsSet.add(newId);
    }
    
    return Array.from(idsSet);
  }, [generateDocumentId]);

  return {
    generateDocumentId,
    generateMultipleDocumentIds,
  };
}; 