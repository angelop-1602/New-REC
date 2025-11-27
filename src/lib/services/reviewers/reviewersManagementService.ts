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
  Timestamp,
  deleteField
} from 'firebase/firestore';
import { generateReviewerCode } from './reviewerCodeGenerator';
import { toDate } from '@/types';

const db = getFirestore(firebaseApp);
const REVIEWERS_COLLECTION = 'reviewers';

export type ReviewerRole = 'chairperson' | 'vice-chair' | 'member' | 'secretary' | 'office-secretary';

export interface Reviewer {
  id: string;
  code: string;
  name: string;
  role?: ReviewerRole; // Role in the REC
  isActive: boolean;
  recMemberId?: string; // Link to REC member if this reviewer is also an REC member
  imageUrl?: string; // Image URL for member photo
  
  // Member profile fields
  specialty?: string; // Member's specialty
  sex?: string; // Sex: "Male" or "Female"
  ageCategory?: string; // Age category: "≤50" or ">50"
  highestEducationalAttainment?: string; // Highest educational attainment
  roleInREC?: string; // Role in REC: "Medical/Scientist" or "Non-Scientist"
  
  // Staff profile fields
  birthYear?: number; // Birth year
  educationalBackground?: string; // Educational background
  fullTime?: boolean; // Full-time status
  
  // Appointment and tenure
  dateOfAppointment?: { month: number; year: number }; // Date of appointment (month and year)
  tenure?: { month: number; year: number }; // Tenure period (month and year)
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateReviewerRequest {
  name: string;
  role?: ReviewerRole; // Optional: role in the REC
  recMemberId?: string; // Optional: link to REC member
  
  // Member profile fields
  specialty?: string;
  sex?: string;
  ageCategory?: string;
  highestEducationalAttainment?: string;
  roleInREC?: string;
  
  // Staff profile fields
  birthYear?: number;
  educationalBackground?: string;
  fullTime?: boolean;
  
  // Appointment and tenure
  dateOfAppointment?: { month: number; year: number };
  tenure?: { month: number; year: number };
}

export interface UpdateReviewerRequest {
  name?: string;
  role?: ReviewerRole | null; // null means delete the field
  recMemberId?: string | null; // null means delete the field
  isActive?: boolean;
  imageUrl?: string | null; // null means delete the field
  
  // Member profile fields
  specialty?: string | null;
  sex?: string | null;
  ageCategory?: string | null;
  highestEducationalAttainment?: string | null;
  roleInREC?: string | null;
  
  // Staff profile fields
  birthYear?: number | null;
  educationalBackground?: string | null;
  fullTime?: boolean | null;
  
