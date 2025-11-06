// ===========================
// SUPPORTING INTERFACES FOR MISSING FIELDS
// ===========================

// Audit trail entry for tracking all actions
export interface AuditTrailEntry {
  action: string;           // "submitted", "accepted", "reviewer_assigned", "decision_made"
  performedBy: string;      // User ID who performed action
  performedByName: string;  // Display name for easy reference
  performedAt: string;      // ISO timestamp when action was performed
  details?: string;         // Additional details about the action
  previousStatus?: string;  // Previous status before change
  newStatus?: string;       // New status after change
}

// Notification entry for communication tracking
export interface NotificationEntry {
  sentTo: string[];         // User IDs who received notifications
  notificationType: string; // "email", "sms", "in_app"
  sentAt: string;           // ISO timestamp when notification was sent
  status: "sent" | "delivered" | "read" | "failed";
  content: string;          // Notification content
}

// Deadline entry for timeline management
export interface DeadlineEntry {
  type: "review_deadline" | "revision_deadline" | "progress_report" | "final_report";
  dueDate: string;          // ISO timestamp
  assignedTo: string;       // User ID responsible
  status: "pending" | "completed" | "overdue" | "extended";
  extendedFrom?: string;    // Original deadline if extended
  extensionReason?: string;
}

// Review progress data for monitoring
export interface ReviewProgressData {
  totalReviewers: number;
  completedReviews: number;
  pendingReviews: number;
  overdueReviews: number;
  averageReviewTime?: number; // In hours
  lastReviewActivity?: string; // ISO timestamp
}

// Document version control
export interface DocumentVersion {
  documentId: string;
  version: number;
  uploadedBy: string;
  uploadedAt: string;       // ISO timestamp
  changeDescription?: string;
  isCurrentVersion: boolean;
}

// User activity tracking
export interface UserActivityEntry {
  userId: string;
  userName: string;
  action: string;
  timestamp: string;        // ISO timestamp
  ipAddress?: string;
  userAgent?: string;
}

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
  
  // NEW CRITICAL FIELDS FOR SYSTEM FLOW
  auditTrail?: AuditTrailEntry[];        // Track all actions performed
  notifications?: NotificationEntry[];   // Communication tracking
  documentVersions?: DocumentVersion[];  // Document version control
  userActivity?: UserActivityEntry[];    // User activity tracking
}

// 2. Accepted Submissions (status: 'accepted' in submissions collection)  
export interface AcceptedSubmission extends BaseSubmission {
  spupCode: string;           // Official SPUP REC code (FIXED: was spupRecCode)
  reviewType: "SR" | "Ex";    // Standard Review or Expedited
  status: AcceptedSubmissionStatus;
  assignedAt: string;         // When moved from pending
  reviewStarted?: string;     // When review officially began
  assignedReviewers?: string[]; // Reviewer user IDs
  
  // NEW CRITICAL FIELDS FOR SYSTEM FLOW
  auditTrail?: AuditTrailEntry[];        // Track all actions performed
  notifications?: NotificationEntry[];   // Communication tracking
  deadlines?: DeadlineEntry[];           // Timeline management
  reviewProgress?: ReviewProgressData;   // Review completion monitoring
  documentVersions?: DocumentVersion[];  // Document version control
  userActivity?: UserActivityEntry[];    // User activity tracking
  
  // EXISTING FIELDS
  chairNotes?: string;        // REC Chair notes
  estimatedCompletionDate?: string;
}

// 3. Approved Submissions (submissions_approved)
export interface ApprovedSubmission extends BaseSubmission {
  spupCode: string;           // FIXED: was spupRecCode
  status: ApprovedSubmissionStatus;
  approvedAt: string;         // Approval date
  approvalValidUntil: string; // Research end date
  
  // NEW CRITICAL FIELDS FOR SYSTEM FLOW
  auditTrail?: AuditTrailEntry[];        // Track all actions performed
  notifications?: NotificationEntry[];   // Communication tracking
  deadlines?: DeadlineEntry[];           // Timeline management
  documentVersions?: DocumentVersion[];  // Document version control
  userActivity?: UserActivityEntry[];    // User activity tracking
}

// 4. Archived Submissions (submissions_archived)
export interface ArchivedSubmission extends BaseSubmission {
  spupCode: string;           // FIXED: was spupRecCode
  status: ArchivedSubmissionStatus;
  approvedAt: string;         // Original approval date
  completedAt: string;        // When moved to archive
  archiveReason: "completed" | "terminated_by_researcher" | "terminated_by_rec" | "expired";
  finalNotes?: string;        // Final REC notes
  
  // NEW CRITICAL FIELDS FOR SYSTEM FLOW
  auditTrail?: AuditTrailEntry[];        // Track all actions performed
  notifications?: NotificationEntry[];   // Communication tracking
  documentVersions?: DocumentVersion[];  // Document version control
  userActivity?: UserActivityEntry[];    // User activity tracking
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
// @deprecated - All submissions now use single 'submissions' collection with status field
export const SUBMISSION_COLLECTIONS = {
  UNIFIED: 'submissions', // Single collection for all submission statuses
  // Legacy references (deprecated):
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
  