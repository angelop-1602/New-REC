/**
 * MASTER TYPE INDEX
 * Central export file for all type definitions
 * Import from here for consistency: import { ... } from '@/types'
 * 
 * ORGANIZATION:
 * - common.types.ts - Universal utilities & base types (dates, sorting, search, etc.)
 * - proponent-enhanced.types.ts - Proponent module types
 * - reviewer-enhanced.types.ts - Reviewer module types  
 * - chairperson-enhanced.types.ts - Chairperson module types
 * - [existing files] - Re-exported for backward compatibility
 */

// ============================================================================
// COMMON/UNIVERSAL TYPES & UTILITIES (Foundation)
// ============================================================================

export * from './common.types';

// ============================================================================
// USER ROLE-SPECIFIC TYPES
// ============================================================================

// Proponent Module
export * from './proponent-enhanced.types';

// Reviewer Module
export * from './reviewer-enhanced.types';

// Chairperson Module
export * from './chairperson-enhanced.types';

// Analytics Module
export * from './analytics.types';

// ============================================================================
// ADDITIONAL TYPE FILES (Still needed, exported for convenience)
// ============================================================================

// These types are still actively used and exported through @/types
// They will be migrated to the new system gradually
// Note: PrincipalInvestigator, Researcher, DocumentCategory, DocumentStatus are already exported from common.types
// Note: DocumentRequest is already exported from chairperson-enhanced.types
export type { InformationType } from './information.types';
export type { DocumentsType, DocumentRequirement, EnhancedDocument as EnhancedDocumentType, DocumentVersion } from './documents.types';
// Note: DocumentVersion is also defined in chairperson-enhanced.types, but we use the one from documents.types
export type { 
  PendingSubmission, 
  AcceptedSubmission, 
  ApprovedSubmission, 
  ArchivedSubmission,
  ReviewProgressData
} from './submissions.types';
export * from './auth.types';
// Note: ReviewerAssignment is already exported from reviewer-enhanced.types
// review.types.ts only exports ReviewerAssignment, which conflicts with reviewer-enhanced.types
// Skip exporting from review.types.ts to avoid conflicts
export * from './message.types';
export * from './forms.types';
// Note: ValidationResult is already exported from common.types
export type { ValidationRule, ValidationSchema, FieldValidationResult } from './validation.types';
export * from './firestore.types';
export * from './rec-settings.types';
// Note: AssessmentFormType is already exported from common.types
// unified.types.ts exports many types that may conflict, so we selectively export
export type { Protocol, ProtocolInput, Assessment, AssessmentInput, Reviewer, ReviewerInput, Decision, DecisionInput } from './unified.types';
export { isProtocol, isAssessment, isReviewer, isDecision } from './unified.types';
export * from './protocolsubmission.types';

// ============================================================================
// TYPE ALIASES FOR CONVENIENCE
// ============================================================================

import { ProponentSubmission } from './proponent-enhanced.types';
import { ReviewerProtocol } from './reviewer-enhanced.types';
import { ChairpersonProtocol } from './chairperson-enhanced.types';

/**
 * Union type for any protocol/submission from any user perspective
 */
export type AnyProtocol = ProponentSubmission | ReviewerProtocol | ChairpersonProtocol;

/**
 * Type helpers for module detection
 */
export function isProponentSubmission(obj: any): obj is ProponentSubmission {
  return 'isDraft' in obj || 'submitBy' in obj;
}

export function isReviewerProtocol(obj: any): obj is ReviewerProtocol {
  return 'assignedAt' in obj && 'reviewStatus' in obj;
}

export function isChairpersonProtocol(obj: any): obj is ChairpersonProtocol {
  return 'hasReviewers' in obj || 'chairNotes' in obj;
}

// ============================================================================
// USAGE GUIDE REFERENCE
// ============================================================================

/**
 * 📚 QUICK IMPORT GUIDE
 * 
 * For universal utilities (date handling, sorting, etc.):
 * ```typescript
 * import { toDate, sortByDate, getProtocolTitle } from '@/types';
 * ```
 * 
 * For proponent-specific types:
 * ```typescript
 * import { ProponentSubmission, toProponentSubmissions } from '@/types';
 * ```
 * 
 * For reviewer-specific types:
 * ```typescript
 * import { ReviewerProtocol, toReviewerProtocols } from '@/types';
 * ```
 * 
 * For chairperson-specific types:
 * ```typescript
 * import { ChairpersonProtocol, toChairpersonProtocols } from '@/types';
 * ```
 * 
 * Everything is available from '@/types' for convenience!
 */
