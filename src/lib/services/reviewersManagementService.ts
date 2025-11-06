import firebaseApp from '@/lib/firebaseConfig';
import { getFirestore } from 'firebase/firestore';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { generateReviewerCode } from './reviewerCodeGenerator';

const db = getFirestore(firebaseApp);
const REVIEWERS_COLLECTION = 'reviewers';

export interface Reviewer {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateReviewerRequest {
  name: string;
}

export interface UpdateReviewerRequest {
  name?: string;
  isActive?: boolean;
}

class ReviewersManagementService {
  /**
   * Get all reviewers
   */
  async getAllReviewers(): Promise<Reviewer[]> {
    try {
      const reviewersRef = collection(db, REVIEWERS_COLLECTION);
      const q = query(reviewersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reviewer));
    } catch (error) {
      console.error('Error fetching reviewers:', error);
      return [];
    }
  }

  /**
   * Get active reviewers only
   */
  async getActiveReviewers(): Promise<Reviewer[]> {
    try {
      const reviewersRef = collection(db, REVIEWERS_COLLECTION);
      const q = query(
        reviewersRef, 
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reviewer));
    } catch (error) {
      console.error('Error fetching active reviewers:', error);
      return [];
    }
  }

  /**
   * Get reviewer by ID
   */
  async getReviewerById(id: string): Promise<Reviewer | null> {
    try {
      const reviewerRef = doc(db, REVIEWERS_COLLECTION, id);
      const reviewerSnap = await getDoc(reviewerRef);
      
      if (reviewerSnap.exists()) {
        return {
          id: reviewerSnap.id,
          ...reviewerSnap.data()
        } as Reviewer;
      }
      return null;
    } catch (error) {
      console.error('Error fetching reviewer:', error);
      return null;
    }
  }

  /**
   * Create a new reviewer
   */
  async createReviewer(reviewerData: CreateReviewerRequest): Promise<string | null> {
    try {
      // Generate unique code
      const code = await generateReviewerCode(reviewerData.name);
      
      const reviewerRef = doc(collection(db, REVIEWERS_COLLECTION));
      const reviewer: Omit<Reviewer, 'id'> = {
        code,
        name: reviewerData.name,
        isActive: true,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(reviewerRef, reviewer);
      return reviewerRef.id;
    } catch (error) {
      console.error('Error creating reviewer:', error);
      return null;
    }
  }

  /**
   * Update reviewer
   */
  async updateReviewer(reviewerId: string, updates: UpdateReviewerRequest): Promise<boolean> {
    try {
      const reviewerRef = doc(db, REVIEWERS_COLLECTION, reviewerId);
      
      // If name is being updated, regenerate the code
      let updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      if (updates.name) {
        const newCode = await generateReviewerCode(updates.name);
        updateData.code = newCode;
      }
      
      await updateDoc(reviewerRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating reviewer:', error);
      return false;
    }
  }

  /**
   * Toggle reviewer active status
   */
  async toggleReviewerStatus(reviewerId: string): Promise<boolean> {
    try {
      const reviewer = await this.getReviewerById(reviewerId);
      if (!reviewer) return false;
      
      return await this.updateReviewer(reviewerId, {
        isActive: !reviewer.isActive
      });
    } catch (error) {
      console.error('Error toggling reviewer status:', error);
      return false;
    }
  }

  /**
   * Delete reviewer (soft delete by setting isActive to false)
   */
  async deleteReviewer(reviewerId: string): Promise<boolean> {
    try {
      return await this.updateReviewer(reviewerId, {
        isActive: false
      });
    } catch (error) {
      console.error('Error deleting reviewer:', error);
      return false;
    }
  }

  /**
   * Get reviewer statistics
   */
  async getReviewerStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const allReviewers = await this.getAllReviewers();
      const active = allReviewers.filter(r => r.isActive).length;
      const inactive = allReviewers.length - active;
      
      return {
        total: allReviewers.length,
        active,
        inactive
      };
    } catch (error) {
      console.error('Error getting reviewer stats:', error);
      return { total: 0, active: 0, inactive: 0 };
    }
  }
}

// Export singleton instance
export const reviewersManagementService = new ReviewersManagementService();

// Export utility functions
export const getAllReviewers = reviewersManagementService.getAllReviewers.bind(reviewersManagementService);
export const getActiveReviewers = reviewersManagementService.getActiveReviewers.bind(reviewersManagementService);
export const createReviewer = reviewersManagementService.createReviewer.bind(reviewersManagementService);
export const updateReviewer = reviewersManagementService.updateReviewer.bind(reviewersManagementService);
export const toggleReviewerStatus = reviewersManagementService.toggleReviewerStatus.bind(reviewersManagementService);
export const getReviewerStats = reviewersManagementService.getReviewerStats.bind(reviewersManagementService);
