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
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { getFirestore } from 'firebase/firestore';
import {
  getActiveReviewers,
  getAllReviewers,
  getReviewer,
  createReviewer,
  updateReviewer,
  deleteReviewer
} from '@/lib/services/core/unifiedDataService';
import { toDate } from '@/types';

const db = getFirestore(firebaseApp);

// Legacy Reviewer interface (for backward compatibility)
export interface Reviewer {
  id: string;
  name: string;
  email: string;
  expertise: string[];
  department: string;
  qualification: string;
  availability: 'available' | 'busy' | 'unavailable';
  isActive: boolean; // Whether the reviewer can still review (not online status)
  currentLoad: number; // Number of protocols currently reviewing
  maxLoad: number; // Maximum protocols they can review simultaneously
  totalReviewed: number; // Total protocols reviewed historically
  specializations: string[];
  preferredTypes: ('social' | 'experimental' | 'exemption')[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Assignment rules based on research type
export const REVIEWER_REQUIREMENTS = {
  'SR': { 
    count: 3, 
    label: 'Social/Behavioral Research (SR)',
    requiredExpertise: ['social sciences', 'ethics', 'qualitative research'],
    assessmentTypes: [
      'Protocol Review Assessment',
      'Protocol Review Assessment', 
      'Informed Consent Assessment'
    ]
  },
  'PR': { 
    count: 3, 
    label: 'Public Health Research (PR)',
    requiredExpertise: ['public health', 'epidemiology', 'health sciences'],
    assessmentTypes: [
      'Protocol Review Assessment',
      'Protocol Review Assessment', 
      'Informed Consent Assessment'
    ]
  },
  'HO': { 
    count: 3, 
    label: 'Health Operations (HO)',
    requiredExpertise: ['health operations', 'healthcare management', 'clinical practice'],
    assessmentTypes: [
      'Protocol Review Assessment',
      'Protocol Review Assessment', 
      'Informed Consent Assessment'
    ]
  },
  'BS': { 
    count: 3, 
    label: 'Biomedical Research (BS)',
    requiredExpertise: ['biomedical sciences', 'clinical research', 'laboratory sciences'],
    assessmentTypes: [
      'Protocol Review Assessment',
      'Protocol Review Assessment', 
      'Informed Consent Assessment'
    ]
  },
  'EX': { 
    count: 2, 
    label: 'Exempted from Review (EX)',
    requiredExpertise: ['ethics', 'regulatory compliance'],
    assessmentTypes: [
      'Exemption Assessment',
      'Exemption Assessment'
    ],
    hasSubTypes: true,
    subTypes: {
      'experimental': {
        label: 'Experimental Research',
        assessmentTypes: [
          'IACUC Protocol Review Assessment',
          'IACUC Protocol Review Assessment'
        ]
      },
      'documentary': {
        label: 'Documentary/Textual Analysis',
        assessmentTypes: [
          'Checklist for Exemption Form Review',
          'Checklist for Exemption Form Review'
        ]
      }
    }
  },
  
  // Legacy support for old mapping system
  'social': { 
    count: 3, 
    label: 'Social Research',
    requiredExpertise: ['social sciences', 'ethics', 'qualitative research'],
    assessmentTypes: [
      'Protocol Review Assessment',
      'Protocol Review Assessment', 
      'Informed Consent Assessment'
    ]
  },
  'experimental': { 
    count: 2, 
    label: 'Experimental Research',
    requiredExpertise: ['experimental design', 'statistics', 'quantitative research'],
    assessmentTypes: [
      'IACUC Protocol Review Assessment',
      'IACUC Protocol Review Assessment'
    ]
  },
  'exemption': { 
    count: 2, 
    label: 'Exemption',
    requiredExpertise: ['ethics', 'regulatory compliance'],
    assessmentTypes: [
      'Checklist for Exemption Form Review',
      'Checklist for Exemption Form Review'
    ]
  }
} as const;

const REVIEWERS_COLLECTION = 'reviewers';
const SUBMISSIONS_COLLECTION = 'submissions';

class ReviewerService {
  /**
   * Get all active reviewers using unified data service
   */
  async getAllReviewers(): Promise<Reviewer[]> {
    try {
      // Use unified data service
      const unifiedReviewers = await getAllReviewers();
      
      // Convert unified reviewers to legacy format for backward compatibility
      return unifiedReviewers.map(unified => ({
        id: unified.id,
        name: unified.name,
        email: unified.email,
        expertise: unified.expertise,
        department: unified.department,
        qualification: unified.qualification,
        availability: 'available' as const, // Default since we removed this field
        isActive: unified.isActive,
        currentLoad: 0, // Default since we removed this field
        maxLoad: 5, // Default since we removed this field
        totalReviewed: unified.totalReviewed,
        specializations: unified.specializations,
        preferredTypes: unified.preferredTypes.map(type => {
          switch (type) {
            case 'Protocol Review Assessment':
            case 'Informed Consent Assessment':
              return 'social' as const;
            case 'IACUC Protocol Review Assessment':
              return 'experimental' as const;
            case 'Checklist for Exemption Form Review':
              return 'exemption' as const;
            default:
              return 'social' as const;
          }
        }),
        createdAt: unified.createdAt,
        updatedAt: unified.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching reviewers:', error);
      return [];
    }
  }

  /**
   * Get available reviewers using unified data service
   */
  async getAvailableReviewers(): Promise<Reviewer[]> {
    try {
      // Use unified data service to get active reviewers
      const unifiedReviewers = await getActiveReviewers();
      
      // Convert unified reviewers to legacy format for backward compatibility
      return unifiedReviewers.map(unified => ({
        id: unified.id,
        name: unified.name,
        email: unified.email,
        expertise: unified.expertise,
        department: unified.department,
        qualification: unified.qualification,
        availability: 'available' as const, // Default since we removed this field
        isActive: unified.isActive,
        currentLoad: 0, // Default since we removed this field
        maxLoad: 5, // Default since we removed this field
        totalReviewed: unified.totalReviewed,
        specializations: unified.specializations,
        preferredTypes: unified.preferredTypes.map(type => {
          switch (type) {
            case 'Protocol Review Assessment':
            case 'Informed Consent Assessment':
              return 'social' as const;
            case 'IACUC Protocol Review Assessment':
              return 'experimental' as const;
            case 'Checklist for Exemption Form Review':
              return 'exemption' as const;
            default:
              return 'social' as const;
          }
        }),
        createdAt: unified.createdAt,
        updatedAt: unified.updatedAt,
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching available reviewers:', error);
      return [];
    }
  }

  /**
   * Get reviewer by ID using unified data service
   */
  async getReviewerById(reviewerId: string): Promise<Reviewer | null> {
    try {
      // Use unified data service
      const unifiedReviewer = await getReviewer(reviewerId);
      
      if (!unifiedReviewer) {
        return null;
      }
      
      // Convert unified reviewer to legacy format for backward compatibility
      return {
        id: unifiedReviewer.id,
        name: unifiedReviewer.name,
        email: unifiedReviewer.email,
        expertise: unifiedReviewer.expertise,
        department: unifiedReviewer.department,
        qualification: unifiedReviewer.qualification,
        availability: 'available' as const, // Default since we removed this field
        isActive: unifiedReviewer.isActive,
        currentLoad: 0, // Default since we removed this field
        maxLoad: 5, // Default since we removed this field
        totalReviewed: unifiedReviewer.totalReviewed,
        specializations: unifiedReviewer.specializations,
        preferredTypes: unifiedReviewer.preferredTypes.map(type => {
          switch (type) {
            case 'Protocol Review Assessment':
            case 'Informed Consent Assessment':
              return 'social' as const;
            case 'IACUC Protocol Review Assessment':
              return 'experimental' as const;
            case 'Checklist for Exemption Form Review':
              return 'exemption' as const;
            default:
              return 'social' as const;
          }
        }),
        createdAt: unifiedReviewer.createdAt,
        updatedAt: unifiedReviewer.updatedAt,
      };
    } catch (error) {
      console.error('Error fetching reviewer:', error);
      return null;
    }
  }

  /**
   * Get smart reviewer recommendations based on research type and expertise
   */
  async getRecommendedReviewers(
    researchType: 'social' | 'experimental' | 'exemption',
    protocolTitle?: string,
    keywords?: string[]
  ): Promise<Reviewer[]> {
    try {
      const requirements = REVIEWER_REQUIREMENTS[researchType];
      const allReviewers = await this.getAvailableReviewers();
      
      // Score each reviewer based on various factors
      const scoredReviewers = allReviewers.map(reviewer => {
        let score = 0;
        
        // Availability score (higher priority for available reviewers)
        if (reviewer.availability === 'available') {
          score += 10;
        }
        
        // Load balance score (prefer reviewers with lower current load)
        const loadRatio = reviewer.currentLoad / (reviewer.maxLoad || 5);
        score += (1 - loadRatio) * 8;
        
        // Expertise match score
        const expertiseMatch = requirements.requiredExpertise.filter(exp => 
          reviewer.expertise.some(revExp => 
            revExp.toLowerCase().includes(exp.toLowerCase())
          )
        ).length;
        score += expertiseMatch * 5;
        
        // Preferred type match
        if (reviewer.preferredTypes?.includes(researchType)) {
          score += 7;
        }
        
        // Specialization match with keywords
        if (keywords && keywords.length > 0) {
          const keywordMatches = keywords.filter(keyword =>
            reviewer.specializations?.some(spec =>
              spec.toLowerCase().includes(keyword.toLowerCase())
            )
          ).length;
          score += keywordMatches * 3;
        }
        
        // Experience score (more experienced reviewers get slight boost)
        score += Math.min(reviewer.totalReviewed * 0.1, 5);
        
        return {
          ...reviewer,
          recommendationScore: score
        };
      });
      
      // Sort by score and return top recommendations
      return scoredReviewers
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, requirements.count * 2); // Return double the required amount for options
    } catch (error) {
      console.error('Error getting recommended reviewers:', error);
      return [];
    }
  }

  /**
   * Assign reviewers to a protocol with assessment types (using subcollection)
   */
  async assignReviewers(
    protocolId: string,
    reviewerIds: string[],
    researchType: 'SR' | 'PR' | 'HO' | 'BS' | 'EX' | 'social' | 'experimental' | 'exemption',
    exemptionSubType?: 'experimental' | 'documentary'
  ): Promise<boolean> {
    try {
      let requirements = REVIEWER_REQUIREMENTS[researchType];
      
      // Handle EX subtype requirements
      const requirementsWithSubTypes = requirements as { hasSubTypes?: boolean; subTypes?: Record<string, unknown> };
      if (researchType === 'EX' && exemptionSubType && requirementsWithSubTypes.hasSubTypes && requirementsWithSubTypes.subTypes) {
        const subTypeConfig = requirementsWithSubTypes.subTypes[exemptionSubType] as { assessmentTypes?: readonly string[]; label?: string };
        if (subTypeConfig) {
          requirements = {
            ...requirements,
            assessmentTypes: subTypeConfig.assessmentTypes || requirements.assessmentTypes,
            label: `${requirements.label} - ${subTypeConfig.label || ''}`
          } as unknown as typeof requirements;
        }
      }
      
      // First, clear any existing reviewer assignments for this protocol
      await this.clearProtocolReviewers(protocolId);
      
      // Filter out empty strings and assign reviewers
      const validReviewerIds = reviewerIds.filter(id => id && id.trim() !== '');
      
      // Determine deadline based on protocol type and review type
      let baseDays = 14; // default expedited
      try {
        const protocolRef = doc(db, SUBMISSIONS_COLLECTION, protocolId);
        const protocolSnap = await getDoc(protocolRef);
        if (protocolSnap.exists()) {
          const protocolData = protocolSnap.data() as any;
          const info = protocolData.information?.general_information || {};
          const typeOfReview = (info.typeOfReview || protocolData.typeOfReview || '').toString().toLowerCase();
          if (researchType === 'EX' || researchType === 'exemption') {
            baseDays = 7;
          } else if (typeOfReview === 'full' || typeOfReview === 'full board') {
            baseDays = 30;
          } else if (typeOfReview === 'expedited') {
            baseDays = 14;
          }
        } else {
          // If protocol not found, fallback by researchType
          baseDays = (researchType === 'EX' || researchType === 'exemption') ? 7 : 14;
        }
      } catch {
        // On any error, fallback by researchType
        baseDays = (researchType === 'EX' || researchType === 'exemption') ? 7 : 14;
      }

      const assignmentPromises = validReviewerIds.map(async (reviewerId, index) => {
        if (!reviewerId) return;
        
        const reviewerRef = doc(db, REVIEWERS_COLLECTION, reviewerId);
        const reviewerSnap = await getDoc(reviewerRef);
        
        if (reviewerSnap.exists()) {
          const reviewerData = reviewerSnap.data();
          const currentLoad = reviewerData.currentLoad || 0;
          const assessmentType = requirements.assessmentTypes[index] || 'Assessment Type Not Defined';
          
          // Update reviewer's current load
          await updateDoc(reviewerRef, {
            currentLoad: currentLoad + 1,
            updatedAt: serverTimestamp()
          });
          
          // Store assignment in protocol's reviewers subcollection
          const protocolReviewersRef = collection(db, SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
          const assignmentRef = doc(protocolReviewersRef);
          
          // Calculate deadline based on derived baseDays
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + baseDays);
          
          await setDoc(assignmentRef, {
            reviewerId,
            reviewerName: reviewerData.name || 'Unknown Reviewer',
            reviewerEmail: reviewerData.email || 'no-email@spup.edu.ph',
            assessmentType,
            position: index,  // FIXED: was assessmentIndex for consistency
            researchType,
            assignedAt: serverTimestamp(),
            deadline: deadline,
            status: 'assigned',
            reviewStatus: 'pending'
          });
        }
      });
      
      await Promise.all(assignmentPromises);
      return true;
    } catch (error) {
      console.error('Error assigning reviewers:', error);
      return false;
    }
  }

  /**
   * Clear existing reviewer assignments for a protocol
   */
  async clearProtocolReviewers(protocolId: string): Promise<void> {
    try {
      const protocolReviewersRef = collection(db, SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
      const snapshot = await getDocs(protocolReviewersRef);
      
      const deletePromises = snapshot.docs.map(async (docSnap) => {
        await deleteDoc(docSnap.ref);
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing protocol reviewers:', error);
    }
  }

  /**
   * Get assigned reviewers for a protocol
   */
  async getProtocolReviewers(protocolId: string): Promise<any[]> {
    try {
      const protocolReviewersRef = collection(db, SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
      const snapshot = await getDocs(protocolReviewersRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching protocol reviewers:', error);
      return [];
    }
  }

  /**
   * Create or update a reviewer
   */
  async saveReviewer(reviewer: Partial<Reviewer>): Promise<string | null> {
    try {
      const reviewerId = reviewer.id || doc(collection(db, REVIEWERS_COLLECTION)).id;
      const reviewerRef = doc(db, REVIEWERS_COLLECTION, reviewerId);
      
      const reviewerData = {
        ...reviewer,
        id: reviewerId,
        updatedAt: serverTimestamp(),
        ...(reviewer.id ? {} : { createdAt: serverTimestamp() })
      };
      
      await setDoc(reviewerRef, reviewerData, { merge: true });
      return reviewerId;
    } catch (error) {
      console.error('Error saving reviewer:', error);
      return null;
    }
  }

  /**
   * Update reviewer availability
   */
  async updateAvailability(
    reviewerId: string, 
    availability: 'available' | 'busy' | 'unavailable'
  ): Promise<boolean> {
    try {
      const reviewerRef = doc(db, REVIEWERS_COLLECTION, reviewerId);
      await updateDoc(reviewerRef, {
        availability,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating availability:', error);
      return false;
    }
  }

  /**
   * Decrease reviewer load when protocol review is completed
   */
  async decreaseReviewerLoad(reviewerId: string): Promise<boolean> {
    try {
      const reviewerRef = doc(db, REVIEWERS_COLLECTION, reviewerId);
      const reviewerSnap = await getDoc(reviewerRef);
      
      if (reviewerSnap.exists()) {
        const currentLoad = reviewerSnap.data().currentLoad || 0;
        const totalReviewed = reviewerSnap.data().totalReviewed || 0;
        
        await updateDoc(reviewerRef, {
          currentLoad: Math.max(0, currentLoad - 1),
          totalReviewed: totalReviewed + 1,
          updatedAt: serverTimestamp()
        });
      }
      return true;
    } catch (error) {
      console.error('Error decreasing reviewer load:', error);
      return false;
    }
  }

  /**
   * Search reviewers by name or expertise
   */
  async searchReviewers(searchTerm: string): Promise<Reviewer[]> {
    try {
      const allReviewers = await this.getAllReviewers();
      const searchLower = searchTerm.toLowerCase();
      
      return allReviewers.filter(reviewer => 
        reviewer.name.toLowerCase().includes(searchLower) ||
        reviewer.email.toLowerCase().includes(searchLower) ||
        reviewer.department?.toLowerCase().includes(searchLower) ||
        reviewer.expertise?.some(exp => exp.toLowerCase().includes(searchLower)) ||
        reviewer.specializations?.some(spec => spec.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error('Error searching reviewers:', error);
      return [];
    }
  }

  /**
   * Check for overdue reviewers and create audit records
   */
  async checkOverdueReviewers(protocolId: string): Promise<void> {
    try {
      const protocolReviewersRef = collection(db, SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
      const snapshot = await getDocs(protocolReviewersRef);
      
      const now = new Date();
      const overdueReviewers = [];
      
      for (const docSnap of snapshot.docs) {
        const assignment = docSnap.data();
        const deadline = toDate(assignment.deadline);
        
        if (deadline && deadline < now && assignment.reviewStatus === 'pending') {
          overdueReviewers.push({
            ...assignment,
            id: docSnap.id,
            daysOverdue: Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      }
      
      // Create audit records for overdue reviewers
      if (overdueReviewers.length > 0) {
        const auditRef = collection(db, 'audit_logs');
        await setDoc(doc(auditRef), {
          type: 'overdue_reviewers',
          protocolId,
          overdueReviewers,
          createdAt: serverTimestamp(),
          details: `${overdueReviewers.length} reviewer(s) overdue for protocol ${protocolId}`
        });
      }
    } catch (error) {
      console.error('Error checking overdue reviewers:', error);
    }
  }

  /**
   * Remove overdue reviewers from assignment
   */
  async removeOverdueReviewers(protocolId: string): Promise<void> {
    try {
      const protocolReviewersRef = collection(db, SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
      const snapshot = await getDocs(protocolReviewersRef);
      
      const now = new Date();
      const overdueIds = [];
      
      for (const docSnap of snapshot.docs) {
        const assignment = docSnap.data();
        const deadline = toDate(assignment.deadline);
        
        if (deadline && deadline < now && assignment.reviewStatus === 'pending') {
          overdueIds.push(docSnap.id);
        }
      }
      
      // Remove overdue reviewers
      for (const overdueId of overdueIds) {
        await deleteDoc(doc(protocolReviewersRef, overdueId));
      }
      
      if (overdueIds.length > 0) {
        console.log(`Removed ${overdueIds.length} overdue reviewers from protocol ${protocolId}`);
      }
    } catch (error) {
      console.error('Error removing overdue reviewers:', error);
    }
  }

  /**
   * Reassign a reviewer to a new reviewer
   * @param protocolId - The protocol ID
   * @param assignmentId - The assignment document ID to reassign
   * @param newReviewerId - The new reviewer's ID
   * @param reason - Reason for reassignment
   * @param reassignedBy - Chairperson who did the reassignment
   */
  async reassignReviewer(
    protocolId: string,
    assignmentId: string,
    newReviewerId: string,
    reason: string,
    reassignedBy: string
  ): Promise<boolean> {
    try {
      // Get the old assignment
      const assignmentRef = doc(db, SUBMISSIONS_COLLECTION, protocolId, 'reviewers', assignmentId);
      const assignmentSnap = await getDoc(assignmentRef);
      
      if (!assignmentSnap.exists()) {
        console.error('Assignment not found');
        return false;
      }
      
      const oldAssignment = assignmentSnap.data();
      const now = new Date();
      const originalDeadline = toDate(oldAssignment.deadline);
      if (!originalDeadline) {
        console.error('Invalid deadline');
        return false;
      }
      const daysOverdue = Math.ceil((now.getTime() - originalDeadline.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get new reviewer data
      const newReviewerRef = doc(db, REVIEWERS_COLLECTION, newReviewerId);
      const newReviewerSnap = await getDoc(newReviewerRef);
      
      if (!newReviewerSnap.exists()) {
        console.error('New reviewer not found');
        return false;
      }
      
      const newReviewerData = newReviewerSnap.data();
      
      // Calculate new deadline (2 weeks from now)
      const newDeadline = new Date();
      newDeadline.setDate(newDeadline.getDate() + 14);
      
      // Create reassignment history record
      const reassignmentHistoryRef = collection(db, SUBMISSIONS_COLLECTION, protocolId, 'reassignment_history');
      await setDoc(doc(reassignmentHistoryRef), {
        protocolId,
        oldReviewerId: oldAssignment.reviewerId,
        oldReviewerName: oldAssignment.reviewerName,
        oldReviewerEmail: oldAssignment.reviewerEmail,
        newReviewerId: newReviewerId,
        newReviewerName: newReviewerData.name,
        newReviewerEmail: newReviewerData.email,
        assessmentType: oldAssignment.assessmentType,
        position: oldAssignment.position,
        originalDeadline: originalDeadline,
        newDeadline: newDeadline,
        reassignedAt: serverTimestamp(),
        reassignedBy,
        reason,
        daysOverdue
      });
      
      // Delete old reviewer's assessment form data if exists
      try {
        const assessmentFormsRef = collection(db, SUBMISSIONS_COLLECTION, protocolId, 'assessment_forms');
        const assessmentFormsSnapshot = await getDocs(assessmentFormsRef);
        
        for (const assessmentDoc of assessmentFormsSnapshot.docs) {
          const assessmentData = assessmentDoc.data();
          if (assessmentData.reviewerId === oldAssignment.reviewerId) {
            await deleteDoc(assessmentDoc.ref);
            console.log(`Deleted assessment form for old reviewer ${oldAssignment.reviewerName}`);
          }
        }
      } catch (error) {
        console.error('Error deleting old assessment forms:', error);
      }
      
      // Update old reviewer's load (decrease)
      const oldReviewerRef = doc(db, REVIEWERS_COLLECTION, oldAssignment.reviewerId);
      const oldReviewerSnap = await getDoc(oldReviewerRef);
      if (oldReviewerSnap.exists()) {
        const oldReviewerData = oldReviewerSnap.data();
        const currentLoad = oldReviewerData.currentLoad || 0;
        await updateDoc(oldReviewerRef, {
          currentLoad: Math.max(0, currentLoad - 1),
          updatedAt: serverTimestamp()
        });
      }
      
      // Update new reviewer's load (increase)
      const newCurrentLoad = newReviewerData.currentLoad || 0;
      await updateDoc(newReviewerRef, {
        currentLoad: newCurrentLoad + 1,
        updatedAt: serverTimestamp()
      });
      
      // Update the assignment document with new reviewer
      await updateDoc(assignmentRef, {
        reviewerId: newReviewerId,
        reviewerName: newReviewerData.name,
        reviewerEmail: newReviewerData.email,
        deadline: newDeadline,
        assignedAt: serverTimestamp(),
        reviewStatus: 'pending',
        reassigned: true,
        reassignedAt: serverTimestamp(),
        previousReviewerId: oldAssignment.reviewerId,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Successfully reassigned reviewer from ${oldAssignment.reviewerName} to ${newReviewerData.name}`);
      return true;
    } catch (error) {
      console.error('Error reassigning reviewer:', error);
      return false;
    }
  }

  /**
   * Get reassigned protocols for a reviewer (protocols they were removed from)
   * @param reviewerId - The reviewer ID
   */
  async getReassignedProtocols(reviewerId: string): Promise<any[]> {
    try {
      const reassignedProtocols = [];
      
      // Query all submissions
      const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
      const submissionsSnapshot = await getDocs(submissionsRef);
      
      for (const submissionDoc of submissionsSnapshot.docs) {
        const protocolId = submissionDoc.id;
        const protocolData = submissionDoc.data();
        
        // Check reassignment_history subcollection
        const reassignmentHistoryRef = collection(db, SUBMISSIONS_COLLECTION, protocolId, 'reassignment_history');
        const reassignmentHistorySnapshot = await getDocs(reassignmentHistoryRef);
        
        for (const reassignmentDoc of reassignmentHistorySnapshot.docs) {
          const reassignmentData = reassignmentDoc.data();
          
          // If this reviewer was the old reviewer (removed)
          if (reassignmentData.oldReviewerId === reviewerId) {
            reassignedProtocols.push({
              protocolId,
              protocolTitle: protocolData.information?.general_information?.protocol_title || protocolData.title || 'Untitled Protocol',
              spupCode: protocolData.spupCode || 'No Code',
              originalDeadline: reassignmentData.originalDeadline,
              reassignedAt: reassignmentData.reassignedAt,
              reason: reassignmentData.reason,
              assessmentType: reassignmentData.assessmentType,
              daysOverdue: reassignmentData.daysOverdue
            });
          }
        }
      }
      
      // Sort by reassignment date (newest first)
      return reassignedProtocols.sort((a, b) => {
        const dateA = toDate(a.reassignedAt);
        const dateB = toDate(b.reassignedAt);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error fetching reassigned protocols:', error);
      return [];
    }
  }

  /**
   * Initialize sample reviewers (for development/testing)
   */
  async initializeSampleReviewers(): Promise<void> {
    const sampleReviewers: Partial<Reviewer>[] = [
      {
        name: 'Dr. Maria Santos',
        email: 'maria.santos@spup.edu.ph',
        expertise: ['social sciences', 'qualitative research', 'ethics'],
        department: 'Social Sciences',
        qualification: 'PhD in Sociology',
        availability: 'available',
        isActive: true,
        currentLoad: 1,
        maxLoad: 5,
        totalReviewed: 15,
        specializations: ['community development', 'gender studies', 'cultural anthropology'],
        preferredTypes: ['social']
      },
      {
        name: 'Dr. John Cruz',
        email: 'john.cruz@spup.edu.ph',
        expertise: ['experimental design', 'statistics', 'quantitative research'],
        department: 'Psychology',
        qualification: 'PhD in Experimental Psychology',
        availability: 'available',
        isActive: true,
        currentLoad: 2,
        maxLoad: 4,
        totalReviewed: 22,
        specializations: ['cognitive psychology', 'behavioral analysis', 'research methodology'],
        preferredTypes: ['experimental']
      },
      {
        name: 'Dr. Elena Reyes',
        email: 'elena.reyes@spup.edu.ph',
        expertise: ['ethics', 'regulatory compliance', 'medical research'],
        department: 'Medical Ethics',
        qualification: 'MD, PhD in Bioethics',
        availability: 'available',
        isActive: true,
        currentLoad: 0,
        maxLoad: 6,
        totalReviewed: 30,
        specializations: ['clinical trials', 'informed consent', 'vulnerable populations'],
        preferredTypes: ['experimental', 'exemption']
      },
      {
        name: 'Dr. Robert Lim',
        email: 'robert.lim@spup.edu.ph',
        expertise: ['social sciences', 'ethics', 'education research'],
        department: 'Education',
        qualification: 'EdD in Educational Research',
        availability: 'available',
        isActive: true,
        currentLoad: 1,
        maxLoad: 5,
        totalReviewed: 18,
        specializations: ['educational psychology', 'curriculum development', 'student assessment'],
        preferredTypes: ['social', 'exemption']
      },
      {
        name: 'Dr. Angela Torres',
        email: 'angela.torres@spup.edu.ph',
        expertise: ['qualitative research', 'nursing research', 'healthcare'],
        department: 'Nursing',
        qualification: 'PhD in Nursing Science',
        availability: 'busy',
        isActive: true,
        currentLoad: 3,
        maxLoad: 4,
        totalReviewed: 25,
        specializations: ['patient care', 'public health', 'clinical practice'],
        preferredTypes: ['social', 'experimental']
      },
      {
        name: 'Dr. Michael Garcia',
        email: 'michael.garcia@spup.edu.ph',
        expertise: ['experimental design', 'biostatistics', 'clinical research'],
        department: 'Medicine',
        qualification: 'MD, MSc in Clinical Research',
        availability: 'available',
        isActive: true,
        currentLoad: 2,
        maxLoad: 5,
        totalReviewed: 35,
        specializations: ['pharmacology', 'clinical trials', 'epidemiology'],
        preferredTypes: ['experimental']
      }
    ];

    for (const reviewer of sampleReviewers) {
      await this.saveReviewer(reviewer);
    }
  }
}

// Export singleton instance
export const reviewerService = new ReviewerService();

// Export utility functions
export const getRecommendedReviewers = reviewerService.getRecommendedReviewers.bind(reviewerService);
export const assignReviewers = reviewerService.assignReviewers.bind(reviewerService);
export const searchReviewers = reviewerService.searchReviewers.bind(reviewerService);
export const initializeSampleReviewers = reviewerService.initializeSampleReviewers.bind(reviewerService);
export const getProtocolReviewers = reviewerService.getProtocolReviewers.bind(reviewerService);
export const clearProtocolReviewers = reviewerService.clearProtocolReviewers.bind(reviewerService);
