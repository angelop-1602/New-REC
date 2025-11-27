// Data Transformation Utilities
// Converts between old and new data structures for backward compatibility

import { Timestamp } from 'firebase/firestore';
import { 
  Protocol, 
  Assessment, 
  Reviewer, 
  Decision,
  ProtocolInput,
  AssessmentInput,
  ReviewerInput,
  DecisionInput,
  isProtocol,
  isAssessment,
  isReviewer,
  isDecision
} from '@/types';

// ============================================================================
// PROTOCOL TRANSFORMATIONS
// ============================================================================

/**
 * Converts old protocol structure to unified structure
 */
export function transformToUnifiedProtocol(oldData: any): Protocol {
  if (isProtocol(oldData)) {
    return oldData; // Already in unified format
  }

  const now = Timestamp.now();
  
  return {
    id: oldData.id || '',
    spupCode: oldData.spupCode || '',
    
    // Basic Information
    title: oldData.information?.general_information?.protocol_title || '',
    principalInvestigator: {
      name: oldData.information?.general_information?.principal_investigator?.name || '',
      email: oldData.information?.general_information?.principal_investigator?.email || '',
      contactNumber: oldData.information?.general_information?.principal_investigator?.contact_number || '',
      position: oldData.information?.general_information?.principal_investigator?.position || '',
      institution: oldData.information?.general_information?.principal_investigator?.institution || '',
      address: oldData.information?.general_information?.principal_investigator?.address || '',
    },
    coResearchers: oldData.information?.general_information?.co_researchers || [],
    adviser: {
      name: oldData.information?.general_information?.adviser?.name || '',
      email: oldData.information?.general_information?.adviser?.email || '',
      contactNumber: oldData.information?.general_information?.adviser?.contact_number || '',
    },
    
    // Study Details
    studyDetails: {
      level: oldData.information?.general_information?.nature_and_type_of_study?.level || 'Others',
      type: oldData.information?.general_information?.nature_and_type_of_study?.type || 'Others',
      site: {
        location: oldData.information?.general_information?.study_site?.location || 'inside',
        outsideSpecify: oldData.information?.general_information?.study_site?.outside_specify || '',
      },
      duration: {
        startDate: oldData.information?.general_information?.duration_of_study?.start_date || '',
        endDate: oldData.information?.general_information?.duration_of_study?.end_date || '',
      },
      funding: {
        source: oldData.information?.general_information?.source_of_funding?.selected || 'self_funded',
        othersSpecify: oldData.information?.general_information?.source_of_funding?.others_specify || '',
      },
      participants: {
        count: oldData.information?.general_information?.participants?.number_of_participants || 0,
        description: oldData.information?.general_information?.participants?.type_and_description || '',
      },
      description: oldData.information?.general_information?.brief_description_of_study || '',
    },
    
    // Status and Metadata
    status: oldData.status || 'draft',
    submissionDate: oldData.submittedAt || now,
    createdAt: oldData.createdAt || now,
    updatedAt: oldData.updatedAt || now,
    
    // Pre-submission Status
    preSubmissionStatus: {
      technicalReviewCompleted: oldData.information?.pre_submission_status?.technical_review_completed || false,
      submittedToOtherCommittee: oldData.information?.pre_submission_status?.submitted_to_other_committee || false,
    },
  };
}

/**
 * Converts unified protocol structure back to old format (for backward compatibility)
 */
export function transformFromUnifiedProtocol(unifiedData: Protocol): any {
  return {
    id: unifiedData.id,
    spupCode: unifiedData.spupCode,
    status: unifiedData.status,
    submittedAt: unifiedData.submissionDate,
    createdAt: unifiedData.createdAt,
    updatedAt: unifiedData.updatedAt,
    
    information: {
      general_information: {
        protocol_title: unifiedData.title,
        principal_investigator: {
          name: unifiedData.principalInvestigator.name,
          email: unifiedData.principalInvestigator.email,
          contact_number: unifiedData.principalInvestigator.contactNumber,
          position: unifiedData.principalInvestigator.position,
          institution: unifiedData.principalInvestigator.institution,
          address: unifiedData.principalInvestigator.address,
        },
        co_researchers: unifiedData.coResearchers,
        adviser: {
          name: unifiedData.adviser.name,
          email: unifiedData.adviser.email,
          contact_number: unifiedData.adviser.contactNumber,
        },
        nature_and_type_of_study: {
          level: unifiedData.studyDetails.level,
          type: unifiedData.studyDetails.type,
        },
        study_site: {
          location: unifiedData.studyDetails.site.location,
          outside_specify: unifiedData.studyDetails.site.outsideSpecify,
        },
        duration_of_study: {
          start_date: unifiedData.studyDetails.duration.startDate,
          end_date: unifiedData.studyDetails.duration.endDate,
        },
        source_of_funding: {
          selected: unifiedData.studyDetails.funding.source,
          others_specify: unifiedData.studyDetails.funding.othersSpecify,
        },
        participants: {
          number_of_participants: unifiedData.studyDetails.participants.count,
          type_and_description: unifiedData.studyDetails.participants.description,
        },
        brief_description_of_study: unifiedData.studyDetails.description,
      },
      pre_submission_status: {
        technical_review_completed: unifiedData.preSubmissionStatus.technicalReviewCompleted,
        submitted_to_other_committee: unifiedData.preSubmissionStatus.submittedToOtherCommittee,
      },
    },
  };
}

