/**
 * CHAIRPERSON TYPES
 * Enhanced type definitions specific to the Chairperson module
 * Extends common.types.ts for consistency
 */

import {
  BaseProtocol,
  BaseDocument,
  BaseAssessment,
  FirestoreDate,
  DecisionDetails,
  DecisionType,
  DocumentStatus,
  ProtocolStatus,
  toDate,
  toISOString,
  toLocaleDateString,
  getProtocolTitle,
  getProtocolCode,
  getPIName,
  sortByDate,
  searchProtocols,
  filterByStatus,
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
  searchProtocols,
  filterByStatus,
};

// ============================================================================
// CHAIRPERSON-SPECIFIC PROTOCOL TYPES
// ============================================================================

/**
 * Protocol from chairperson perspective
 * Includes full administrative controls and review management
 */
export interface ChairpersonProtocol extends BaseProtocol {
  // Research categorization
  researchType?: string;
  reviewType?: string;
  
  // Decision tracking
  decision?: string;
  decisionDetails?: DecisionDetails;
  decisionDate?: FirestoreDate;
  
  // Reviewer management
  hasReviewers?: boolean;
  assignedReviewers?: ChairpersonReviewerAssignment[];
  totalReviewers?: number;
  completedReviews?: number;
  pendingReviews?: number;
  
  // Document management
  documentsComplete?: boolean;
  documentsAccepted?: number;
  documentsPending?: number;
  documentsRequested?: number;
  
  // Administrative
  chairNotes?: string;
  priority?: 'high' | 'normal' | 'low';
  
  // Collection marker
  collection?: string;
  
  // Date tracking
  approvedAt?: FirestoreDate;
  archivedAt?: FirestoreDate;
  approvalValidUntil?: FirestoreDate;
  estimatedCompletionDate?: FirestoreDate;
  acceptedAt?: FirestoreDate;
  
  // Deadlines tracking
  deadlines?: Array<{
    type?: string;
    dueDate?: FirestoreDate;
    status?: string;
    [key: string]: unknown;
  }>;
}

// ============================================================================
// REVIEWER MANAGEMENT TYPES
// ============================================================================

/**
 * Reviewer information from chairperson perspective
 */
export interface ChairpersonReviewerData {
  id: string;
  code: string;
  name: string;
  email: string;
  role: 'Chairperson' | 'Vice Chairperson' | 'Member' | 'Secretary';
  isActive: boolean;
  expertise?: string[];
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
  
  // Additional fields
  institution?: string;
  position?: string;
  contactNumber?: string;
  
  // Assignment tracking (chairperson view)
  currentAssignments?: number;
  totalAssignedProtocols?: number;
  completedAssignments?: number;
  overdueAssignments?: number;
  averageReviewTime?: number; // In days
}

/**
 * Reviewer assignment from chairperson perspective
 */
export interface ChairpersonReviewerAssignment {
  id: string;
  protocolId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerCode?: string;
  assessmentType: string;
  formType?: string;
  reviewStatus: 'pending' | 'in-progress' | 'completed' | 'submitted' | 'overdue';
  deadline: FirestoreDate;
  assignedAt: FirestoreDate;
  assignedBy: string;
  updatedAt?: FirestoreDate;
  
  // Completion tracking
  completedAt?: FirestoreDate;
  submittedAt?: FirestoreDate;
  
  // Assessment data
  hasAssessment?: boolean;
  assessmentStatus?: string;
  
  // Reassignment tracking
  isReassigned?: boolean;
  reassignedAt?: FirestoreDate;
  reassignedFrom?: string;
  reassignmentReason?: string;
  daysOverdue?: number;
}

/**
 * Aggregated assessment results for a protocol
 */
export interface ProtocolAssessmentsResult {
  protocolId: string;
  totalAssigned: number;
  totalCompleted: number;
  totalPending: number;
  allCompleted: boolean;
  assessments: ChairpersonAssessmentSummary[];
}

/**
 * Assessment summary for chairperson view
 */
export interface ChairpersonAssessmentSummary {
  id?: string;
  reviewerId: string;
  reviewerName: string;
  formType: string;
  status: string;
  submittedAt?: FirestoreDate;
  formData?: Record<string, unknown>;
}

// ============================================================================
// DOCUMENT MANAGEMENT TYPES
// ============================================================================

