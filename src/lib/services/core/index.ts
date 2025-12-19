/**
 * Core Services - Barrel Export
 * 
 * Centralized exports for all core/system services
 */

// Decision Service - exports functions and interfaces
export { 
  getDecisionData, 
  hasDecision, 
  getDecisionStatus, 
  getDecisionColors,
  type DecisionDetails,
  type DecisionDocument,
  type DecisionData
} from './decisionService';

// Unified Data Service - exports functions
export { 
  getDecision, 
  getActiveReviewers, 
  getAllReviewers, 
  getReviewer, 
  createReviewer, 
  updateReviewer, 
  deleteReviewer, 
  getAssessment, 
  saveAssessment 
} from './unifiedDataService';

// Chairperson Service - exports utility functions
export { 
  getCurrentChairName
} from './chairpersonService';

// Archiving Service - exports functions
export { 
  checkArchivingConditions, 
  archiveProtocol, 
  updateProtocolActivity 
} from './archivingService';

// Presence Service - DEPRECATED: Only used for non-reviewer users if needed
// Reviewers now use the reviewers collection for presence tracking
export { 
  initializePresence,
  updateLastSeen,
  setUserOffline,
  getUserPresence,
  subscribeToUserPresence,
  getChairpersonUserId,
  subscribeToChairpersonPresence,
  type UserPresence
} from './presenceService';