// ============================================================================
// ASSESSMENT TRANSFORMATIONS
// ============================================================================

/**
 * Converts old assessment structure to unified structure
 */
export function transformToUnifiedAssessment(oldData: any): Assessment {
  if (isAssessment(oldData)) {
    return oldData; // Already in unified format
  }

  const now = Timestamp.now();
  
  return {
    id: oldData.id || '',
    protocolId: oldData.protocolId || '',
    reviewerId: oldData.reviewerId || '',
    reviewerName: oldData.reviewerName || '',
    formType: oldData.formType || 'Protocol Review Assessment',
    typeOfReview: oldData.typeOfReview || 'full',
    status: oldData.status || 'draft',
    
    // Assessment Data - Convert old form fields to unified responses
    responses: transformAssessmentResponses(oldData),
    
    // Metadata
    submittedAt: oldData.submittedAt,
    createdAt: oldData.createdAt || now,
    updatedAt: oldData.updatedAt || now,
    version: oldData.version || 1,
  };
}

/**
 * Transforms old assessment form fields to unified responses structure
 */
function transformAssessmentResponses(oldData: any): Record<string, { value: string; comments?: string }> {
  const responses: Record<string, { value: string; comments?: string }> = {};
  
  // Protocol Review Assessment Form fields
  if (oldData.socialValue) {
    responses.socialValue = {
      value: oldData.socialValue,
      comments: oldData.socialValueComments || '',
    };
  }
  
  if (oldData.studyObjectives) {
    responses.studyObjectives = {
      value: oldData.studyObjectives,
      comments: oldData.studyObjectivesComments || '',
    };
  }
  
  if (oldData.literatureReview) {
    responses.literatureReview = {
      value: oldData.literatureReview,
      comments: oldData.literatureReviewComments || '',
    };
  }
  
  if (oldData.researchDesign) {
    responses.researchDesign = {
      value: oldData.researchDesign,
      comments: oldData.researchDesignComments || '',
    };
  }
  
  if (oldData.dataCollection) {
    responses.dataCollection = {
      value: oldData.dataCollection,
      comments: oldData.dataCollectionComments || '',
    };
  }
  
  if (oldData.inclusionExclusion) {
    responses.inclusionExclusion = {
      value: oldData.inclusionExclusion,
      comments: oldData.inclusionExclusionComments || '',
    };
  }
  
  if (oldData.withdrawalCriteria) {
    responses.withdrawalCriteria = {
      value: oldData.withdrawalCriteria,
      comments: oldData.withdrawalCriteriaComments || '',
    };
  }
  
  if (oldData.facilities) {
    responses.facilities = {
      value: oldData.facilities,
      comments: oldData.facilitiesComments || '',
    };
  }
  
  if (oldData.investigatorQualification) {
    responses.investigatorQualification = {
      value: oldData.investigatorQualification,
      comments: oldData.investigatorQualificationComments || '',
    };
  }
  
  if (oldData.privacyConfidentiality) {
    responses.privacyConfidentiality = {
      value: oldData.privacyConfidentiality,
      comments: oldData.privacyConfidentialityComments || '',
    };
  }
  
  if (oldData.conflictOfInterest) {
    responses.conflictOfInterest = {
      value: oldData.conflictOfInterest,
      comments: oldData.conflictOfInterestComments || '',
    };
  }
  
  if (oldData.humanParticipants) {
    responses.humanParticipants = {
      value: oldData.humanParticipants,
      comments: oldData.humanParticipantsComments || '',
    };
  }
  
  if (oldData.vulnerablePopulations) {
    responses.vulnerablePopulations = {
      value: oldData.vulnerablePopulations,
      comments: oldData.vulnerablePopulationsComments || '',
    };
  }
  
  if (oldData.voluntaryRecruitment) {
    responses.voluntaryRecruitment = {
      value: oldData.voluntaryRecruitment,
      comments: oldData.voluntaryRecruitmentComments || '',
    };
  }
  
  if (oldData.riskBenefit) {
    responses.riskBenefit = {
      value: oldData.riskBenefit,
      comments: oldData.riskBenefitComments || '',
    };
  }
  
  if (oldData.informedConsent) {
    responses.informedConsent = {
      value: oldData.informedConsent,
      comments: oldData.informedConsentComments || '',
    };
  }
  
  // Informed Consent Assessment Form fields (q1-q17)
  for (let i = 1; i <= 17; i++) {
    const questionKey = `q${i}`;
    const commentKey = `q${i}Comments`;
    
    if (oldData[questionKey]) {
      responses[questionKey] = {
        value: oldData[questionKey],
        comments: oldData[commentKey] || '',
      };
    }
  }
  
  // IACUC Review Form fields
  if (oldData.scientificValue) {
    responses.scientificValue = {
      value: oldData.scientificValue,
      comments: oldData.scientificValueComments || '',
    };
  }
  
  // Exemption Checklist Form fields
  if (oldData.decision) {
    responses.decision = {
      value: oldData.decision,
      comments: oldData.decisionJustification || '',
    };
  }
  
  return responses;
}

