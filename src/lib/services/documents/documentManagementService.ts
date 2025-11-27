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
  getDoc
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { DocumentsType, DocumentStatus, DocumentRequest } from '@/types';

const db = getFirestore(firebaseApp);
const SUBMISSIONS_COLLECTION = 'submissions';

export class DocumentManagementService {
  
  // ===========================
  // DOCUMENT STATUS MANAGEMENT
  // ===========================
  
  /**
   * Update document status and add chairperson comment
   */
  static async updateDocumentStatus(
    protocolId: string,
    documentId: string,
    status: DocumentStatus,
    chairpersonComment?: string,
    reviewedBy?: string
  ) {
    try {
      // Find the document in the protocol's documents subcollection
      const submissionRef = doc(db, SUBMISSIONS_COLLECTION, protocolId);
      const documentsRef = collection(submissionRef, 'documents');
      const documentRef = doc(documentsRef, documentId);
      
      const updateData: any = {
        status,
        reviewedAt: new Date().toISOString(),
      };
      
      // Only add defined values to avoid Firestore errors
      if (chairpersonComment !== undefined && chairpersonComment !== null) {
        updateData.chairpersonComment = chairpersonComment;
      }
      
      if (reviewedBy !== undefined && reviewedBy !== null) {
        updateData.reviewedBy = reviewedBy;
      }
      
      await updateDoc(documentRef, updateData);
      
      // Update protocol activity
      try {
        const { updateProtocolActivity } = await import("@/lib/services/core/archivingService");
        await updateProtocolActivity(protocolId);
      } catch (activityError) {
        console.warn("Failed to update protocol activity:", activityError);
      }
      
      console.log(`Document ${documentId} status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  }
  
  /**
   * Get all documents for a protocol with their current status
   */
  static async getProtocolDocuments(protocolId: string): Promise<DocumentsType[]> {
    try {
      const submissionRef = doc(db, SUBMISSIONS_COLLECTION, protocolId);
      const documentsRef = collection(submissionRef, 'documents');
      const documentsQuery = query(documentsRef, orderBy('uploadedAt', 'desc'));
      
      const snapshot = await getDocs(documentsQuery);
      const documents: DocumentsType[] = [];
      
      snapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        } as DocumentsType);
      });
      
      return documents;
    } catch (error) {
      console.error('Error fetching protocol documents:', error);
      throw error;
    }
  }
  
  // ===========================
  // DOCUMENT REQUESTS
  // ===========================
  
  /**
   * Create a new document request
   */
  static async createDocumentRequest(
    protocolId: string,
    title: string,
    description: string,
    requestedBy: string,
    urgent = false,
    dueDate?: string
  ): Promise<string> {
    try {
      const requestsRef = collection(db, 'document_requests');
      
      const requestData: Omit<DocumentRequest, 'id'> = {
        title,
        description,
        requestedBy,
        requestedAt: new Date().toISOString(),
        protocolId,
        urgent,
        dueDate,
        status: 'pending'
      };
      
      const docRef = await addDoc(requestsRef, requestData);
      console.log(`Document request created with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating document request:', error);
      throw error;
    }
  }
  
  /**
   * Get all document requests for a protocol
   */
  static async getProtocolDocumentRequests(protocolId: string): Promise<DocumentRequest[]> {
    try {
      const requestsRef = collection(db, 'document_requests');
      const requestsQuery = query(
        requestsRef, 
        where('protocolId', '==', protocolId),
        where('status', '!=', 'cancelled'),
        orderBy('requestedAt', 'desc')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const requests: DocumentRequest[] = [];
      
      snapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        } as DocumentRequest);
      });
      
      return requests;
    } catch (error) {
      console.error('Error fetching document requests:', error);
      throw error;
    }
  }
  
  /**
   * Mark a document request as fulfilled
   */
  static async fulfillDocumentRequest(
    requestId: string,
    fulfilledDocumentId: string
  ) {
    try {
      const requestRef = doc(db, 'document_requests', requestId);
      
      await updateDoc(requestRef, {
        status: 'fulfilled',
        fulfilledAt: new Date().toISOString(),
        fulfilledDocumentId
      });
      
      console.log(`Document request ${requestId} marked as fulfilled`);
      return true;
    } catch (error) {
      console.error('Error fulfilling document request:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a document request
   */
  static async cancelDocumentRequest(requestId: string) {
    try {
      const requestRef = doc(db, 'document_requests', requestId);
      
      await updateDoc(requestRef, {
        status: 'cancelled'
      });
      
      console.log(`Document request ${requestId} cancelled`);
      return true;
    } catch (error) {
      console.error('Error cancelling document request:', error);
      throw error;
    }
  }
  
  // ===========================
  // DOCUMENT REPLACEMENT/EDITING
  // ===========================
  
  /**
   * Replace a document with a new version (for proponent editing)
   */
  static async replaceDocument(
    protocolId: string,
    documentId: string,
    newDocumentData: Partial<DocumentsType>
  ) {
    try {
      const submissionRef = doc(db, SUBMISSIONS_COLLECTION, protocolId);
      const documentsRef = collection(submissionRef, 'documents');
      const documentRef = doc(documentsRef, documentId);
      
      // Get current document to increment version
      const currentDoc = await getDoc(documentRef);
      const currentData = currentDoc.data() as DocumentsType;
      
      const updateData: any = {
        ...newDocumentData,
        version: (currentData.version || 1) + 1,
        uploadedAt: new Date().toISOString(),
        status: 'pending' // Reset status when document is replaced
      };
      
      // Only clear fields if they exist, don't set undefined values
      if (currentData.chairpersonComment !== undefined) {
        updateData.chairpersonComment = null; // Use null instead of undefined
      }
      if (currentData.reviewedBy !== undefined) {
        updateData.reviewedBy = null; // Use null instead of undefined
      }
      if (currentData.reviewedAt !== undefined) {
        updateData.reviewedAt = null; // Use null instead of undefined
      }
      
      await updateDoc(documentRef, updateData);
      
      console.log(`Document ${documentId} replaced with new version`);
      return true;
    } catch (error) {
      console.error('Error replacing document:', error);
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
        pending: documents.filter(d => d.status === 'pending' || !d.status).length,
        accepted: documents.filter(d => d.status === 'accepted').length,
        revise: documents.filter(d => d.status === 'revise').length
      };
      
      return summary;
    } catch (error) {
      console.error('Error getting document status summary:', error);
      throw error;
    }
  }
  
  /**
   * Check if all documents are ready for review
   */
  static async areAllDocumentsReady(protocolId: string): Promise<boolean> {
    try {
      const documents = await this.getProtocolDocuments(protocolId);
      
      // All documents should be in 'accepted' status
      return documents.every(doc => doc.status === 'accepted');
    } catch (error) {
      console.error('Error checking document readiness:', error);
      return false;
    }
  }
}

// Export for easier importing
export const documentManagementService = DocumentManagementService;
