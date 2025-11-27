/**
 * Reviewers Services - Barrel Export
 * 
 * Centralized exports for all reviewer-related services
 */

// Reviewer Service - exports instance, interface, and functions
export { 
  reviewerService, 
  type Reviewer, 
  REVIEWER_REQUIREMENTS, 
  initializeSampleReviewers,
  getRecommendedReviewers,
  assignReviewers,
  searchReviewers,
  getProtocolReviewers,
  clearProtocolReviewers
} from './reviewerService';

// Reviewer Auth Service - exports instance, interface, and functions
export { 
  reviewerAuthService, 
  type ReviewerAuthData,
  type AuthResult,
  validateReviewerCode,
  getReviewerById,
  getAssignedProtocols,
  getReassignedProtocols
} from './reviewerAuthService';

// Reviewer Code Generator - exports function
export { generateReviewerCode } from './reviewerCodeGenerator';

// Reviewers Management Service - exports instance, types, and functions
export { 
  reviewersManagementService, 
  type ReviewerRole, 
  type CreateReviewerRequest,
  type UpdateReviewerRequest,
  getAllReviewers,
  getActiveReviewers,
  createReviewer,
  updateReviewer,
  toggleReviewerStatus,
  getReviewerStats,
  exportReviewersToJSON
} from './reviewersManagementService';

