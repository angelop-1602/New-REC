/**
 * REVIEWER TYPES
 * Enhanced type definitions specific to the Reviewer module
 * Extends common.types.ts for consistency
 */

import {
  BaseProtocol,
  BaseDocument,
  BaseAssessment,
  FirestoreDate,
  AssessmentFormType,
  AssessmentStatus,
  toDate,
  toISOString,
  toLocaleDateString,
  getProtocolTitle,
  getProtocolCode,
  getPIName,
  sortByDate,
} from './common.types';

// Re-export common utilities for convenience
export {
  toDate,
  toISOString,
  toLocaleDateString,
  getProtocolTitle,
  getProtocolCode,
  getPIName,
  sortByDate,
};

// ============================================================================
// REVIEWER ENTITY TYPES
// ============================================================================

/**
 * Reviewer information
 */
export interface ReviewerInfo {
  id: string;
  code: string;
  name: string;
  email: string;
  role: 'Chairperson' | 'Vice Chairperson' | 'Member' | 'Secretary';
  isActive: boolean;
  expertise?: string[];
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
  
  // Additional info
  institution?: string;
  position?: string;
  contactNumber?: string;
  
  // Statistics
  totalAssignments?: number;
  completedAssignments?: number;
  pendingAssignments?: number;
  overdueAssignments?: number;
}

// ============================================================================
// ASSIGNMENT TYPES
// ============================================================================

export type AssignmentStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'submitted'
  | 'overdue'
  | 'reassigned';

/**
 * Reviewer assignment for a protocol
 */
export interface ReviewerAssignment {
  id: string;
  protocolId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerCode: string;
  assessmentType: string;
  formType: AssessmentFormType;
  reviewStatus: AssignmentStatus;
  deadline: FirestoreDate;
  assignedAt: FirestoreDate;
  assignedBy: string;
  updatedAt?: FirestoreDate;
  
  // Completion tracking
  completedAt?: FirestoreDate;
  submittedAt?: FirestoreDate;
  
  // Reassignment tracking
  isReassigned?: boolean;
  reassignedAt?: FirestoreDate;
  reassignedFrom?: string;
  reassignmentReason?: string;
}

/**
 * Protocol assigned to a reviewer
 */
export interface ReviewerProtocol extends BaseProtocol {
  // Assignment details
  assignment?: ReviewerAssignment;
  assignedAt?: FirestoreDate;
  deadline?: FirestoreDate;
  
  // Assessment details
  assessmentType?: string;
  formType?: AssessmentFormType;
  reviewStatus?: AssignmentStatus;
  
  // Completion tracking
  assessmentCompleted?: boolean;
  assessmentSubmitted?: boolean;
  submittedAt?: FirestoreDate;
  
  // For reassigned protocols
  wasReassigned?: boolean;
  reassignedAt?: FirestoreDate;
  previousReviewer?: string;
  reassignmentReason?: string;
  daysOverdue?: number;
}

// ============================================================================
// ASSESSMENT TYPES
// ============================================================================

/**
 * Assessment form data structure
 */
export interface ReviewerAssessment extends BaseAssessment {
  // Form completion tracking
  percentComplete?: number;
  sectionsCompleted?: string[];
  
  // Auto-save tracking
  autoSavedAt?: FirestoreDate;
  saveCount?: number;
  
  // Return tracking (if returned by chairperson)
  isReturned?: boolean;
  returnedAt?: FirestoreDate;
  returnReason?: string;
  returnedBy?: string;
}

// ============================================================================
// PROTOCOL DOCUMENT TYPES (Reviewer View)
// ============================================================================

/**
 * Document from reviewer perspective (read-only)
 */
export interface ReviewerDocument extends BaseDocument {
  // Review tracking
  reviewedAt?: FirestoreDate;
  reviewedBy?: string;
  chairpersonComment?: string;
  