  // Appointment and tenure
  dateOfAppointment?: { month: number; year: number } | null;
  tenure?: { month: number; year: number } | null;
}

export class ReviewersManagementService {
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
   * Convert reviewer name to URL-safe slug
   */
  static nameToSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Get reviewer by name slug
   */
  async getReviewerByNameSlug(nameSlug: string): Promise<Reviewer | null> {
    try {
      const allReviewers = await this.getAllReviewers();
      const decodedSlug = decodeURIComponent(nameSlug);
      
      // Find reviewer by matching slug
      const reviewer = allReviewers.find(r => {
        const reviewerSlug = ReviewersManagementService.nameToSlug(r.name);
        return reviewerSlug === decodedSlug;
      });
      
      return reviewer || null;
    } catch (error) {
      console.error('Error fetching reviewer by name slug:', error);
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
      
      // Build reviewer object, excluding undefined values
      const reviewer: Omit<Reviewer, 'id'> = {
        code,
        name: reviewerData.name,
        isActive: true,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      // Only add optional fields if they are defined
      if (reviewerData.role) {
        reviewer.role = reviewerData.role;
      }
      
      if (reviewerData.recMemberId) {
        reviewer.recMemberId = reviewerData.recMemberId;
      }
      
      // Add member profile fields
      if (reviewerData.specialty !== undefined) {
        reviewer.specialty = reviewerData.specialty;
      }
      if (reviewerData.sex !== undefined) {
        reviewer.sex = reviewerData.sex;
      }
      if (reviewerData.ageCategory !== undefined) {
        reviewer.ageCategory = reviewerData.ageCategory;
      }
      if (reviewerData.highestEducationalAttainment !== undefined) {
        reviewer.highestEducationalAttainment = reviewerData.highestEducationalAttainment;
      }
      if (reviewerData.roleInREC !== undefined) {
        reviewer.roleInREC = reviewerData.roleInREC;
      }
      
      // Add staff profile fields
      if (reviewerData.birthYear !== undefined) {
        reviewer.birthYear = reviewerData.birthYear;
      }
      if (reviewerData.educationalBackground !== undefined) {
        reviewer.educationalBackground = reviewerData.educationalBackground;
      }
      if (reviewerData.fullTime !== undefined) {
        reviewer.fullTime = reviewerData.fullTime;
      }
      
      // Add appointment and tenure fields
      if (reviewerData.dateOfAppointment !== undefined) {
        reviewer.dateOfAppointment = reviewerData.dateOfAppointment;
      }
      if (reviewerData.tenure !== undefined) {
        reviewer.tenure = reviewerData.tenure;
      }
      
      await setDoc(reviewerRef, reviewer);
      return reviewerRef.id;
    } catch (error) {
      console.error('Error creating reviewer:', error);
      return null;
    }
  }

  /**
   * Create reviewer from REC member
   */
  async createReviewerFromRECMember(recMemberId: string, recMemberName: string): Promise<string | null> {
    try {
      return await this.createReviewer({
        name: recMemberName,
        recMemberId: recMemberId
      });
    } catch (error) {
      console.error('Error creating reviewer from REC member:', error);
      return null;
    }
  }

  /**
   * Get reviewer by REC member ID
   */
  async getReviewerByRECMemberId(recMemberId: string): Promise<Reviewer | null> {
    try {
      const reviewersRef = collection(db, REVIEWERS_COLLECTION);
      const q = query(reviewersRef, where('recMemberId', '==', recMemberId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Reviewer;
      }
      return null;
    } catch (error) {
      console.error('Error fetching reviewer by REC member ID:', error);
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
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp()
      };
      
      if (updates.name) {
        const newCode = await generateReviewerCode(updates.name);
        updateData.code = newCode;
        updateData.name = updates.name;
      }
      
      // Handle role - use deleteField() if null, otherwise set the value
      if (updates.role !== undefined) {
        if (updates.role === null) {
          // Remove the role field from Firestore
          updateData.role = deleteField();
        } else {
          updateData.role = updates.role;
        }
      }
      
      // Handle other optional fields
      if (updates.recMemberId !== undefined) {
        if (updates.recMemberId === null) {
          updateData.recMemberId = deleteField();
        } else {
          updateData.recMemberId = updates.recMemberId;
        }
      }
      
      if (updates.isActive !== undefined) {
        updateData.isActive = updates.isActive;
      }
      
      if (updates.imageUrl !== undefined) {
        if (updates.imageUrl === null) {
          updateData.imageUrl = deleteField();
        } else {
          updateData.imageUrl = updates.imageUrl;
        }
      }
      
      // Handle member profile fields
      if (updates.specialty !== undefined) {
        updateData.specialty = updates.specialty === null ? deleteField() : updates.specialty;
      }
      if (updates.sex !== undefined) {
        updateData.sex = updates.sex === null ? deleteField() : updates.sex;
      }
      if (updates.ageCategory !== undefined) {
        updateData.ageCategory = updates.ageCategory === null ? deleteField() : updates.ageCategory;
      }
      if (updates.highestEducationalAttainment !== undefined) {
        updateData.highestEducationalAttainment = updates.highestEducationalAttainment === null ? deleteField() : updates.highestEducationalAttainment;
      }
      if (updates.roleInREC !== undefined) {
        updateData.roleInREC = updates.roleInREC === null ? deleteField() : updates.roleInREC;
      }
      
      // Handle staff profile fields
      if (updates.birthYear !== undefined) {
        updateData.birthYear = updates.birthYear === null ? deleteField() : updates.birthYear;
      }
      if (updates.educationalBackground !== undefined) {
        updateData.educationalBackground = updates.educationalBackground === null ? deleteField() : updates.educationalBackground;
      }
      if (updates.fullTime !== undefined) {
        updateData.fullTime = updates.fullTime === null ? deleteField() : updates.fullTime;
        }
      
      // Handle appointment and tenure fields
      if (updates.dateOfAppointment !== undefined) {
        updateData.dateOfAppointment = updates.dateOfAppointment === null ? deleteField() : updates.dateOfAppointment;
      }
      if (updates.tenure !== undefined) {
        updateData.tenure = updates.tenure === null ? deleteField() : updates.tenure;
      }
      
      await updateDoc(reviewerRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating reviewer:', error);
      return false;
    }
  }

  /**
   * Get member image path from public folder based on name
   * Automatically matches names to image files using flexible matching
   */
  getMemberImagePath(name: string): string | null {
    // All available member images in public/members/
    // Note: Some files use Last-First format (e.g., Elizabeth-Iquin.png)
    const memberImages = [
      { file: 'Allan-Paulo-Blaquera.png', names: ['Allan Paulo Blaquera', 'Allan Paulo C. Blaquera', 'Allan Paulo', 'Blaquera'] },
      { file: 'Angelo-Peralta.png', names: ['Angelo Peralta', 'Angelo C. Peralta', 'Angelo', 'Peralta'] },
      { file: 'Everett-Laureta.png', names: ['Everett Laureta', 'Everett C. Laureta', 'Everett', 'Laureta'] },
      { file: 'Elizabeth-Iquin.png', names: ['Iquin Elizabeth', 'Elizabeth Iquin', 'Iquin Elizabeth C.', 'Iquin', 'Elizabeth'] },
      { file: 'Maria-Felina-Agbayani.png', names: ['Maria Felina Agbayani', 'Maria Felina C. Agbayani', 'Maria Felina', 'Agbayani'] },
      { file: 'Marjorie-Bambalan.png', names: ['Marjorie Bambalan', 'Marjorie C. Bambalan', 'Marjorie', 'Bambalan'] },
      { file: 'Mark-Klimson-Luyun.png', names: ['Mark Klimson Luyun', 'Mark Klimson C. Luyun', 'Mark Klimson', 'Luyun'] },
      { file: 'Milrose-Tangonan.png', names: ['Milrose Tangonan', 'Milrose C. Tangonan', 'Milrose', 'Tangonan'] },
      { file: 'Nova-Domingo.png', names: ['Nova Domingo', 'Nova C. Domingo', 'Nova', 'Domingo'] },
      { file: 'Rita-Daliwag.jpg', names: ['Rita Daliwag', 'Rita C. Daliwag', 'Rita', 'Daliwag'] },
      { file: 'Vercel-Baccay.png', names: ['Vercel Baccay', 'Vercel C. Baccay', 'Vercel', 'Baccay'] },
      { file: 'Normie-Anne-Tuazon.png', names: ['Normie Anne Tuazon', 'Normie Anne C. Tuazon', 'Normie Anne', 'Tuazon', 'Normie', 'Anne Tuazon'] },
      { file: 'Kristine-Joy-Cortes.png', names: ['Kristine Joy Cortes', 'Kristine Joy C. Cortes', 'Kristine Joy', 'Cortes', 'Kristine', 'Joy Cortes'] },
    ];

    // Normalize the input name
    const normalizeName = (n: string) => n.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedInput = normalizeName(name);

    // Try exact match first
    for (const image of memberImages) {
      for (const mappedName of image.names) {
        if (normalizeName(mappedName) === normalizedInput) {
          return `/members/${image.file}`;
        }
      }
    }

    // Try matching by last name (most reliable identifier)
    const nameParts = normalizedInput.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      for (const image of memberImages) {
        const imageParts = image.file.toLowerCase().replace(/\.(png|jpg)$/i, '').split('-');
        const imageFirst = imageParts[0];
        const imageLast = imageParts[imageParts.length - 1];
        
        // Try matching: name format could be First-Last or Last-First
        // Check if last name matches (most reliable)
        if (lastName === imageLast || lastName === imageFirst) {
          return `/members/${image.file}`;
        }
        
        // Try matching first and last name (both orders)
        if (nameParts.length >= 2 && imageParts.length >= 2) {
          // First-Last format match
          if (firstName === imageFirst && lastName === imageLast) {
            return `/members/${image.file}`;
          }
          // Last-First format match (e.g., "Elizabeth Iquin" matches "Elizabeth-Iquin.png")
          if (firstName === imageLast && lastName === imageFirst) {
            return `/members/${image.file}`;
          }
        }
      }
    }

    // Try partial match with first name
    if (nameParts.length > 0) {
      const firstName = nameParts[0];
      for (const image of memberImages) {
        const imageParts = image.file.toLowerCase().replace(/\.(png|jpg)$/i, '').split('-');
        if (imageParts[0] === firstName && nameParts.length >= 2) {
          // Check if any other part matches
          for (let i = 1; i < imageParts.length && i < nameParts.length; i++) {
            if (imageParts[i] === nameParts[i]) {
              return `/members/${image.file}`;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Update reviewer image URLs from public folder for all reviewers without images
   */
  async updateMemberImagesFromPublicFolder(): Promise<{ updated: number; failed: number }> {
    try {
      const reviewers = await this.getAllReviewers();
      let updated = 0;
      let failed = 0;

      for (const reviewer of reviewers) {
        // Skip if reviewer already has an imageUrl
        if (reviewer.imageUrl) {
          continue;
        }

        // Try to get image path from public folder
        const imagePath = this.getMemberImagePath(reviewer.name);
        
        if (imagePath) {
          const success = await this.updateReviewer(reviewer.id, {
            imageUrl: imagePath
          });
          
          if (success) {
            updated++;
            console.log(`✅ Updated image for ${reviewer.name}: ${imagePath}`);
          } else {
            failed++;
            console.error(`❌ Failed to update image for ${reviewer.name}`);
          }
        }
      }

      return { updated, failed };
    } catch (error) {
      console.error('Error updating member images:', error);
      return { updated: 0, failed: 0 };
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

  /**
   * Export all reviewers to JSON format
   */
  async exportReviewersToJSON(): Promise<string> {
    try {
      const reviewers = await this.getAllReviewers();
      
      // Transform reviewers data for JSON export
      // Handle both simple and extended reviewer data structures
      const exportData = {
        export_date: new Date().toISOString(),
        export_metadata: {
          system: "Protocol Review System (REC)",
          institution: "Saint Paul University Philippines",
          version: "1.0.0"
        },
        statistics: {
          total_reviewers: reviewers.length,
          active_count: reviewers.filter(r => r.isActive).length,
          inactive_count: reviewers.filter(r => !r.isActive).length
        },
        reviewers: reviewers.map(reviewer => {
          // Get all available fields from reviewer object (may have additional fields)
          const reviewerData: any = {
            id: reviewer.id,
            code: reviewer.code,
            name: reviewer.name,
            is_active: reviewer.isActive,
            created_at: (() => {
              const date = toDate(reviewer.createdAt);
              return date ? date.toISOString() : null;
            })(),
            updated_at: (() => {
              const date = toDate(reviewer.updatedAt);
              return date ? date.toISOString() : null;
            })()
          };
          
          // Add optional fields if they exist
          if ('email' in reviewer && reviewer.email) reviewerData.email = reviewer.email;
          if ('department' in reviewer && reviewer.department) reviewerData.department = reviewer.department;
          if ('qualification' in reviewer && reviewer.qualification) reviewerData.qualification = reviewer.qualification;
          if ('role' in reviewer && reviewer.role) reviewerData.role = reviewer.role;
          if ('expertise' in reviewer && reviewer.expertise) reviewerData.expertise = reviewer.expertise;
          if ('specializations' in reviewer && reviewer.specializations) reviewerData.specializations = reviewer.specializations;
          if ('preferredTypes' in reviewer && reviewer.preferredTypes) reviewerData.preferred_types = reviewer.preferredTypes;
          if ('totalReviewed' in reviewer) reviewerData.total_reviewed = reviewer.totalReviewed || 0;
          if ('availability' in reviewer) reviewerData.availability = reviewer.availability;
          if ('currentLoad' in reviewer) reviewerData.current_load = reviewer.currentLoad || 0;
          if ('maxLoad' in reviewer) reviewerData.max_load = reviewer.maxLoad || 0;
          
          return reviewerData;
        })
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting reviewers to JSON:', error);
      throw new Error('Failed to export reviewers to JSON');
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
export const exportReviewersToJSON = reviewersManagementService.exportReviewersToJSON.bind(reviewersManagementService);
