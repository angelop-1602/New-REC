// Unified Data Types for REC System
// Single source of truth for all data structures

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENUM TYPES
// ============================================================================

export type StudyLevel = 
  | 'Undergraduate Thesis'
  | 'Master\'s Thesis'
  | 'Doctoral Dissertation'
  | 'Faculty/Staff'
  | 'Funded Research'
  | 'Others';

export type StudyType = 
  | 'Social/Behavioral'
  | 'Public Health Research'
  | 'Health Operations'
  | 'Biomedical Studies'
  | 'Clinical Trials'
  | 'Others';

export type FundingSource = 
  | 'self_funded'
  | 'institution_funded'
  | 'government_funded'
  | 'scholarship'
  | 'research_grant'
  | 'pharmaceutical_company'
  | 'others';

export type ProtocolStatus = 
  | 'draft'
  | 'submitted'
  | 'accepted'
  | 'pending'
  | 'approved'
  | 'approved_minor_revisions'
  | 'major_revisions_deferred'
  | 'disapproved';

export type AssessmentFormType = 
  | 'Protocol Review Assessment'
  | 'Informed Consent Assessment'
  | 'IACUC Protocol Review Assessment'
  | 'Checklist for Exemption Form Review';

export type AssessmentStatus = 
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'returned';

export type ReviewType = 'expedited' | 'full';

export type AssessmentResponse = 'yes' | 'no' | 'unable';

// ============================================================================
// CORE ENTITIES
// ============================================================================

/**
 * Core Protocol Entity - Single source of truth for protocol information
 */
export interface Protocol {
  // Unique Identifiers
  id: string;
  spupCode: string;
  
  // Basic Information (Single Source of Truth)
  title: string;
  principalInvestigator: {
    name: string;
    email: string;
    contactNumber: string;
    position: string;
    institution: string;
    address: string;
  };
  coResearchers: Array<{
    name: string;
    email?: string;
    contactNumber?: string;
  }>;
  adviser: {
    name: string;
    email?: string;
    contactNumber?: string;
  };
  
  // Study Details
  studyDetails: {
    level: StudyLevel;
    type: StudyType;
    site: {
      location: 'inside' | 'outside';
      outsideSpecify?: string;
    };
    duration: {
      startDate: string;
      endDate: string;
    };
    funding: {
      source: FundingSource;
      othersSpecify?: string;
    };
    participants: {
      count: number;
      description: string;
    };
    description: string;
  };
  
  // Status and Metadata
  status: ProtocolStatus;
  submissionDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Pre-submission Status
  preSubmissionStatus: {
    technicalReviewCompleted: boolean;
    submittedToOtherCommittee: boolean;
  };
}

/**
 * Unified Assessment Entity - All assessment forms use this structure
 */
export interface Assessment {
  id: string;
  protocolId: string;
  reviewerId: string;
  reviewerName: string;
  formType: AssessmentFormType;
  typeOfReview: ReviewType; // Set by chairperson when assigning
  status: AssessmentStatus;
  
  // Assessment Data (Structured)
  responses: Record<string, {
    value: AssessmentResponse | string;
    comments?: string;
  }>;
  
  // Metadata
  submittedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

/**
 * Unified Reviewer Entity - Single source of truth for reviewer information
 */
export interface Reviewer {
  id: string;
  code: string;
  name: string;
  email: string;
  role: string;
  department: string;
  qualification: string;
  
  // Professional Details
  expertise: string[];
  specializations: string[];
  preferredTypes: AssessmentFormType[];
  