  // Version tracking
  version?: number;
  isLatestVersion?: boolean;
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert raw data to ReviewerInfo
 */
export function toReviewerInfo(data: Record<string, unknown>): ReviewerInfo {
  return {
    id: data.id as string,
    code: data.code as string,
    name: data.name as string,
    email: data.email as string,
    role: (data.role as any) || 'Member',
    isActive: Boolean(data.isActive),
    expertise: data.expertise as string[] | undefined,
    createdAt: data.createdAt as FirestoreDate,
    updatedAt: data.updatedAt as FirestoreDate,
    institution: data.institution as string | undefined,
    position: data.position as string | undefined,
    contactNumber: data.contactNumber as string | undefined,
    totalAssignments: data.totalAssignments as number | undefined,
    completedAssignments: data.completedAssignments as number | undefined,
    pendingAssignments: data.pendingAssignments as number | undefined,
    overdueAssignments: data.overdueAssignments as number | undefined,
    ...data,
  };
}

/**
 * Convert raw data to ReviewerAssignment
 */
export function toReviewerAssignment(data: Record<string, unknown>): ReviewerAssignment {
  return {
    id: data.id as string,
    protocolId: data.protocolId as string,
    reviewerId: data.reviewerId as string,
    reviewerName: data.reviewerName as string,
    reviewerCode: data.reviewerCode as string,
    assessmentType: data.assessmentType as string,
    formType: (data.formType as AssessmentFormType) || 'protocol-review',
    reviewStatus: (data.reviewStatus as AssignmentStatus) || 'pending',
    deadline: data.deadline as FirestoreDate,
    assignedAt: data.assignedAt as FirestoreDate,
    assignedBy: data.assignedBy as string,
    updatedAt: data.updatedAt as FirestoreDate,
    completedAt: data.completedAt as FirestoreDate,
    submittedAt: data.submittedAt as FirestoreDate,
    isReassigned: data.isReassigned as boolean | undefined,
    reassignedAt: data.reassignedAt as FirestoreDate,
    reassignedFrom: data.reassignedFrom as string | undefined,
    reassignmentReason: data.reassignmentReason as string | undefined,
    ...data,
  };
}

/**
 * Convert raw data to ReviewerProtocol
 */
export function toReviewerProtocol(data: Record<string, unknown>): ReviewerProtocol {
  return {
    id: data.id as string,
    applicationID: data.applicationID as string | undefined,
    tempProtocolCode: data.tempProtocolCode as string | undefined,
    spupCode: data.spupCode as string | undefined,
    title: data.title as string | undefined,
    status: (data.status as any) || 'pending',
    submitBy: data.submitBy as string,
    submittedByName: data.submittedByName as string | undefined,
    createdAt: data.createdAt as FirestoreDate,
    updatedAt: data.updatedAt as FirestoreDate,
    information: data.information as any,
    
    // Reviewer-specific
    assignedAt: data.assignedAt as FirestoreDate,
    deadline: data.deadline as FirestoreDate,
    assessmentType: data.assessmentType as string | undefined,
    formType: data.formType as AssessmentFormType | undefined,
    reviewStatus: (data.reviewStatus as AssignmentStatus) || 'pending',
    assessmentCompleted: data.assessmentCompleted as boolean | undefined,
    assessmentSubmitted: data.assessmentSubmitted as boolean | undefined,
    submittedAt: data.submittedAt as FirestoreDate,
    wasReassigned: data.wasReassigned as boolean | undefined,
    reassignedAt: data.reassignedAt as FirestoreDate,
    previousReviewer: data.previousReviewer as string | undefined,
    reassignmentReason: data.reassignmentReason as string | undefined,
    daysOverdue: data.daysOverdue as number | undefined,
    
    ...data,
  };
}

/**
 * Convert raw data to ReviewerAssessment
 */
export function toReviewerAssessment(data: Record<string, unknown>): ReviewerAssessment {
  return {
    id: data.id as string | undefined,
    protocolId: data.protocolId as string,
    reviewerId: data.reviewerId as string,
    reviewerName: data.reviewerName as string,
    formType: (data.formType as AssessmentFormType) || 'protocol-review',
    status: (data.status as AssessmentStatus) || 'draft',
    formData: (data.formData as Record<string, unknown>) || {},
    submittedAt: data.submittedAt as FirestoreDate,
    lastSavedAt: data.lastSavedAt as FirestoreDate,
    createdAt: data.createdAt as FirestoreDate,
    updatedAt: data.updatedAt as FirestoreDate,
    
    // Reviewer-specific
    percentComplete: data.percentComplete as number | undefined,
    sectionsCompleted: data.sectionsCompleted as string[] | undefined,
    autoSavedAt: data.autoSavedAt as FirestoreDate,
    saveCount: data.saveCount as number | undefined,
    isReturned: data.isReturned as boolean | undefined,
    returnedAt: data.returnedAt as FirestoreDate,
    returnReason: data.returnReason as string | undefined,
    returnedBy: data.returnedBy as string | undefined,
    
    ...data,
  };
}

/**
 * Convert raw data to ReviewerDocument
 */
export function toReviewerDocument(data: Record<string, unknown>): ReviewerDocument {
  return {
    id: data.id as string,
    title: data.title as string,
    description: data.description as string,
    fileName: data.fileName as string,
    fileType: data.fileType as string,
    fileSize: data.fileSize as number | undefined,
    status: (data.status as any) || 'pending',
    currentStatus: data.currentStatus as any,
    storagePath: data.storagePath as string | undefined,
    downloadURL: data.downloadURL as string | undefined,
    uploadedAt: data.uploadedAt as FirestoreDate,
    uploadedBy: data.uploadedBy as string | undefined,
    category: data.category as any,
    
    // Reviewer-specific (read-only)
    reviewedAt: data.reviewedAt as FirestoreDate,
    reviewedBy: data.reviewedBy as string | undefined,
    chairpersonComment: data.chairpersonComment as string | undefined,
    version: data.version as number | undefined,
    isLatestVersion: data.isLatestVersion as boolean | undefined,
    
    ...data,
  };
}

// ============================================================================
// FILTERING UTILITIES
// ============================================================================

/**
 * Filter protocols by assignment status
 */
export function filterByAssignmentStatus(
  protocols: ReviewerProtocol[],
  status: AssignmentStatus | AssignmentStatus[]
): ReviewerProtocol[] {
  const statuses = Array.isArray(status) ? status : [status];
  return protocols.filter(p => p.reviewStatus && statuses.includes(p.reviewStatus));
}

/**
 * Get overdue protocols
 */
export function getOverdueProtocols(protocols: ReviewerProtocol[]): ReviewerProtocol[] {
  const now = new Date();
  return protocols.filter(p => {
    if (!p.deadline || p.reviewStatus === 'completed') return false;
    return toDate(p.deadline) < now;
  });
}

/**
 * Get protocols due soon (within X days)
 */
export function getProtocolsDueSoon(protocols: ReviewerProtocol[], days: number = 3): ReviewerProtocol[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return protocols.filter(p => {
    if (!p.deadline || p.reviewStatus === 'completed') return false;
    const deadline = toDate(p.deadline);
    return deadline >= now && deadline <= futureDate;
  });
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

/**
 * Sort protocols by deadline (soonest first)
 */
export function sortProtocolsByDeadline(protocols: ReviewerProtocol[]): ReviewerProtocol[] {
  return sortByDate(protocols, 'deadline', 'asc');
}

/**
 * Sort assignments by deadline (soonest first)
 */
export function sortAssignmentsByDeadline(assignments: ReviewerAssignment[]): ReviewerAssignment[] {
  return sortByDate(assignments, 'deadline', 'asc');
}

// ============================================================================
// DEADLINE UTILITIES
// ============================================================================

/**
 * Calculate days remaining until deadline
 */
export function getDaysRemaining(deadline: FirestoreDate): number {
  const deadlineDate = toDate(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if assignment is overdue
 */
export function isOverdue(assignment: ReviewerAssignment): boolean {
  if (assignment.reviewStatus === 'completed') return false;
  return getDaysRemaining(assignment.deadline) < 0;
}

/**
 * Get days overdue (returns 0 if not overdue)
 */
export function getDaysOverdue(deadline: FirestoreDate): number {
  const remaining = getDaysRemaining(deadline);
  return remaining < 0 ? Math.abs(remaining) : 0;
}

/**
 * Format deadline status for display
 */
export function formatDeadlineStatus(deadline: FirestoreDate, status: AssignmentStatus): string {
  if (status === 'completed' || status === 'submitted') {
    return 'Completed';
  }

  const daysRemaining = getDaysRemaining(deadline);
  
  if (daysRemaining < 0) {
    return `${Math.abs(daysRemaining)} days overdue`;
  }
  
  if (daysRemaining === 0) {
    return 'Due today';
  }
  
  if (daysRemaining === 1) {
    return 'Due tomorrow';
  }
  
  return `${daysRemaining} days remaining`;
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export interface ReviewerDashboardStats {
  totalAssigned: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueSoon: number; // Due within 3 days
}

/**
 * Calculate reviewer dashboard statistics
 */
export function calculateReviewerStats(protocols: ReviewerProtocol[]): ReviewerDashboardStats {
  const overdue = getOverdueProtocols(protocols);
  const dueSoon = getProtocolsDueSoon(protocols, 3);

  return {
    totalAssigned: protocols.length,
    pending: protocols.filter(p => p.reviewStatus === 'pending').length,
    inProgress: protocols.filter(p => p.reviewStatus === 'in-progress').length,
    completed: protocols.filter(p => p.reviewStatus === 'completed').length,
    overdue: overdue.length,
    dueSoon: dueSoon.length,
  };
}

// ============================================================================
// ASSESSMENT FORM HELPERS
// ============================================================================

/**
 * Map assessment type to form type
 */
export function mapAssessmentToFormType(assessmentType: string): AssessmentFormType {
  const mapping: Record<string, AssessmentFormType> = {
    'Protocol Review Assessment': 'protocol-review',
    'Informed Consent Assessment': 'informed-consent',
    'IACUC Protocol Review Assessment': 'iacuc-review',
    'Checklist for Exemption Form Review': 'exemption-checklist',
  };

  return (mapping[assessmentType] as AssessmentFormType) || 'protocol-review';
}

/**
 * Get form display name
 */
export function getFormDisplayName(formType: AssessmentFormType): string {
  const names: Record<AssessmentFormType, string> = {
    'protocol-review': 'Protocol Review Assessment',
    'informed-consent': 'Informed Consent Assessment',
    'iacuc-review': 'IACUC Protocol Review',
    'exemption-checklist': 'Exemption Checklist',
  };

  return names[formType] || 'Assessment Form';
}

// ============================================================================
// ARRAY CONVERSION UTILITIES
// ============================================================================

export function toReviewerProtocols(data: Record<string, unknown>[]): ReviewerProtocol[] {
  return data.map(toReviewerProtocol);
}

export function toReviewerAssignments(data: Record<string, unknown>[]): ReviewerAssignment[] {
  return data.map(toReviewerAssignment);
}

export function toReviewerAssessments(data: Record<string, unknown>[]): ReviewerAssessment[] {
  return data.map(toReviewerAssessment);
}

export function toReviewerDocuments(data: Record<string, unknown>[]): ReviewerDocument[] {
  return data.map(toReviewerDocument);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if assessment is complete enough to submit
 */
export function canSubmitAssessment(assessment: ReviewerAssessment): boolean {
  // Add your validation logic here
  return Boolean(
    assessment.formData &&
    Object.keys(assessment.formData).length > 0 &&
    assessment.status !== 'submitted'
  );
}

/**
 * Check if protocol can be reviewed
 */
export function canReviewProtocol(protocol: ReviewerProtocol): boolean {
  return Boolean(
    protocol.reviewStatus === 'pending' ||
    protocol.reviewStatus === 'in-progress'
  );
}