// ============================================================================
// REVIEWER TRANSFORMATIONS
// ============================================================================

/**
 * Converts old reviewer structure to unified structure
 */
export function transformToUnifiedReviewer(oldData: any): Reviewer {
  if (isReviewer(oldData)) {
    return oldData; // Already in unified format
  }

  const now = Timestamp.now();
  
  return {
    id: oldData.id || '',
    code: oldData.code || '',
    name: oldData.name || '',
    email: oldData.email || '',
    role: oldData.role || 'Reviewer',
    department: oldData.department || '',
    qualification: oldData.qualification || '',
    
    // Professional Details
    expertise: oldData.expertise || [],
    specializations: oldData.specializations || [],
    preferredTypes: oldData.preferredTypes || [],
    
    // Status
    isActive: oldData.isActive !== undefined ? oldData.isActive : true,
    totalReviewed: oldData.totalReviewed || 0,
    
    // Timestamps
    createdAt: oldData.createdAt || now,
    updatedAt: oldData.updatedAt || now,
  };
}

// ============================================================================
// DECISION TRANSFORMATIONS
// ============================================================================

/**
 * Converts old decision structure to unified structure
 */
export function transformToUnifiedDecision(oldData: any): Decision {
  if (isDecision(oldData)) {
    return oldData; // Already in unified format
  }

  const now = Timestamp.now();
  
  return {
    id: oldData.id || '',
    protocolId: oldData.protocolId || '',
    decisionType: oldData.decisionType || 'approved',
    timeline: oldData.timeline || '',
    documents: oldData.documents || [],
    decisionBy: oldData.decisionBy || '',
    decisionDate: oldData.decisionDate || now,
    createdAt: oldData.createdAt || now,
    updatedAt: oldData.updatedAt || now,
  };
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates unified protocol data
 */
export function validateProtocol(protocol: Protocol): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!protocol.id) errors.push('Protocol ID is required');
  if (!protocol.spupCode) errors.push('SPUP Code is required');
  if (!protocol.title) errors.push('Protocol title is required');
  if (!protocol.principalInvestigator?.name) errors.push('Principal Investigator name is required');
  if (!protocol.studyDetails?.type) errors.push('Study type is required');
  if (!protocol.status) errors.push('Protocol status is required');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates unified assessment data
 */
export function validateAssessment(assessment: Assessment): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!assessment.id) errors.push('Assessment ID is required');
  if (!assessment.protocolId) errors.push('Protocol ID is required');
  if (!assessment.reviewerId) errors.push('Reviewer ID is required');
  if (!assessment.formType) errors.push('Form type is required');
  if (!assessment.typeOfReview) errors.push('Review type is required');
  if (!assessment.status) errors.push('Assessment status is required');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates unified reviewer data
 */
export function validateReviewer(reviewer: Reviewer): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!reviewer.id) errors.push('Reviewer ID is required');
  if (!reviewer.code) errors.push('Reviewer code is required');
  if (!reviewer.name) errors.push('Reviewer name is required');
  if (!reviewer.email) errors.push('Reviewer email is required');
  if (typeof reviewer.isActive !== 'boolean') errors.push('Active status is required');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates unified decision data
 */
export function validateDecision(decision: Decision): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!decision.id) errors.push('Decision ID is required');
  if (!decision.protocolId) errors.push('Protocol ID is required');
  if (!decision.decisionType) errors.push('Decision type is required');
  if (!decision.decisionBy) errors.push('Decision by is required');
  if (!decision.decisionDate) errors.push('Decision date is required');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Deep clone an object with proper timestamp handling
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Timestamp) {
    return Timestamp.fromMillis(obj.toMillis()) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Merges two objects with proper timestamp handling
 */
export function mergeObjects<T>(target: T, source: Partial<T>): T {
  const result = deepClone(target);
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const value = source[key];
      if (value !== undefined) {
        result[key] = deepClone(value);
      }
    }
  }
  
  return result;
}

/**
 * Creates a new object with updated timestamp
 */
export function updateTimestamp<T extends { updatedAt: Timestamp }>(obj: T): T {
  return {
    ...obj,
    updatedAt: Timestamp.now(),
  };
}