/**
 * Document from chairperson perspective
 * Includes review controls and status management
 */
export interface ChairpersonDocument extends BaseDocument {
  // Review controls
  reviewedAt?: FirestoreDate;
  reviewedBy?: string;
  chairpersonComment?: string;
  
  // Request tracking
  wasRequested?: boolean;
  requestId?: string;
  requestedBy?: string;
  requestDate?: FirestoreDate;
  requestReason?: string;
  urgent?: boolean;
  
  // Version tracking
  version?: number;
  versionHistory?: DocumentVersion[];
}

export interface DocumentVersion {
  version: number;
  uploadedAt: FirestoreDate;
  uploadedBy: string;
  status: string;
  chairpersonComment?: string;
  reviewedBy?: string;
  reviewedAt?: FirestoreDate;
}

/**
 * Enhanced document with full management capabilities
 */
export interface EnhancedDocument extends ChairpersonDocument {
  currentVersion: number;
  currentStatus?: DocumentStatus;
  requestMetadata?: {
    urgent: boolean;
    dueDate: string | null;
    requestedAt: string;
    requestedBy: string;
  };
}

/**
 * Document request created by chairperson
 */
export interface DocumentRequest {
  id: string;
  protocolId: string;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: FirestoreDate;
  urgent?: boolean;
  dueDate?: FirestoreDate;
  status: 'pending' | 'fulfilled' | 'cancelled';
  fulfilledAt?: FirestoreDate;
  fulfilledDocumentId?: string;
}

// ============================================================================
// DECISION MANAGEMENT TYPES
// ============================================================================

/**
 * Decision data managed by chairperson
 */
export interface ChairpersonDecision {
  id: string;
  protocolId: string;
  decision: DecisionType;
  decisionDate: FirestoreDate;
  decisionBy: string;
  decisionByName?: string;
  comments?: string;
  conditions?: string[];
  
  // Generated documents
  documents?: {
    certificate?: string;
    notification?: string;
    others?: string[];
  };
  
  // Approval details (for approved decisions)
  approvalValidUntil?: FirestoreDate;
  approvalConditions?: string[];
  
  // Rejection details (for disapproved decisions)
  rejectionReasons?: string[];
  appealDeadline?: FirestoreDate;
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert raw Firestore data to ChairpersonProtocol
 */
export function toChairpersonProtocol(data: Record<string, unknown>): ChairpersonProtocol {
  return {
    id: data.id as string,
    applicationID: data.applicationID as string | undefined,
    tempProtocolCode: data.tempProtocolCode as string | undefined,
    spupCode: data.spupCode as string | undefined,
    title: data.title as string | undefined,
    status: ((data.status as string) || 'pending') as ProtocolStatus,
    submitBy: data.submitBy as string,
    submittedByName: data.submittedByName as string | undefined,
    createdAt: data.createdAt as FirestoreDate,
    updatedAt: data.updatedAt as FirestoreDate,
    information: data.information as any,
    
    // Chairperson-specific
    researchType: data.researchType as string | undefined,
    reviewType: data.reviewType as string | undefined,
    decision: data.decision as string | undefined,
    decisionDetails: data.decisionDetails as DecisionDetails | undefined,
    decisionDate: data.decisionDate as FirestoreDate,
    hasReviewers: data.hasReviewers as boolean | undefined,
    chairNotes: data.chairNotes as string | undefined,
    priority: data.priority as any,
    collection: (data.collection as string) || data.status as string,
    
    ...data,
  };
}

/**
 * Convert raw data to ChairpersonReviewerData
 */
export function toChairpersonReviewerData(data: Record<string, unknown>): ChairpersonReviewerData {
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
    currentAssignments: data.currentAssignments as number | undefined,
    totalAssignedProtocols: data.totalAssignedProtocols as number | undefined,
    completedAssignments: data.completedAssignments as number | undefined,
    overdueAssignments: data.overdueAssignments as number | undefined,
    averageReviewTime: data.averageReviewTime as number | undefined,
    ...data,
  };
}

/**
 * Convert raw data to ChairpersonReviewerAssignment
 */
