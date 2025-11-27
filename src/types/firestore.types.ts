// ===========================
// FIRESTORE DOCUMENT STRUCTURES
// ===========================

import { Timestamp } from "firebase/firestore";
import { InformationType } from "./information.types";
import { DocumentsType } from "./documents.types";
import { 
  PendingSubmission, 
  AcceptedSubmission, 
  ApprovedSubmission, 
  ArchivedSubmission 
} from "./submissions.types";

// ===========================
// FIRESTORE TIMESTAMP VARIANTS
// ===========================

// Convert string timestamps to Firestore Timestamps for database storage
type WithFirestoreTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt' | 'assignedAt' | 'reviewStarted' | 'approvedAt' | 'completedAt' | 'estimatedCompletionDate' | 'approvalValidUntil'> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  assignedAt?: Timestamp;
  reviewStarted?: Timestamp;
  approvedAt?: Timestamp;
  completedAt?: Timestamp;
  estimatedCompletionDate?: Timestamp;
  approvalValidUntil?: Timestamp;
};

// ===========================
// COLLECTION DOCUMENT INTERFACES
// ===========================

// 1. Pending Submissions Collection Document
export interface PendingSubmissionDoc extends WithFirestoreTimestamps<PendingSubmission> {
  information: InformationType;    // Complete form data
  // documents removed - stored only in subcollection
}

// 2. Accepted Submissions Collection Document  
export interface AcceptedSubmissionDoc extends WithFirestoreTimestamps<AcceptedSubmission> {
  information: InformationType;
  // documents removed - stored only in subcollection
  
  // ENHANCED REVIEW PROGRESS WITH MISSING FIELDS
  reviewProgress?: {
    assignedReviewers: string[];   // Reviewer user IDs
    reviewForms?: Array<{          // Review form responses
      reviewerId: string;
      formId: string;
      responses: Record<string, any>;
      submittedAt: Timestamp;
    }>;
    chairDecision?: {
      decision: "approve" | "reject" | "revise";
      notes: string;
      decidedAt: Timestamp;
    };
    // NEW FIELDS FOR COMPREHENSIVE TRACKING
    totalReviewers: number;
    completedReviews: number;
    pendingReviews: number;
    overdueReviews: number;
    averageReviewTime?: number; // In hours
    lastReviewActivity?: string; // ISO timestamp string
  };
}

// 3. Approved Submissions Collection Document
export interface ApprovedSubmissionDoc extends WithFirestoreTimestamps<ApprovedSubmission> {
  information: InformationType;
  // documents removed - stored only in subcollection
  approvalDocuments: DocumentsType[];  // Certificates, approval letters
  progressReports?: Array<{
    reportId: string;
    submittedAt: Timestamp;
    status: "pending" | "approved" | "rejected";
    documents: DocumentsType[];
    reviewNotes?: string;
  }>;
  finalReport?: {
    reportId: string;
    submittedAt: Timestamp;
    status: "pending" | "approved" | "rejected";
    documents: DocumentsType[];
    reviewNotes?: string;
  };
  renewalRequests?: Array<{
    requestId: string;
    requestedAt: Timestamp;
    newEndDate: string;
    justification: string;
    status: "pending" | "approved" | "rejected";
    reviewNotes?: string;
  }>;
}

// 4. Archived Submissions Collection Document
export interface ArchivedSubmissionDoc extends WithFirestoreTimestamps<ArchivedSubmission> {
  information: InformationType;
  // documents removed - stored only in subcollection
  approvalDocuments: DocumentsType[];
  progressReports: Array<{
    reportId: string;
    submittedAt: Timestamp;
    status: "approved";  // Only approved reports in archive
    documents: DocumentsType[];
  }>;
  finalReport: {  // Required for archive
    reportId: string;
    submittedAt: Timestamp;
    status: "approved";
    documents: DocumentsType[];
  };
  completionCertificate?: DocumentsType;  // Generated completion certificate
}

// ===========================
// LEGACY FIRESTORE INTERFACE (for backward compatibility)
// ===========================

/**
 * Legacy SubmissionData interface - use specific collection document interfaces instead
 * @deprecated Use PendingSubmissionDoc, AcceptedSubmissionDoc, ApprovedSubmissionDoc, or ArchivedSubmissionDoc
 */
export interface SubmissionData {
  applicationID: string;
  protocolCode: string;
  title: string;
  submitBy: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  information: InformationType;
  documents?: DocumentsType[];
}

// ===========================
// UTILITY TYPES
// ===========================

// Union type for all Firestore document interfaces
export type AnySubmissionDoc = 
  | PendingSubmissionDoc 
  | AcceptedSubmissionDoc 
  | ApprovedSubmissionDoc 
  | ArchivedSubmissionDoc;

// Helper type to convert client-side submission to Firestore document
export type ToFirestoreDoc<T extends { createdAt: string; updatedAt: string }> = WithFirestoreTimestamps<T>;

// Helper type to convert Firestore document to client-side submission
export type FromFirestoreDoc<T extends { createdAt: Timestamp; updatedAt: Timestamp }> = Omit<T, 'createdAt' | 'updatedAt' | 'assignedAt' | 'reviewStarted' | 'approvedAt' | 'completedAt' | 'estimatedCompletionDate' | 'approvalValidUntil'> & {
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  reviewStarted?: string;
  approvedAt?: string;
  completedAt?: string;
  estimatedCompletionDate?: string;
  approvalValidUntil?: string;
};

// ===========================
// COLLECTION METADATA
// ===========================

export interface CollectionMetadata {
  name: string;
  description: string;
  indexes: string[];
  securityRules: string[];
}

export const COLLECTION_METADATA: Record<string, CollectionMetadata> = {
  submissions_pending: {
    name: 'submissions_pending',
    description: 'New submissions awaiting REC Chair assignment of SPUP code',
    indexes: ['status', 'createdAt', 'submitBy', 'priority'],
    securityRules: ['proponent_read_own', 'chair_full_access']
  },
  // @deprecated - Now using unified 'submissions' collection
  submissions_accepted: {
    name: 'submissions_accepted', 
    description: '[DEPRECATED] Use submissions collection with status field instead',
    indexes: ['status', 'assignedReviewers', 'reviewType', 'estimatedCompletionDate'],
    securityRules: ['proponent_read_own', 'reviewer_assigned_access', 'chair_full_access']
  },
  submissions_approved: {
    name: 'submissions_approved',
    description: 'Approved protocols during active research phase', 
    indexes: ['status', 'approvalValidUntil', 'submitBy'],
    securityRules: ['proponent_full_access', 'chair_read_access']
  },
  submissions_archived: {
    name: 'submissions_archived',
    description: 'Completed research protocols for record-keeping',
    indexes: ['completedAt', 'archiveReason', 'submitBy'],
    securityRules: ['proponent_read_own', 'chair_read_access', 'admin_full_access']
  }
}; 