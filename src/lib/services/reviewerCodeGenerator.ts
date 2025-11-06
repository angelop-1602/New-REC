import firebaseApp from '@/lib/firebaseConfig';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const db = getFirestore(firebaseApp);
const REVIEWERS_COLLECTION = 'reviewers';

/**
 * Generate reviewer code based on name initials and sequential number
 * Format: [INITIALS]-[NUMBER]
 * Example: "DRJF-018" for "Dr. Janette Fermin" as the 18th reviewer
 */
export class ReviewerCodeGenerator {
  /**
   * Extract initials from a full name
   * @param name Full name (e.g., "Dr. Janette Fermin")
   * @returns Initials (e.g., "DRJF")
   */
  private static extractInitials(name: string): string {
    // Remove common titles and clean the name
    const cleanName = name
      .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '') // Remove titles
      .trim();
    
    // Split by spaces and get first letter of each word
    const words = cleanName.split(/\s+/);
    const initials = words
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    return initials;
  }

  /**
   * Get the next sequential number for reviewers
   * @returns Next number in sequence
   */
  private static async getNextNumber(): Promise<number> {
    try {
      const reviewersRef = collection(db, REVIEWERS_COLLECTION);
      const q = query(reviewersRef, orderBy('createdAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return 1; // First reviewer
      }
      
      // Get the latest reviewer's code and extract the number
      const latestReviewer = snapshot.docs[0].data();
      const latestCode = latestReviewer.code || '';
      
      // Extract number from code (e.g., "DRJF-018" -> 18)
      const match = latestCode.match(/-(\d+)$/);
      if (match) {
        return parseInt(match[1]) + 1;
      }
      
      // If no number found, count all reviewers
      const allSnapshot = await getDocs(collection(db, REVIEWERS_COLLECTION));
      return allSnapshot.size + 1;
    } catch (error) {
      console.error('Error getting next reviewer number:', error);
      // Fallback: count all reviewers
      try {
        const allSnapshot = await getDocs(collection(db, REVIEWERS_COLLECTION));
        return allSnapshot.size + 1;
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        return 1;
      }
    }
  }

  /**
   * Generate a unique reviewer code
   * @param name Full name of the reviewer
   * @returns Generated code (e.g., "DRJF-018")
   */
  static async generateCode(name: string): Promise<string> {
    const initials = this.extractInitials(name);
    const number = await this.getNextNumber();
    
    // Format number with leading zeros (3 digits)
    const formattedNumber = number.toString().padStart(3, '0');
    
    return `${initials}-${formattedNumber}`;
  }

  /**
   * Validate if a code follows the correct format
   * @param code Code to validate
   * @returns True if valid format
   */
  static validateCode(code: string): boolean {
    const pattern = /^[A-Z]{2,4}-\d{3}$/;
    return pattern.test(code);
  }

  /**
   * Extract name from code (reverse operation)
   * Note: This is not always possible due to multiple names having same initials
   * @param code Reviewer code
   * @returns Extracted initials and number
   */
  static parseCode(code: string): { initials: string; number: number } | null {
    const match = code.match(/^([A-Z]{2,4})-(\d{3})$/);
    if (match) {
      return {
        initials: match[1],
        number: parseInt(match[2])
      };
    }
    return null;
  }
}

// Export utility functions
export const generateReviewerCode = ReviewerCodeGenerator.generateCode.bind(ReviewerCodeGenerator);
export const validateReviewerCode = ReviewerCodeGenerator.validateCode.bind(ReviewerCodeGenerator);
export const parseReviewerCode = ReviewerCodeGenerator.parseCode.bind(ReviewerCodeGenerator);
