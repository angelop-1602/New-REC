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

// REC Settings Service - exports instance and utility functions
export { 
  recSettingsService, 
  getCurrentChairName, 
  initializeDefaultSettings,
  getCurrentSettings
} from './recSettingsService';

// Archiving Service - exports functions
export { 
  checkArchivingConditions, 
  archiveProtocol, 
  updateProtocolActivity 
} from './archivingService';

// Presence Service - exports functions and interfaces
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

