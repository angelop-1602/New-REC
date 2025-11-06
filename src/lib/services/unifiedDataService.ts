// Unified Data Access Service
// Single source of truth for all data operations with automatic transformation

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  getFirestore
} from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';

const db = getFirestore(firebaseApp);
import { 
  Protocol, 
  Assessment, 
  Reviewer, 
  Decision,
  ProtocolInput,
  AssessmentInput,
  ReviewerInput,
  DecisionInput,
  isProtocol,
  isAssessment,
  isReviewer,
  isDecision
} from '@/types/unified.types';
import { 
  transformToUnifiedProtocol,
  transformToUnifiedAssessment,
  transformToUnifiedReviewer,
  transformToUnifiedDecision,
  transformFromUnifiedProtocol,
  validateProtocol,
  validateAssessment,
  validateReviewer,
  validateDecision,
  updateTimestamp
} from '@/lib/utils/dataTransformation';

// ============================================================================
// COLLECTION NAMES
// ============================================================================

const COLLECTIONS = {
  PROTOCOLS: 'submissions', // Unified collection for all protocol statuses
  REVIEWERS: 'reviewers',
  ASSESSMENTS: 'assessment_forms',
  DECISIONS: 'decision',
} as const;

// ============================================================================
// PROTOCOL SERVICE
// ============================================================================

export class UnifiedProtocolService {
  /**
   * Get protocol by ID with automatic transformation
   */
  static async getProtocol(protocolId: string, collectionName: keyof typeof COLLECTIONS = 'PROTOCOLS'): Promise<Protocol | null> {
    try {
      const docRef = doc(db, COLLECTIONS[collectionName], protocolId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return transformToUnifiedProtocol({ id: protocolId, ...data });
    } catch (error) {
      console.error('Error fetching protocol:', error);
      throw new Error(`Failed to fetch protocol: ${error.message}`);
    }
  }

  /**
   * Get all protocols with automatic transformation
   */
  static async getAllProtocols(collectionName: keyof typeof COLLECTIONS = 'PROTOCOLS'): Promise<Protocol[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS[collectionName]));
      const protocols: Protocol[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const protocol = transformToUnifiedProtocol({ id: doc.id, ...data });
        protocols.push(protocol);
      });
      
      return protocols;
    } catch (error) {
      console.error('Error fetching protocols:', error);
      throw new Error(`Failed to fetch protocols: ${error.message}`);
    }
  }

  /**
   * Create new protocol with unified structure
   */
  static async createProtocol(protocolInput: ProtocolInput, collectionName: keyof typeof COLLECTIONS = 'PROTOCOLS_SUBMITTED'): Promise<Protocol> {
    try {
      const now = Timestamp.now();
      const protocol: Protocol = {
        ...protocolInput,
        createdAt: now,
        updatedAt: now,
      };
      
      // Validate protocol
      const validation = validateProtocol(protocol);
      if (!validation.isValid) {
        throw new Error(`Protocol validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Convert to old format for storage
      const oldFormat = transformFromUnifiedProtocol(protocol);
      
      // Save to Firebase
      const docRef = doc(collection(db, COLLECTIONS[collectionName]));
      await setDoc(docRef, oldFormat);
      
      return { ...protocol, id: docRef.id };
    } catch (error) {
      console.error('Error creating protocol:', error);
      throw new Error(`Failed to create protocol: ${error.message}`);
    }
  }

  /**
   * Update protocol with unified structure
   */
  static async updateProtocol(protocolId: string, updates: Partial<Protocol>, collectionName: keyof typeof COLLECTIONS = 'PROTOCOLS_ACCEPTED'): Promise<Protocol> {
    try {
      // Get existing protocol
      const existingProtocol = await this.getProtocol(protocolId, collectionName);
      if (!existingProtocol) {
        throw new Error(`Protocol ${protocolId} not found`);
      }
      
      // Merge updates
      const updatedProtocol = updateTimestamp({
        ...existingProtocol,
        ...updates,
      });
      
      // Validate updated protocol
      const validation = validateProtocol(updatedProtocol);
      if (!validation.isValid) {
        throw new Error(`Protocol validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Convert to old format for storage
      const oldFormat = transformFromUnifiedProtocol(updatedProtocol);
      
      // Update in Firebase
      const docRef = doc(db, COLLECTIONS[collectionName], protocolId);
      await updateDoc(docRef, oldFormat);
      
      return updatedProtocol;
    } catch (error) {
      console.error('Error updating protocol:', error);
      throw new Error(`Failed to update protocol: ${error.message}`);
    }
  }

  /**
   * Delete protocol
   */
  static async deleteProtocol(protocolId: string, collectionName: keyof typeof COLLECTIONS = 'PROTOCOLS_ACCEPTED'): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS[collectionName], protocolId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting protocol:', error);
      throw new Error(`Failed to delete protocol: ${error.message}`);
    }
  }

  /**
   * Move protocol between collections (e.g., accepted to approved)
   */
  static async moveProtocol(protocolId: string, fromCollection: keyof typeof COLLECTIONS, toCollection: keyof typeof COLLECTIONS): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Get protocol from source collection
      const protocol = await this.getProtocol(protocolId, fromCollection);
      if (!protocol) {
        throw new Error(`Protocol ${protocolId} not found in ${fromCollection}`);
      }
      
      // Convert to old format for storage
      const oldFormat = transformFromUnifiedProtocol(protocol);
      
      // Add to destination collection
      const toDocRef = doc(db, COLLECTIONS[toCollection], protocolId);
      batch.set(toDocRef, oldFormat);
      
      // Delete from source collection
      const fromDocRef = doc(db, COLLECTIONS[fromCollection], protocolId);
      batch.delete(fromDocRef);
      
      await batch.commit();
    } catch (error) {
      console.error('Error moving protocol:', error);
      throw new Error(`Failed to move protocol: ${error.message}`);
    }
  }
}

