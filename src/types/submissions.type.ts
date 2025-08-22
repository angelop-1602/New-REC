// ===========================
// SUBMISSION STATUS TYPES BY COLLECTION
// ===========================

// Status types for each collection stage
export type PendingSubmissionStatus = "pending";

export type AcceptedSubmissionStatus = 
  | "accepted" 
  | "under_review" 
  | "revision_requested";

export type ApprovedSubmissionStatus = 
  | "approved" 
  | "in_progress" 
  | "awaiting_progress_report" 
  | "awaiting_final_report";

export type ArchivedSubmissionStatus = 
  | "completed" 
  | "terminated" 
  | "expired";

// Combined status type for all stages
export type SubmissionStatus =
  | PendingSubmissionStatus
  | AcceptedSubmissionStatus  
  | ApprovedSubmissionStatus
  | ArchivedSubmissionStatus;

// Legacy statuses (for backward compatibility during migration)
export type LegacySubmissionStatus =
  | "draft"        // Maps to "pending"
  | "submitted"    // Maps to "pending" 
  | "under_review" // Maps to "under_review"
  | "revisions"    // Maps to "revision_requested"
  | "approved"     // Maps to "approved"
  | "rejected"     // Handled as terminated
  | "withdrawn";   // Maps to "terminated"

// ===========================
// SUBMISSION INTERFACES BY COLLECTION
// ===========================

// Base submission interface with common fields
interface BaseSubmission {
  applicationID: string;      // Unique identifier across all collections
  title: string;              // Protocol title
  submitBy: string;           // Proponent user ID
  createdBy: string;          // User who created (usually same as submitBy)
  createdAt: string;          // ISO timestamp when originally created
  updatedAt: string;          // ISO timestamp for last modification
}

// 1. Pending Submissions (submissions_pending)
export interface PendingSubmission extends BaseSubmission {
  tempProtocolCode: string;   // Temporary code until SPUP code assigned
  status: PendingSubmissionStatus;
  priority?: "high" | "normal";
}

// 2. Accepted Submissions (submissions_accepted)  
export interface AcceptedSubmission extends BaseSubmission {
  spupRecCode: string;        // Official SPUP REC code
  reviewType: "SR" | "Ex";    // Standard Review or Expedited
  status: AcceptedSubmissionStatus;
  assignedAt: string;         // When moved from pending
  reviewStarted?: string;     // When review officially began
  assignedReviewers?: string[]; // Reviewer user IDs
  chairNotes?: string;        // REC Chair notes
  estimatedCompletionDate?: string;
}

// 3. Approved Submissions (submissions_approved)
export interface ApprovedSubmission extends BaseSubmission {
  spupRecCode: string;
  status: ApprovedSubmissionStatus;
  approvedAt: string;         // Approval date
  approvalValidUntil: string; // Research end date
}

// 4. Archived Submissions (submissions_archived)
export interface ArchivedSubmission extends BaseSubmission {
  spupRecCode: string;
  status: ArchivedSubmissionStatus;
  approvedAt: string;         // Original approval date
  completedAt: string;        // When moved to archive
  archiveReason: "completed" | "terminated_by_researcher" | "terminated_by_rec" | "expired";
  finalNotes?: string;        // Final REC notes
}

// ===========================
// LEGACY SUBMISSION TYPE (for backward compatibility)
// ===========================

/**
 * Legacy submission interface - use specific collection interfaces instead
 * @deprecated Use PendingSubmission, AcceptedSubmission, ApprovedSubmission, or ArchivedSubmission
 */
export interface SubmissionsType extends BaseSubmission {
  protocolCode: string;       // Could be temp or SPUP code
  status: SubmissionStatus;   // Any valid status
}

// ===========================
// UTILITY TYPES
// ===========================

// Union type for all submission interfaces
export type AnySubmission = 
  | PendingSubmission 
  | AcceptedSubmission 
  | ApprovedSubmission 
  | ArchivedSubmission;

// Collection names
export const SUBMISSION_COLLECTIONS = {
  PENDING: 'submissions_pending',
  ACCEPTED: 'submissions_accepted', 
  APPROVED: 'submissions_approved',
  ARCHIVED: 'submissions_archived'
} as const;

// Status mapping for collection movement
export const STATUS_COLLECTION_MAP: Record<SubmissionStatus, keyof typeof SUBMISSION_COLLECTIONS> = {
  // Pending collection
  "pending": "PENDING",
  
  // Accepted collection  
  "accepted": "ACCEPTED",
  "under_review": "ACCEPTED",
  "revision_requested": "ACCEPTED",
  
  // Approved collection
  "approved": "APPROVED", 
  "in_progress": "APPROVED",
  "awaiting_progress_report": "APPROVED",
  "awaiting_final_report": "APPROVED",
  
  // Archived collection
  "completed": "ARCHIVED",
  "terminated": "ARCHIVED", 
  "expired": "ARCHIVED"
};

// Legacy status mapping (for migration)
export const LEGACY_STATUS_MAP: Record<LegacySubmissionStatus, SubmissionStatus> = {
  "draft": "pending",
  "submitted": "pending", 
  "under_review": "under_review",
  "revisions": "revision_requested",
  "approved": "approved",
  "rejected": "terminated",
  "withdrawn": "terminated"
};
  