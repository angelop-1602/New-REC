/**
 * PROPONENT TYPES
 * Enhanced type definitions specific to the Proponent module
 * Extends common.types.ts for consistency
 */

import {
  BaseProtocol,
  BaseDocument,
  DocumentsType,
  FirestoreDate,
  DecisionDetails,
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
// PROPONENT-SPECIFIC PROTOCOL TYPES
// ============================================================================

/**
 * Protocol/Submission from proponent perspective
 * Includes submission tracking, draft management, and decision info
 */
export interface ProponentSubmission extends BaseProtocol {
  // Proponent-specific fields
  isDraft?: boolean;
  lastEditedAt?: FirestoreDate;
  submittedAt?: FirestoreDate;
  
  // Review tracking (read-only for proponent)
  hasReviewers?: boolean;
  reviewersAssigned?: number;
  reviewsCompleted?: number;
  
  // Decision information (read-only for proponent)
  decision?: string;
  decisionDetails?: DecisionDetails;
  decisionDate?: FirestoreDate;
  
  // Document completion tracking
  documentsComplete?: boolean;
  documentsAccepted?: number;
  documentsPending?: number;
  documentsRejected?: number;
  
  // Progress tracking (for approved protocols)
  progressReports?: ProponentProgressReport[];
  finalReport?: ProponentFinalReport;
  
  // Collection marker for backward compatibility
  collection?: string;
  
  // Documents array
  documents?: DocumentsType[];
}

/**
 * Progress report submitted by proponent
 */
export interface ProponentProgressReport {
  id?: string;
  reportNumber: number;
  reportDate: FirestoreDate;
  formUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt?: FirestoreDate;
  reviewedAt?: FirestoreDate;
  comments?: string;
}

/**
 * Final report submitted by proponent
 */
export interface ProponentFinalReport {
  id?: string;
  submittedDate: FirestoreDate;
  formUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: FirestoreDate;
  comments?: string;
}

/**
 * Document from proponent perspective
 * Includes upload tracking and review feedback
 */
export interface ProponentDocument extends BaseDocument {
  // Proponent-specific fields
  isRequired?: boolean;
  requirementId?: string;
  
  // Review feedback (read-only for proponent)
  reviewedAt?: FirestoreDate;
  reviewedBy?: string;
  reviewerName?: string;
  chairpersonComment?: string;
  rejectionReason?: string;
  
  // Versioning
  version?: number;
  previousVersions?: string[];
  
  // Request tracking (if document was requested)
  wasRequested?: boolean;
  requestId?: string;
  requestReason?: string;
  requestDate?: FirestoreDate;
}

// ============================================================================
// PROPONENT DASHBOARD TYPES
// ============================================================================

/**
 * Dashboard statistics for proponent
 */
export interface ProponentDashboardStats {
  totalSubmissions: number;
  pendingSubmissions: number;
  underReviewSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
}

/**
 * Submission card display data for dashboard
 */
export interface SubmissionCardData {
  id: string;
  title: string;
  code: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  submittedDate: string;
  lastUpdated: string;
  hasDecision: boolean;
  decision?: string;
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert raw Firestore data to ProponentSubmission
 */
export function toProponentSubmission(data: Record<string, unknown>): ProponentSubmission {
  return {
    id: data.id as string,
    applicationID: data.applicationID as string | undefined,
    tempProtocolCode: data.tempProtocolCode as string | undefined,
    spupCode: data.spupCode as string | undefined,
    title: data.title as string | undefined,
    status: ((data.status as string) || 'draft') as ProtocolStatus,
    submitBy: data.submitBy as string,
    submittedByName: data.submittedByName as string | undefined,
    createdAt: data.createdAt as FirestoreDate,
    updatedAt: data.updatedAt as FirestoreDate,
    information: data.information as any,
    
    // Proponent-specific
    isDraft: data.isDraft as boolean | undefined,
    lastEditedAt: data.lastEditedAt as FirestoreDate,
    submittedAt: data.submittedAt as FirestoreDate,
    hasReviewers: data.hasReviewers as boolean | undefined,
    decision: data.decision as string | undefined,
    decisionDetails: data.decisionDetails as DecisionDetails | undefined,
    decisionDate: data.decisionDate as FirestoreDate,
    collection: (data.collection as string) || data.status as string,
    
    ...data,
  };
}

/**
 * Convert array of raw data to typed submissions
 */
export function toProponentSubmissions(data: Record<string, unknown>[]): ProponentSubmission[] {
  return data.map(toProponentSubmission);
}

/**
 * Convert raw document data to ProponentDocument
 */
export function toProponentDocument(data: Record<string, unknown>): ProponentDocument {
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
    
    // Proponent-specific
    isRequired: data.isRequired as boolean | undefined,
    requirementId: data.requirementId as string | undefined,
    reviewedAt: data.reviewedAt as FirestoreDate,
    reviewedBy: data.reviewedBy as string | undefined,
    reviewerName: data.reviewerName as string | undefined,
    chairpersonComment: data.chairpersonComment as string | undefined,
    version: data.version as number | undefined,
    wasRequested: data.wasRequested as boolean | undefined,
    requestId: data.requestId as string | undefined,
    
    ...data,
  };
}

/**
 * Convert array of raw data to typed documents
 */
export function toProponentDocuments(data: Record<string, unknown>[]): ProponentDocument[] {
  return data.map(toProponentDocument);
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

/**
 * Sort submissions by creation date (most recent first)
 */
export function sortSubmissionsByDate(submissions: ProponentSubmission[]): ProponentSubmission[] {
  return sortByDate(submissions, 'createdAt', 'desc');
}

/**
 * Sort submissions by status priority
 */
export function sortSubmissionsByPriority(submissions: ProponentSubmission[]): ProponentSubmission[] {
  const priorityOrder: Record<string, number> = {
    'pending': 1,
    'draft': 2,
    'submitted': 3,
    'accepted': 4,
    'under_review': 5,
    'approved': 6,
    'archived': 7,
  };

  return [...submissions].sort((a, b) => {
    const priorityA = priorityOrder[a.status] || 999;
    const priorityB = priorityOrder[b.status] || 999;
    return priorityA - priorityB;
  });
}

// ============================================================================
// DASHBOARD UTILITIES
// ============================================================================

/**
 * Calculate dashboard statistics from submissions
 */
export function calculateDashboardStats(submissions: ProponentSubmission[]): ProponentDashboardStats {
  return {
    totalSubmissions: submissions.length,
    pendingSubmissions: submissions.filter(s => ['pending', 'draft', 'submitted'].includes(s.status)).length,
    underReviewSubmissions: submissions.filter(s => ['accepted', 'under_review'].includes(s.status)).length,
    approvedSubmissions: submissions.filter(s => s.status === 'approved').length,
    rejectedSubmissions: submissions.filter(s => s.status === 'disapproved').length,
  };
}

/**
 * Convert submission to card display data
 */
export function toSubmissionCardData(submission: ProponentSubmission): SubmissionCardData {
  return {
    id: submission.id,
    title: getProtocolTitle(submission),
    code: getProtocolCode(submission),
    status: submission.status,
    statusLabel: submission.status.replace(/_/g, ' ').toUpperCase(),
    statusColor: getStatusColor(submission.status),
    submittedDate: toLocaleDateString(submission.createdAt),
    lastUpdated: toLocaleDateString(submission.updatedAt || submission.createdAt),
    hasDecision: Boolean(submission.decision || submission.decisionDetails?.decision),
    decision: submission.decision || submission.decisionDetails?.decision,
  };
}

/**
 * Get status color for UI display
 */
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'draft': 'gray',
    'pending': 'yellow',
    'submitted': 'blue',
    'accepted': 'cyan',
    'under_review': 'purple',
    'approved': 'green',
    'disapproved': 'red',
    'archived': 'gray',
  };
  return colorMap[status] || 'gray';
}