// ============================================================================
// ASSESSMENT SERVICE
// ============================================================================

export class UnifiedAssessmentService {
  /**
   * Get assessment by ID with automatic transformation
   */
  static async getAssessment(protocolId: string, formType: string): Promise<Assessment | null> {
    try {
      const docRef = doc(db, COLLECTIONS.PROTOCOLS_ACCEPTED, protocolId, COLLECTIONS.ASSESSMENTS, formType);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return transformToUnifiedAssessment({ id: formType, protocolId, ...data });
    } catch (error) {
      console.error('Error fetching assessment:', error);
      throw new Error(`Failed to fetch assessment: ${error.message}`);
    }
  }

  /**
   * Get all assessments for a protocol
   */
  static async getProtocolAssessments(protocolId: string): Promise<Assessment[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.PROTOCOLS_ACCEPTED, protocolId, COLLECTIONS.ASSESSMENTS));
      const assessments: Assessment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const assessment = transformToUnifiedAssessment({ id: doc.id, protocolId, ...data });
        assessments.push(assessment);
      });
      
      return assessments;
    } catch (error) {
      console.error('Error fetching assessments:', error);
      throw new Error(`Failed to fetch assessments: ${error.message}`);
    }
  }

  /**
   * Create or update assessment with unified structure
   */
  static async saveAssessment(assessmentInput: AssessmentInput, protocolId: string, formType: string): Promise<Assessment> {
    try {
      const now = Timestamp.now();
      const assessment: Assessment = {
        ...assessmentInput,
        protocolId,
        id: formType,
        createdAt: now,
        updatedAt: now,
      };
      
      // Validate assessment
      const validation = validateAssessment(assessment);
      if (!validation.isValid) {
        throw new Error(`Assessment validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Save to Firebase (keep old format for now)
      const docRef = doc(db, COLLECTIONS.PROTOCOLS_ACCEPTED, protocolId, COLLECTIONS.ASSESSMENTS, formType);
      await setDoc(docRef, assessment);
      
      return assessment;
    } catch (error) {
      console.error('Error saving assessment:', error);
      throw new Error(`Failed to save assessment: ${error.message}`);
    }
  }

  /**
   * Delete assessment
   */
  static async deleteAssessment(protocolId: string, formType: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.PROTOCOLS_ACCEPTED, protocolId, COLLECTIONS.ASSESSMENTS, formType);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting assessment:', error);
      throw new Error(`Failed to delete assessment: ${error.message}`);
    }
  }
}

// ============================================================================
// REVIEWER SERVICE
// ============================================================================

export class UnifiedReviewerService {
  /**
   * Get reviewer by ID with automatic transformation
   */
  static async getReviewer(reviewerId: string): Promise<Reviewer | null> {
    try {
      const docRef = doc(db, COLLECTIONS.REVIEWERS, reviewerId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return transformToUnifiedReviewer({ id: reviewerId, ...data });
    } catch (error) {
      console.error('Error fetching reviewer:', error);
      throw new Error(`Failed to fetch reviewer: ${error.message}`);
    }
  }

  /**
   * Get all reviewers with automatic transformation
   */
  static async getAllReviewers(): Promise<Reviewer[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.REVIEWERS));
      const reviewers: Reviewer[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const reviewer = transformToUnifiedReviewer({ id: doc.id, ...data });
        reviewers.push(reviewer);
      });
      
      return reviewers;
    } catch (error) {
      console.error('Error fetching reviewers:', error);
      throw new Error(`Failed to fetch reviewers: ${error.message}`);
    }
  }

  /**
   * Get active reviewers only
   */
  static async getActiveReviewers(): Promise<Reviewer[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.REVIEWERS),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const reviewers: Reviewer[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const reviewer = transformToUnifiedReviewer({ id: doc.id, ...data });
        reviewers.push(reviewer);
      });
      
      return reviewers;
    } catch (error) {
      console.error('Error fetching active reviewers:', error);
      throw new Error(`Failed to fetch active reviewers: ${error.message}`);
    }
  }

  /**
   * Create new reviewer with unified structure
   */
  static async createReviewer(reviewerInput: ReviewerInput): Promise<Reviewer> {
    try {
      const now = Timestamp.now();
      const reviewer: Reviewer = {
        ...reviewerInput,
        createdAt: now,
        updatedAt: now,
      };
      
      // Validate reviewer
      const validation = validateReviewer(reviewer);
      if (!validation.isValid) {
        throw new Error(`Reviewer validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Save to Firebase
      const docRef = doc(collection(db, COLLECTIONS.REVIEWERS));
      await setDoc(docRef, reviewer);
      
      return { ...reviewer, id: docRef.id };
    } catch (error) {
      console.error('Error creating reviewer:', error);
      throw new Error(`Failed to create reviewer: ${error.message}`);
    }
  }

  /**
   * Update reviewer with unified structure
   */
  static async updateReviewer(reviewerId: string, updates: Partial<Reviewer>): Promise<Reviewer> {
    try {
      // Get existing reviewer
      const existingReviewer = await this.getReviewer(reviewerId);
      if (!existingReviewer) {
        throw new Error(`Reviewer ${reviewerId} not found`);
      }
      
      // Merge updates
      const updatedReviewer = updateTimestamp({
        ...existingReviewer,
        ...updates,
      });
      
      // Validate updated reviewer
      const validation = validateReviewer(updatedReviewer);
      if (!validation.isValid) {
        throw new Error(`Reviewer validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Update in Firebase
      const docRef = doc(db, COLLECTIONS.REVIEWERS, reviewerId);
      await updateDoc(docRef, updatedReviewer);
      
      return updatedReviewer;
    } catch (error) {
      console.error('Error updating reviewer:', error);
      throw new Error(`Failed to update reviewer: ${error.message}`);
    }
  }

  /**
   * Delete reviewer
   */
  static async deleteReviewer(reviewerId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.REVIEWERS, reviewerId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting reviewer:', error);
      throw new Error(`Failed to delete reviewer: ${error.message}`);
    }
  }
}

// ============================================================================
// DECISION SERVICE
// ============================================================================

export class UnifiedDecisionService {
  /**
   * Get decision by protocol ID with automatic transformation
   */
  static async getDecision(protocolId: string, collectionName: keyof typeof COLLECTIONS | string = 'PROTOCOLS_ACCEPTED'): Promise<Decision | null> {
    try {
      // Validate protocolId
      if (!protocolId || typeof protocolId !== 'string' || protocolId.trim() === '') {
        throw new Error('Invalid protocol ID: protocolId cannot be empty');
      }

      // If collectionName is a key of COLLECTIONS, use it. Otherwise, use it directly as the collection name
      const actualCollectionName = (collectionName in COLLECTIONS) 
        ? COLLECTIONS[collectionName as keyof typeof COLLECTIONS] 
        : collectionName;
      
      const docRef = doc(db, actualCollectionName, protocolId, COLLECTIONS.DECISIONS, 'details');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return transformToUnifiedDecision({ id: 'details', protocolId, ...data });
    } catch (error) {
      console.error('Error fetching decision:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch decision: ${errorMessage}`);
    }
  }

  /**
   * Create or update decision with unified structure
   */
  static async saveDecision(decisionInput: DecisionInput, protocolId: string, collectionName: keyof typeof COLLECTIONS = 'PROTOCOLS_ACCEPTED'): Promise<Decision> {
    try {
      const now = Timestamp.now();
      const decision: Decision = {
        ...decisionInput,
        protocolId,
        id: 'details',
        createdAt: now,
        updatedAt: now,
      };
      
      // Validate decision
      const validation = validateDecision(decision);
      if (!validation.isValid) {
        throw new Error(`Decision validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Save to Firebase
      const docRef = doc(db, COLLECTIONS[collectionName], protocolId, COLLECTIONS.DECISIONS, 'details');
      await setDoc(docRef, decision);
      
      return decision;
    } catch (error) {
      console.error('Error saving decision:', error);
      throw new Error(`Failed to save decision: ${error.message}`);
    }
  }

  /**
   * Delete decision
   */
  static async deleteDecision(protocolId: string, collectionName: keyof typeof COLLECTIONS = 'PROTOCOLS_ACCEPTED'): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS[collectionName], protocolId, COLLECTIONS.DECISIONS, 'details');
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting decision:', error);
      throw new Error(`Failed to delete decision: ${error.message}`);
    }
  }
}

// ============================================================================
// EXPORT CONVENIENCE FUNCTIONS
// ============================================================================

// Protocol functions
export const getProtocol = UnifiedProtocolService.getProtocol;
export const getAllProtocols = UnifiedProtocolService.getAllProtocols;
export const createProtocol = UnifiedProtocolService.createProtocol;
export const updateProtocol = UnifiedProtocolService.updateProtocol;
export const deleteProtocol = UnifiedProtocolService.deleteProtocol;
export const moveProtocol = UnifiedProtocolService.moveProtocol;

// Assessment functions
export const getAssessment = UnifiedAssessmentService.getAssessment;
export const getProtocolAssessments = UnifiedAssessmentService.getProtocolAssessments;
export const saveAssessment = UnifiedAssessmentService.saveAssessment;
export const deleteAssessment = UnifiedAssessmentService.deleteAssessment;

// Reviewer functions
export const getReviewer = UnifiedReviewerService.getReviewer;
export const getAllReviewers = UnifiedReviewerService.getAllReviewers;
export const getActiveReviewers = UnifiedReviewerService.getActiveReviewers;
export const createReviewer = UnifiedReviewerService.createReviewer;
export const updateReviewer = UnifiedReviewerService.updateReviewer;
export const deleteReviewer = UnifiedReviewerService.deleteReviewer;

// Decision functions
export const getDecision = UnifiedDecisionService.getDecision;
export const saveDecision = UnifiedDecisionService.saveDecision;
export const deleteDecision = UnifiedDecisionService.deleteDecision;