  // Status
  isActive: boolean;
  totalReviewed: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Decision Entity - Complete decision information
 */
export interface Decision {
  id: string;
  protocolId: string;
  decisionType: 'approved' | 'approved_minor_revisions' | 'major_revisions_deferred' | 'disapproved' | 'deferred';
  timeline?: string;
  documents: Array<{
    fileName: string;
    storagePath: string;
    uploadedAt: Timestamp;
    uploadedBy: string;
    fileSize: number;
    fileType: string;
  }>;
  decisionBy: string;
  decisionDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Maps old protocol structure to unified structure
 */
export interface ProtocolMapping {
  // Old structure paths -> Unified structure paths
  'information.general_information.protocol_title': 'title';
  'information.general_information.principal_investigator.name': 'principalInvestigator.name';
  'information.general_information.principal_investigator.email': 'principalInvestigator.email';
  'information.general_information.principal_investigator.contact_number': 'principalInvestigator.contactNumber';
  'information.general_information.principal_investigator.position': 'principalInvestigator.position';
  'information.general_information.principal_investigator.institution': 'principalInvestigator.institution';
  'information.general_information.principal_investigator.address': 'principalInvestigator.address';
  'information.general_information.co_researchers': 'coResearchers';
  'information.general_information.adviser.name': 'adviser.name';
  'information.general_information.nature_and_type_of_study.level': 'studyDetails.level';
  'information.general_information.nature_and_type_of_study.type': 'studyDetails.type';
  'information.general_information.study_site.location': 'studyDetails.site.location';
  'information.general_information.study_site.outside_specify': 'studyDetails.site.outsideSpecify';
  'information.general_information.duration_of_study.start_date': 'studyDetails.duration.startDate';
  'information.general_information.duration_of_study.end_date': 'studyDetails.duration.endDate';
  'information.general_information.source_of_funding.selected': 'studyDetails.funding.source';
  'information.general_information.source_of_funding.others_specify': 'studyDetails.funding.othersSpecify';
  'information.general_information.participants.number_of_participants': 'studyDetails.participants.count';
  'information.general_information.participants.type_and_description': 'studyDetails.participants.description';
  'information.general_information.brief_description_of_study': 'studyDetails.description';
  'information.pre_submission_status.technical_review_completed': 'preSubmissionStatus.technicalReviewCompleted';
  'information.pre_submission_status.submitted_to_other_committee': 'preSubmissionStatus.submittedToOtherCommittee';
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Validation rules for unified data structures
 */
export interface ValidationRules {
  protocol: {
    required: (keyof Protocol)[];
    optional: (keyof Protocol)[];
    patterns: Record<string, RegExp>;
  };
  assessment: {
    required: (keyof Assessment)[];
    optional: (keyof Assessment)[];
  };
  reviewer: {
    required: (keyof Reviewer)[];
    optional: (keyof Reviewer)[];
  };
  decision: {
    required: (keyof Decision)[];
    optional: (keyof Decision)[];
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isProtocol(obj: any): obj is Protocol {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.spupCode === 'string' &&
    typeof obj.title === 'string' &&
    obj.principalInvestigator &&
    obj.studyDetails &&
    obj.status &&
    obj.submissionDate;
}

export function isAssessment(obj: any): obj is Assessment {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.protocolId === 'string' &&
    typeof obj.reviewerId === 'string' &&
    typeof obj.formType === 'string' &&
    typeof obj.typeOfReview === 'string' &&
    obj.responses &&
    obj.createdAt;
}

export function isReviewer(obj: any): obj is Reviewer {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.isActive === 'boolean';
}

export function isDecision(obj: any): obj is Decision {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.protocolId === 'string' &&
    typeof obj.decisionType === 'string' &&
    typeof obj.decisionBy === 'string' &&
    obj.decisionDate &&
    obj.createdAt;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Partial protocol for updates
 */
export type PartialProtocol = Partial<Protocol>;

/**
 * Partial assessment for updates
 */
export type PartialAssessment = Partial<Assessment>;

/**
 * Partial reviewer for updates
 */
export type PartialReviewer = Partial<Reviewer>;

/**
 * Partial decision for updates
 */
export type PartialDecision = Partial<Decision>;

/**
 * Protocol with all optional fields
 */
export type ProtocolInput = Omit<Protocol, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Assessment with all optional fields
 */
export type AssessmentInput = Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Reviewer with all optional fields
 */
export type ReviewerInput = Omit<Reviewer, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Decision with all optional fields
 */
export type DecisionInput = Omit<Decision, 'id' | 'createdAt' | 'updatedAt'>;