export function toChairpersonReviewerAssignment(data: Record<string, unknown>): ChairpersonReviewerAssignment {
  return {
    id: data.id as string,
    protocolId: data.protocolId as string,
    reviewerId: data.reviewerId as string,
    reviewerName: data.reviewerName as string,
    reviewerCode: data.reviewerCode as string | undefined,
    assessmentType: data.assessmentType as string,
    formType: data.formType as string | undefined,
    reviewStatus: (data.reviewStatus as any) || 'pending',
    deadline: data.deadline as FirestoreDate,
    assignedAt: data.assignedAt as FirestoreDate,
    assignedBy: data.assignedBy as string,
    updatedAt: data.updatedAt as FirestoreDate,
    completedAt: data.completedAt as FirestoreDate,
    submittedAt: data.submittedAt as FirestoreDate,
    hasAssessment: data.hasAssessment as boolean | undefined,
    assessmentStatus: data.assessmentStatus as string | undefined,
    isReassigned: data.isReassigned as boolean | undefined,
    reassignedAt: data.reassignedAt as FirestoreDate,
    reassignedFrom: data.reassignedFrom as string | undefined,
    reassignmentReason: data.reassignmentReason as string | undefined,
    daysOverdue: data.daysOverdue as number | undefined,
    ...data,
  };
}

/**
 * Convert raw data to ChairpersonDocument
 */
export function toChairpersonDocument(data: Record<string, unknown>): ChairpersonDocument {
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
    
    // Chairperson-specific
    reviewedAt: data.reviewedAt as FirestoreDate,
    reviewedBy: data.reviewedBy as string | undefined,
    chairpersonComment: data.chairpersonComment as string | undefined,
    wasRequested: data.wasRequested as boolean | undefined,
    requestId: data.requestId as string | undefined,
    requestedBy: data.requestedBy as string | undefined,
    requestDate: data.requestDate as FirestoreDate,
    requestReason: data.requestReason as string | undefined,
    urgent: data.urgent as boolean | undefined,
    version: data.version as number | undefined,
    
    ...data,
  };
}

// ============================================================================
// ARRAY CONVERSION UTILITIES
// ============================================================================

export function toChairpersonProtocols(data: Record<string, unknown>[]): ChairpersonProtocol[] {
  return data.map(toChairpersonProtocol);
}

export function toChairpersonReviewers(data: Record<string, unknown>[]): ChairpersonReviewerData[] {
  return data.map(toChairpersonReviewerData);
}

export function toChairpersonReviewerAssignments(data: Record<string, unknown>[]): ChairpersonReviewerAssignment[] {
  return data.map(toChairpersonReviewerAssignment);
}

