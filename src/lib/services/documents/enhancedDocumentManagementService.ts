import { 
  doc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  getDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { 
  DocumentStatus, 
  DocumentCategory, 
  EnhancedDocument, 
  DocumentRequest as EnhancedDocumentRequest 
} from '@/types';
import { DocumentVersion } from '@/types/documents.types';

const db = getFirestore(firebaseApp);

export class EnhancedDocumentManagementService {
  
  // ===========================
  // DOCUMENT REQUEST MANAGEMENT
  // ===========================
  
  /**
   * Create a document request by adding a placeholder document with status "requested"
   */
  static async createDocumentRequest(
    protocolId: string,
    title: string,
    description: string,
    requestedBy: string,
    category: DocumentCategory,
    isRequired: boolean,
    urgent = false,
    dueDate?: string,
    multiple?: boolean,
    templateUrl?: string
  ): Promise<string> {
    try {
      const protocolRef = doc(db, 'submissions', protocolId);
      const documentsRef = collection(protocolRef, 'documents');
      
      const now = new Date().toISOString();
      
      // Generate document ID using the same format as initial submissions
      // Format: {sanitized_title}_{timestamp}_{randomString}
      const sanitizedTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim();
      const documentId = `${sanitizedTitle}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a placeholder document with status "requested"
      const documentData: any = {
        id: documentId, // Add the id field for consistency
        title,
        description,
        category,
        currentVersion: 0, // 0 indicates no actual file uploaded yet
        currentStatus: 'requested',
        uploadedBy: requestedBy,
        createdAt: now,
        updatedAt: now,
        versions: [], // Empty versions array for requested documents
        isRequired,
        // Store request metadata
        requestMetadata: {
          urgent,
          dueDate: dueDate || null,
          requestedAt: now,
          requestedBy
        }
      };
      
      // Only add optional fields if they have values
      if (multiple !== undefined) {
        documentData.multiple = multiple;
      }
      if (templateUrl) {
        documentData.templateUrl = templateUrl;
      }
      
      // Use setDoc with custom ID instead of addDoc
      const docRef = doc(documentsRef, documentId);
      await setDoc(docRef, documentData);
      return documentId;
    } catch (error) {
      console.error('Error creating document request:', error);
      throw error;
    }
  }
  
  /**
   * Get all document requests for a protocol (documents with status "requested")
   */
  static async getProtocolDocumentRequests(protocolId: string): Promise<EnhancedDocument[]> {
    try {
      const protocolRef = doc(db, 'submissions', protocolId);
      const documentsRef = collection(protocolRef, 'documents');
      
      // Simple query without orderBy to avoid needing composite index
      const requestsQuery = query(
        documentsRef, 
        where('currentStatus', '==', 'requested')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const requests: EnhancedDocument[] = [];
      
      snapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        } as EnhancedDocument);
      });
      
      // Sort in memory instead of in query to avoid index requirement
      requests.sort((a, b) => {
        const dateA = new Date((a as { createdAt?: string }).createdAt || 0).getTime();
        const dateB = new Date((b as { createdAt?: string }).createdAt || 0).getTime();
        return dateB - dateA; // desc order
      });
      
      return requests;
    } catch (error) {
      console.error('Error fetching document requests:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a document request (delete the requested document placeholder)
   */
  static async cancelDocumentRequest(
    protocolId: string,
    documentId: string
  ): Promise<boolean> {
    try {
      const protocolRef = doc(db, 'submissions', protocolId);
      const documentsRef = collection(protocolRef, 'documents');
      const documentRef = doc(documentsRef, documentId);
      
      // Verify it's a requested document before deleting
      const docSnap = await getDoc(documentRef);
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const docData = docSnap.data();
      if (docData.currentStatus !== 'requested') {
        throw new Error('Can only cancel requested documents');
      }
      
      await deleteDoc(documentRef);
      return true;
    } catch (error) {
      console.error('Error cancelling document request:', error);
      throw error;
    }
  }
  
  // ===========================
  // DOCUMENT MANAGEMENT
  // ===========================
  
  /**
   * Create a new document in the protocol's documents subcollection
   * If a document request exists, it will be fulfilled
   */
  static async createDocument(
    protocolId: string,
    documentData: {
      title: string;
      description: string;
      category: DocumentCategory;
      uploadedBy: string;
      fileType: string;
      storagePath: string;
      downloadUrl: string;
      originalFileName?: string;
      fileSize?: number;
      requestId?: string;
      isRequired: boolean;
      multiple?: boolean;
      templateUrl?: string;
    }
  ): Promise<string> {
    try {
      const protocolRef = doc(db, 'submissions', protocolId);
      const documentsRef = collection(protocolRef, 'documents');
      
      const now = new Date().toISOString();
      
      // Check if this is fulfilling an existing request
      let existingDocumentId: string | null = null;
      if (documentData.requestId) {
        // Check if document with this ID exists
        const docRef = doc(documentsRef, documentData.requestId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          existingDocumentId = documentData.requestId;
        } else {
          // Document doesn't exist, but we'll use this ID for new document
          existingDocumentId = documentData.requestId;
        }
      } else {
        // Check if there's an existing document request with the same title
        const requestsQuery = query(
          documentsRef,
          where('title', '==', documentData.title),
          where('currentStatus', '==', 'requested')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        if (!requestsSnapshot.empty) {
          const existingDoc = requestsSnapshot.docs[0];
          existingDocumentId = existingDoc.id;
        }
      }
      
      if (existingDocumentId) {
        // Update existing document request with actual file
        const documentRef = doc(documentsRef, existingDocumentId);
        const currentDoc = await getDoc(documentRef);
        const currentData = currentDoc.data() as EnhancedDocument;
        
        // Create first version (version 1)
        // storagePath should already include version number from upload function
        const firstVersion: DocumentVersion = {
          version: 1,
          uploadedAt: now,
          uploadedBy: documentData.uploadedBy,
          status: 'pending',
          fileType: documentData.fileType,
          storagePath: documentData.storagePath, // Should be: documents/{documentId}/v1/{fileName}
          downloadUrl: documentData.downloadUrl,
          originalFileName: documentData.originalFileName,
          fileSize: documentData.fileSize
        };
        
        const updateData = {
          currentVersion: 1,
          currentStatus: 'pending',
          updatedAt: now,
          versions: [firstVersion],
          uploadedBy: documentData.uploadedBy
        };
        
        await updateDoc(documentRef, updateData);
        return existingDocumentId;
      } else {
        // Create new document - generate ID first for versioned path
        // Generate document ID using the same format
        const sanitizedTitle = documentData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .trim();
        const newDocumentId = `${sanitizedTitle}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create first version (version 1) with versioned storage path
        const firstVersion: DocumentVersion = {
          version: 1,
          uploadedAt: now,
          uploadedBy: documentData.uploadedBy,
          status: 'pending',
          fileType: documentData.fileType,
          storagePath: documentData.storagePath, // Should be: documents/{documentId}/v1/{fileName}
          downloadUrl: documentData.downloadUrl,
          originalFileName: documentData.originalFileName,
          fileSize: documentData.fileSize
        };
        
        const enhancedDocument = {
          id: newDocumentId, // Include ID in document data
          title: documentData.title,
          description: documentData.description,
          category: documentData.category,
          currentVersion: 1,
          currentStatus: 'pending',
          uploadedBy: documentData.uploadedBy,
          createdAt: now,
          updatedAt: now,
          versions: [firstVersion],
          isRequired: documentData.isRequired,
          // Only include fields that are not undefined
          ...(documentData.multiple !== undefined && { multiple: documentData.multiple }),
          ...(documentData.templateUrl && { templateUrl: documentData.templateUrl })
        };
        
        // Use setDoc with custom ID (from requestId if provided, or generated ID)
        const finalDocumentId = existingDocumentId || newDocumentId;
        const docRef = doc(documentsRef, finalDocumentId);
        await setDoc(docRef, {
          ...enhancedDocument,
          id: finalDocumentId // Ensure ID matches
        });
        
        // Update protocol activity
        try {
          const { updateProtocolActivity } = await import("@/lib/services/core/archivingService");
          await updateProtocolActivity(protocolId);
        } catch (activityError) {
          console.warn("Failed to update protocol activity:", activityError);
        }
        
        return finalDocumentId;
      }
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }
  
  /**
   * Get a single document by ID
   */
  static async getDocument(protocolId: string, documentId: string): Promise<EnhancedDocument | null> {
    try {
      const protocolRef = doc(db, 'submissions', protocolId);
      const documentsRef = collection(protocolRef, 'documents');
      const documentRef = doc(documentsRef, documentId);
      
      const docSnap = await getDoc(documentRef);
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as EnhancedDocument;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  /**
   * Get all documents for a protocol
   */
  static async getProtocolDocuments(protocolId: string): Promise<EnhancedDocument[]> {
    try {
      const protocolRef = doc(db, 'submissions', protocolId);
      const documentsRef = collection(protocolRef, 'documents');
      const documentsQuery = query(documentsRef, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(documentsQuery);
      const documents: EnhancedDocument[] = [];
      
      snapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        } as EnhancedDocument);
      });
      
      return documents;
    } catch (error) {
      console.error('Error fetching protocol documents:', error);
      throw error;
    }
  }
  
  /**
   * Update document status and add chairperson comment
   */
  static async updateDocumentStatus(
    protocolId: string,
    documentId: string,
    status: DocumentStatus,
    chairpersonComment?: string,
    reviewedBy?: string
  ): Promise<boolean> {
    try {
      const protocolRef = doc(db, 'submissions', protocolId);
      const documentsRef = collection(protocolRef, 'documents');
      const documentRef = doc(documentsRef, documentId);
      
      // Get current document
      const currentDoc = await getDoc(documentRef);
      const currentData = currentDoc.data() as EnhancedDocument;
      
      if (!currentData) {
        throw new Error('Document not found');
      }
      
      const now = new Date().toISOString();
      
      // Update current version status (only if versions exist)
      let updatedVersions = (currentData as { versions?: DocumentVersion[] }).versions || [];
      
      if (updatedVersions.length > 0) {
        updatedVersions = updatedVersions.map(version => {
          if (version.version === currentData.currentVersion) {
            const updatedVersion: any = {
              ...version,
              status,
              reviewedAt: now
            };
            
            // Only add defined values to avoid Firestore errors
            if (chairpersonComment !== undefined) {
              updatedVersion.chairpersonComment = chairpersonComment;
            }
            if (reviewedBy !== undefined) {
              updatedVersion.reviewedBy = reviewedBy;
            }
            
            return updatedVersion;
          }
          return version;
        });
      }
      
      const updateData: any = {
        currentStatus: status,
        updatedAt: now
      };
      
      // Only update versions if they exist
      if (updatedVersions.length > 0) {
        updateData.versions = updatedVersions;
      }
      
      // Add comment and reviewer for requested documents being updated
      if (chairpersonComment !== undefined) {
        updateData.chairpersonComment = chairpersonComment;
      }
      if (reviewedBy !== undefined) {
        updateData.reviewedBy = reviewedBy;
      }
      
      await updateDoc(documentRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  }
  
  /**
   * Add a new version to an existing document
   * This preserves all previous versions in storage
   */
  static async addDocumentVersion(
    protocolId: string,
    documentId: string,
    versionData: {
      uploadedBy: string;
      fileType: string;
      storagePath: string;
      downloadUrl: string;
      originalFileName?: string;
      fileSize?: number;
    }
  ): Promise<boolean> {
    try {
      const protocolRef = doc(db, 'submissions', protocolId);
      const documentsRef = collection(protocolRef, 'documents');
      const documentRef = doc(documentsRef, documentId);
      
      // Get current document
      const currentDoc = await getDoc(documentRef);
      const currentData = currentDoc.data() as EnhancedDocument;
      
      if (!currentData) {
        throw new Error('Document not found');
      }
      
      const now = new Date().toISOString();
      const newVersionNumber = currentData.currentVersion + 1;
      const currentDataWithVersions = currentData as EnhancedDocument & { versions?: DocumentVersion[] };
      
      // Note: storagePath should already include version number from the upload function
      // This ensures each version is stored in a separate path and preserved
      
      // Create new version
      const newVersion: DocumentVersion = {
        version: newVersionNumber,
        uploadedAt: now,
        uploadedBy: versionData.uploadedBy,
        status: 'pending',
        fileType: versionData.fileType,
        storagePath: versionData.storagePath, // This path should include version number
        downloadUrl: versionData.downloadUrl,
        originalFileName: versionData.originalFileName,
        fileSize: versionData.fileSize
      };
      
      // Update document with new version (preserving all previous versions)
      const updateData = {
        currentVersion: newVersionNumber,
        currentStatus: 'pending',
        updatedAt: now,
        versions: [...(currentDataWithVersions.versions || []), newVersion] // All versions preserved in array
      };
      
      await updateDoc(documentRef, updateData);
      
      // Update protocol activity
      try {
        const { updateProtocolActivity } = await import("@/lib/services/core/archivingService");
        await updateProtocolActivity(protocolId);
      } catch (activityError) {
        console.warn("Failed to update protocol activity:", activityError);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding document version:', error);
      throw error;
    }
  }
  
  
  // ===========================
  // UTILITY METHODS
  // ===========================
  
  /**
   * Get document status summary for a protocol
   */
  static async getDocumentStatusSummary(protocolId: string) {
    try {
      const documents = await this.getProtocolDocuments(protocolId);
      
      const summary = {
        total: documents.length,
        pending: documents.filter(d => d.currentStatus === 'pending').length,
        accepted: documents.filter(d => d.currentStatus === 'accepted').length,
        rejected: documents.filter(d => d.currentStatus === 'rejected').length,
        requested: documents.filter(d => d.currentStatus === 'requested').length,
        rework: documents.filter(d => d.currentStatus === 'rework').length,
        revise: documents.filter(d => d.currentStatus === 'revise').length
      };
      
      return summary;
    } catch (error) {
      console.error('Error getting document status summary:', error);
      throw error;
    }
  }
  
  /**
   * Check if all required documents are ready for review
   */
  static async areAllRequiredDocumentsReady(protocolId: string): Promise<boolean> {
    try {
      const documents = await this.getProtocolDocuments(protocolId);
      const requiredDocuments = documents.filter(doc => (doc as EnhancedDocument & { isRequired?: boolean }).isRequired);
      
      // All required documents should be in 'accepted' status
      return requiredDocuments.every(doc => doc.currentStatus === 'accepted');
    } catch (error) {
      console.error('Error checking document readiness:', error);
      return false;
    }
  }
  
  /**
   * Get missing required documents for a protocol
   */
  static async getMissingRequiredDocuments(protocolId: string): Promise<string[]> {
    try {
      const documents = await this.getProtocolDocuments(protocolId);
      const submittedDocIds = documents.map(doc => doc.id);
      
      // Define all required document IDs
      const requiredDocIds = [
        'informed_consent',
        'endorsement_letter', 
        'research_proposal',
        'minutes_proposal_defense',
        'curriculum_vitae',
        'abstract',
        'questionnaire',
        'data_collection_forms',
        'technical_review',
        'payment_proof'
      ];
      
      // Return IDs that are not in the submitted documents
      return requiredDocIds.filter(id => !submittedDocIds.includes(id));
    } catch (error) {
      console.error('Error getting missing required documents:', error);
      throw error;
    }
  }
}

// Export for easier importing
export const enhancedDocumentManagementService = EnhancedDocumentManagementService;
