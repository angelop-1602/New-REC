import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import firebaseApp from "@/lib/firebaseConfig";
import { 
  Decision as UnifiedDecision,
  getDecision
} from "@/lib/services/unifiedDataService";

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Collection name (refactored to single collection)
const SUBMISSIONS_COLLECTION = "submissions";

// Legacy interfaces for backward compatibility
export interface DecisionDetails {
  decision: 'approved' | 'approved_minor_revisions' | 'major_revisions_deferred' | 'disapproved' | 'deferred';
  decisionDetails: string;
  decisionDate: any; // Firebase Timestamp
  decisionBy: string;
  timeline?: string;
  meetingReference?: string; // Format: sequential-mm-yyyy (e.g., 001-03-2025) for full board only
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  documents?: DecisionDocument[];
}

export interface DecisionDocument {
  fileName: string;
  storagePath: string;
  uploadedAt: any; // Firebase Timestamp
  uploadedBy: string;
  fileSize?: number;
  fileType?: string;
  downloadUrl?: string;
}

export interface DecisionData {
  details: DecisionDetails | null;
  documents: DecisionDocument[];
}

/**
 * Get decision data for a protocol using unified data service
 */
export const getDecisionData = async (
  protocolId: string, 
  collection: 'accepted' | 'approved' = 'accepted'
): Promise<DecisionData> => {
  try {
    // Validate protocolId
    if (!protocolId || typeof protocolId !== 'string' || protocolId.trim() === '') {
      throw new Error('Invalid protocol ID provided');
    }

    // Use single collection for all submissions
    const collectionName = SUBMISSIONS_COLLECTION;
    
    // Use unified data service to get decision
    const unifiedDecision = await getDecision(protocolId.trim(), collectionName as any);
    
    let details: DecisionDetails | null = null;
    let documents: DecisionDocument[] = [];
    
    if (unifiedDecision) {
      // Convert unified decision to legacy format for backward compatibility
      details = {
        decision: unifiedDecision.decisionType,
        decisionDetails: '', // Empty string as per user request
        decisionDate: unifiedDecision.decisionDate,
        decisionBy: unifiedDecision.decisionBy,
        timeline: unifiedDecision.timeline,
        meetingReference: (unifiedDecision as any).meetingReference, // Meeting reference for full board
        createdAt: unifiedDecision.createdAt,
        updatedAt: unifiedDecision.updatedAt,
        documents: unifiedDecision.documents.map(doc => ({
          fileName: doc.fileName,
          storagePath: doc.storagePath,
          uploadedAt: doc.uploadedAt,
          uploadedBy: doc.uploadedBy,
          fileSize: doc.fileSize,
          fileType: doc.fileType,
        })),
      };
      
      // Get documents from unified decision
      if (unifiedDecision.documents && unifiedDecision.documents.length > 0) {
        documents = [...unifiedDecision.documents];
        
        // Get download URLs for each document
        for (const docData of documents) {
          try {
            const storageRef = ref(storage, docData.storagePath);
            const downloadUrl = await getDownloadURL(storageRef);
            docData.downloadUrl = downloadUrl;
          } catch (error) {
            console.warn(`Failed to get download URL for ${docData.fileName}:`, error);
          }
        }
        
        // Sort documents by upload date (newest first)
        documents.sort((a, b) => {
          const dateA = a.uploadedAt?.toDate?.() || new Date(a.uploadedAt);
          const dateB = b.uploadedAt?.toDate?.() || new Date(b.uploadedAt);
          return dateB.getTime() - dateA.getTime();
        });
      }
    }
    
    return {
      details,
      documents
    };
  } catch (error) {
    console.error("Error fetching decision data:", error);
    throw new Error("Failed to fetch decision data");
  }
};

/**
 * Check if a protocol has a decision
 */
export const hasDecision = async (
  protocolId: string, 
  collection: 'accepted' | 'approved' = 'accepted'
): Promise<boolean> => {
  try {
    // Validate protocolId
    if (!protocolId || typeof protocolId !== 'string' || protocolId.trim() === '') {
      return false;
    }

    // Use single collection for all submissions
    const collectionName = SUBMISSIONS_COLLECTION;
    
    const decisionDetailsRef = doc(db, collectionName, protocolId.trim(), 'decision', 'details');
    const decisionDetailsSnap = await getDoc(decisionDetailsRef);
    
    return decisionDetailsSnap.exists();
  } catch (error) {
    console.error("Error checking decision existence:", error);
    return false;
  }
};

/**
 * Get decision status for display
 */
export const getDecisionStatus = (decision: string, isExempted: boolean = false): string => {
  if (isExempted) {
    return 'Exempted from Review';
  }
  switch (decision) {
    case 'approved':
      return 'Approved';
    case 'approved_minor_revisions':
      return 'Minor Modification Required';
    case 'major_revisions_deferred':
      return 'Major Modification Required';
    case 'disapproved':
      return 'Disapproved';
    case 'deferred':
      return 'Deferred';
    default:
      return 'Unknown';
  }
};

/**
 * Get decision color scheme for UI
 */
export const getDecisionColors = (decision: string) => {
  switch (decision) {
    case 'approved':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        badge: 'bg-green-100 text-green-800'
      };
    case 'approved_minor_revisions':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-800'
      };
    case 'major_revisions_deferred':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-800'
      };
    case 'disapproved':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-800'
      };
    case 'deferred':
      return {
        bg: 'bg-cyan-50',
        border: 'border-cyan-200',
        text: 'text-cyan-700',
        badge: 'bg-cyan-100 text-cyan-800'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-800'
      };
  }
};