export function toChairpersonDocuments(data: Record<string, unknown>[]): ChairpersonDocument[] {
  return data.map(toChairpersonDocument);
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

/**
 * Sort protocols by creation date (most recent first)
 */
export function sortProtocolsByDate(protocols: ChairpersonProtocol[]): ChairpersonProtocol[] {
  return sortByDate(protocols, 'createdAt', 'desc');
}

/**
 * Sort assignments by deadline (soonest first)
 */
export function sortChairpersonAssignmentsByDeadline(assignments: ChairpersonReviewerAssignment[]): ChairpersonReviewerAssignment[] {
  return sortByDate(assignments, 'deadline', 'asc');
}

/**
 * Sort reviewers by name
 */
export function sortReviewersByName(reviewers: ChairpersonReviewerData[]): ChairpersonReviewerData[] {
  return [...reviewers].sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================================================
// FILTERING UTILITIES
// ============================================================================

/**
 * Filter protocols with reviewers assigned
 */
export function filterProtocolsWithReviewers(protocols: ChairpersonProtocol[]): ChairpersonProtocol[] {
  return protocols.filter(p => p.hasReviewers || (p.assignedReviewers && p.assignedReviewers.length > 0));
}

/**
 * Filter active reviewers
 */
export function filterActiveReviewers(reviewers: ChairpersonReviewerData[]): ChairpersonReviewerData[] {
  return reviewers.filter(r => r.isActive);
}

/**
 * Filter overdue assignments
 */
export function filterOverdueAssignments(assignments: ChairpersonReviewerAssignment[]): ChairpersonReviewerAssignment[] {
  const now = new Date();
  return assignments.filter(a => {
    if (a.reviewStatus === 'completed') return false;
    return toDate(a.deadline) < now;
  });
}

/**
 * Filter documents by status
 */
export function filterDocumentsByStatus(
  documents: ChairpersonDocument[],
  status: string | string[]
): ChairpersonDocument[] {
  const statuses = Array.isArray(status) ? status : [status];
  return documents.filter(d => {
    const docStatus = d.currentStatus || d.status;
    return statuses.includes(docStatus);
  });
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if protocol is ready for acceptance
 */
export function canAcceptProtocol(protocol: ChairpersonProtocol): boolean {
  return protocol.status === 'pending' || protocol.status === 'submitted';
}

/**
 * Check if protocol is ready for decision
 */
export function canMakeDecision(protocol: ChairpersonProtocol): boolean {
  return Boolean(
    protocol.hasReviewers &&
    protocol.completedReviews &&
    protocol.totalReviewers &&
    protocol.completedReviews >= protocol.totalReviewers
  );
}

/**
 * Check if all documents are accepted
 */
export function areAllDocumentsAccepted(documents: ChairpersonDocument[]): boolean {
  if (documents.length === 0) return false;
  return documents.every(d => {
    const status = d.currentStatus || d.status;
    return status === 'accepted';
  });
}

/**
 * Check if protocol can be approved
 */
export function canApproveProtocol(
  protocol: ChairpersonProtocol,
  documents: ChairpersonDocument[]
): boolean {
  return (
    canMakeDecision(protocol) &&
    areAllDocumentsAccepted(documents) &&
    documents.length > 0
  );
}

// ============================================================================
// STATISTICS UTILITIES
// ============================================================================

/**
 * Calculate protocol statistics for chairperson dashboard
 */
export interface ChairpersonDashboardStats {
  totalProtocols: number;
  pendingReview: number;
  underReview: number;
  awaitingDecision: number;
  approved: number;
  archived: number;
}

export function calculateChairpersonStats(protocols: ChairpersonProtocol[]): ChairpersonDashboardStats {
  return {
    totalProtocols: protocols.length,
    pendingReview: protocols.filter(p => ['pending', 'submitted'].includes(p.status)).length,
    underReview: protocols.filter(p => ['accepted', 'under_review'].includes(p.status)).length,
    awaitingDecision: protocols.filter(p => canMakeDecision(p) && p.status !== 'approved').length,
    approved: protocols.filter(p => p.status === 'approved').length,
    archived: protocols.filter(p => p.status === 'archived').length,
  };
}

/**
 * Calculate reviewer workload statistics
 */
export interface ReviewerWorkloadStats {
  totalReviewers: number;
  activeReviewers: number;
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  averageWorkload: number; // Assignments per active reviewer
}

export function calculateReviewerWorkload(
  reviewers: ChairpersonReviewerData[],
  assignments: ChairpersonReviewerAssignment[]
): ReviewerWorkloadStats {
  const activeReviewers = reviewers.filter(r => r.isActive);
  const overdue = filterOverdueAssignments(assignments);

  return {
    totalReviewers: reviewers.length,
    activeReviewers: activeReviewers.length,
    totalAssignments: assignments.length,
    completedAssignments: assignments.filter(a => a.reviewStatus === 'completed').length,
    overdueAssignments: overdue.length,
    averageWorkload: activeReviewers.length > 0 
      ? Math.round(assignments.length / activeReviewers.length) 
      : 0,
  };
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Get document acceptance rate for a protocol
 */
export function getDocumentAcceptanceRate(documents: ChairpersonDocument[]): number {
  if (documents.length === 0) return 0;
  const accepted = documents.filter(d => (d.currentStatus || d.status) === 'accepted').length;
  return Math.round((accepted / documents.length) * 100);
}

/**
 * Get review completion rate for a protocol
 */
export function getReviewCompletionRate(protocol: ChairpersonProtocol): number {
  if (!protocol.totalReviewers || protocol.totalReviewers === 0) return 0;
  const completed = protocol.completedReviews || 0;
  return Math.round((completed / protocol.totalReviewers) * 100);
}

/**
 * Check if assignment is overdue
 */
export function isAssignmentOverdue(assignment: ChairpersonReviewerAssignment): boolean {
  if (assignment.reviewStatus === 'completed') return false;
  return toDate(assignment.deadline) < new Date();
}

/**
 * Get days until deadline
 */
export function getDaysUntilDeadline(deadline: FirestoreDate): number {
  const deadlineDate = toDate(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

