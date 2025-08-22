import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';

const db = getFirestore(firebaseApp);

interface SpupCodeConfig {
  year: number;
  sequenceNumber: number;
  type: 'SR' | 'EX'; // SR = Standard Review, EX = Expedited
  initials: string;
}

export const useSpupCodeGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [lastSequenceNumber, setLastSequenceNumber] = useState(0);

  // Get the count of accepted protocols for the current year
  const getAcceptedProtocolsCount = async (year: number): Promise<number> => {
    try {
      setLoading(true);
      
      // Query accepted submissions collection for current year
      const acceptedRef = collection(db, 'submissions_accepted');
      const approvedRef = collection(db, 'submissions_approved');
      const archivedRef = collection(db, 'submissions_archived');
      
      let totalCount = 0;
      
      // Count from all collections that have SPUP codes
      const collections = [acceptedRef, approvedRef, archivedRef];
      
      for (const collectionRef of collections) {
        const snapshot = await getDocs(collectionRef);
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Check if it has a SPUP code and matches the year
          if (data.spupCode && data.spupCode.includes(`SPUP_${year}_`)) {
            // Extract sequence number from SPUP code
            const parts = data.spupCode.split('_');
            if (parts.length >= 3) {
              const seqNum = parseInt(parts[2], 10);
              if (!isNaN(seqNum) && seqNum > totalCount) {
                totalCount = seqNum;
              }
            }
          }
        });
      }
      
      setLastSequenceNumber(totalCount);
      return totalCount;
    } catch (error) {
      console.error('Error getting accepted protocols count:', error);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  // Generate initials from principal investigator name
  const generateInitials = (firstName: string, lastName: string): string => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  // Generate the full SPUP code
  const generateSpupCode = async (
    principalInvestigator: { name: string } | null,
    reviewType: 'SR' | 'EX' = 'SR'
  ): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const count = await getAcceptedProtocolsCount(currentYear);
    const nextNumber = count + 1;
    
    // Parse the PI name to get initials
    let initials = 'XX'; // Default if no name provided
    if (principalInvestigator?.name) {
      const nameParts = principalInvestigator.name.trim().split(' ');
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        initials = generateInitials(firstName, lastName);
      } else if (nameParts.length === 1) {
        // If only one name, use first letter twice
        initials = nameParts[0].charAt(0).toUpperCase() + 'X';
      }
    }
    
    // Format: SPUP_YYYY_0000_SR/EX_XX
    const sequenceStr = String(nextNumber).padStart(5, '0');
    return `SPUP_${currentYear}_${sequenceStr}_${reviewType}_${initials}`;
  };

  // Validate SPUP code format
  const validateSpupCode = (code: string): boolean => {
    const pattern = /^SPUP_\d{4}_\d{5}_(SR|EX)_[A-Z]{2}$/;
    return pattern.test(code);
  };

  // Parse SPUP code into components
  const parseSpupCode = (code: string): SpupCodeConfig | null => {
    if (!validateSpupCode(code)) return null;
    
    const parts = code.split('_');
    return {
      year: parseInt(parts[1], 10),
      sequenceNumber: parseInt(parts[2], 10),
      type: parts[3] as 'SR' | 'EX',
      initials: parts[4]
    };
  };

  // Update SPUP code with new values
  const updateSpupCode = (
    currentCode: string,
    updates: Partial<SpupCodeConfig>
  ): string => {
    const current = parseSpupCode(currentCode);
    if (!current) return currentCode;
    
    const updated = { ...current, ...updates };
    const sequenceStr = String(updated.sequenceNumber).padStart(5, '0');
    return `SPUP_${updated.year}_${sequenceStr}_${updated.type}_${updated.initials}`;
  };

  return {
    generateSpupCode,
    validateSpupCode,
    parseSpupCode,
    updateSpupCode,
    generateInitials,
    getAcceptedProtocolsCount,
    lastSequenceNumber,
    loading
  };
};

// Generate temporary protocol code for pending submissions
export const generateTempProtocolCode = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TEMP_${timestamp}_${random}`;
};
