import { useCallback } from 'react';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';

const db = getFirestore(firebaseApp);

/**
 * Hook for generating SPUP REC codes
 * Format: SPUP_yyyy_(count)_(SR/Ex)_(initials)
 * Example: SPUP_2025_00309_SR_DQ
 */
export const useSpupRecCodeGenerator = () => {
  // Generate initials from full name
  const generateInitials = useCallback((fullName: string): string => {
    const words = fullName.trim().split(/\s+/);
    if (words.length === 0) return 'XX';
    
    if (words.length === 1) {
      // Single word - take first two characters
      return words[0].substring(0, 2).toUpperCase();
    }
    
    // Multiple words - take first character of first and last word
    const firstInitial = words[0].charAt(0).toUpperCase();
    const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  }, []);

  // Get count of approved applications for the year (placeholder for future implementation)
  const getApprovedApplicationCount = useCallback(async (year: number): Promise<number> => {
    try {
      // TODO: This will be implemented when we have the approved submissions collection
      // For now, return a placeholder count
      
      // Future implementation will query submissions_approved collection:
      // const startOfYear = new Date(year, 0, 1);
      // const endOfYear = new Date(year + 1, 0, 1);
      // const q = query(
      //   collection(db, 'submissions_approved'),
      //   where('approvedAt', '>=', startOfYear),
      //   where('approvedAt', '<', endOfYear)
      // );
      // const snapshot = await getDocs(q);
      // return snapshot.size;
      
      return 308; // Placeholder count (will start from 309)
    } catch (error) {
      console.error('Error getting approved application count:', error);
      return 0;
    }
  }, []);

  // Generate SPUP REC code
  const generateSpupRecCode = useCallback(async (
    reviewType: 'SR' | 'Ex', // Standard Review or Expedited
    investigatorName: string
  ): Promise<string> => {
    try {
      const year = new Date().getFullYear();
      const count = await getApprovedApplicationCount(year);
      const initials = generateInitials(investigatorName);
      const formattedCount = String(count + 1).padStart(5, '0');
      
      return `SPUP_${year}_${formattedCount}_${reviewType}_${initials}`;
    } catch (error) {
      console.error('Error generating SPUP REC code:', error);
      // Return a fallback code
      const year = new Date().getFullYear();
      const initials = generateInitials(investigatorName);
      return `SPUP_${year}_00001_${reviewType}_${initials}`;
    }
  }, [getApprovedApplicationCount, generateInitials]);

  // Generate temporary protocol code (for pending submissions)
  const generateTempProtocolCode = useCallback((): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    
    return `SPUPREC-${year}${month}${day}-${timestamp}`;
  }, []);

  return {
    generateSpupRecCode,
    generateTempProtocolCode,
    generateInitials,
  };
}; 