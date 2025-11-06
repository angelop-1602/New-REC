import { Timestamp } from 'firebase/firestore';

// Interface for protocol data structure
interface ProtocolData {
  spupCode?: string;
  submittedAt?: Timestamp;
  general_information?: {
    protocol_title?: string;
    principal_investigator?: {
      name?: string;
      contact_number?: string;
      email?: string;
      position?: string;
      institution?: string;
      address?: string;
      course_program?: string;
    };
    co_researchers?: Array<{
      name?: string;
    }>;
    adviser?: {
      name?: string;
    };
  };
  nature_and_type_of_study?: {
    level?: string;
    type?: string;
  };
  study_site?: {
    location?: string;
    outside_specify?: string;
  };
  duration_of_study?: {
    start_date?: string;
    end_date?: string;
  };
  source_of_funding?: {
    selected?: string;
    others_specify?: string;
  };
  participants?: {
    number_of_participants?: number;
    type_and_description?: string;
  };
  brief_description_of_study?: string;
}

// Common fields that need pre-population across all forms
export interface PrepopulatedFields {
  protocolCode: string;
  submissionDate: string;
  title: string;
  studySite: string;
  principalInvestigator: string;
  sponsor: string;
}

/**
 * Pre-populate form fields with protocol data
 */
export function prePopulateFormFields(protocolData: any): PrepopulatedFields {
  console.log('🔍 prePopulateFormFields input:', protocolData);
  
  const generalInfo = protocolData.information?.general_information || {};
  const pi = generalInfo.principal_investigator || {};
  const studySite = protocolData.information?.study_site || {};
  const funding = protocolData.information?.source_of_funding || {};
  
  console.log('🔍 Extracted data:', {
    generalInfo,
    pi,
    studySite,
    funding
  });
  
  // Format submission date - use createdAt if submittedAt is not available
  let submissionDate = '';
  if (protocolData.createdAt) {
    const date = protocolData.createdAt instanceof Timestamp 
      ? protocolData.createdAt.toDate() 
      : new Date(protocolData.createdAt);
    submissionDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Format study site
  let studySiteText = '';
  if (studySite.location === 'within') {
    studySiteText = 'Within University';
  } else if (studySite.location === 'outside') {
    studySiteText = studySite.outside_specify || 'Outside University';
  }

  // Format funding source
  let fundingSourceText = '';
  if (funding.selected) {
    switch (funding.selected) {
      case 'self_funded':
        fundingSourceText = 'Self-funded';
        break;
      case 'institution_funded':
        fundingSourceText = 'Institution Funded';
        break;
      case 'government_funded':
        fundingSourceText = 'Government Funded';
        break;
      case 'scholarship':
        fundingSourceText = 'Scholarship';
        break;
      case 'research_grant':
        fundingSourceText = 'Research Grant';
        break;
      case 'pharmaceutical_company':
        fundingSourceText = 'Pharmaceutical Company';
        break;
      case 'others':
        fundingSourceText = funding.others_specify || 'Others';
        break;
      default:
        fundingSourceText = funding.selected;
    }
  }

  const result = {
    protocolCode: protocolData.spupCode || '',
    submissionDate,
    title: generalInfo.protocol_title || '',
    studySite: studySiteText,
    principalInvestigator: pi.name || '',
    sponsor: fundingSourceText
  };
  
  console.log('🔍 prePopulateFormFields result:', result);
  
  return result;
}

/**
 * Get form-specific default values based on form type
 */
export function getFormDefaultValues(formType: string, prepopulatedFields: PrepopulatedFields): Record<string, any> {
  const baseFields = {
    ...prepopulatedFields,
    // Common assessment fields - no auto-selection, let reviewers choose
    socialValue: undefined,
    studyObjectives: undefined,
    literatureReview: undefined,
    researchDesign: undefined,
    dataCollection: undefined,
    inclusionExclusion: undefined,
    withdrawalCriteria: undefined,
    facilities: undefined,
    investigatorQualification: undefined,
    privacyConfidentiality: undefined,
    conflictOfInterest: undefined,
    humanParticipants: undefined,
    vulnerablePopulations: undefined,
    voluntaryRecruitment: undefined,
    riskBenefit: undefined,
    informedConsent: undefined,
    communityConsiderations: undefined,
    collaborativeTerms: undefined,
    // Common recommendation field - no auto-selection
    recommendation: undefined,
    // Common review type - no auto-selection
    typeOfReview: undefined
  };

  switch (formType) {
    case 'protocol-review':
      return {
        ...baseFields,
        // Protocol review specific fields
        socialValueComments: '',
        studyObjectivesComments: '',
        literatureReviewComments: '',
        researchDesignComments: '',
        dataCollectionComments: '',
        inclusionExclusionComments: '',
        withdrawalCriteriaComments: '',
        facilitiesComments: '',
        investigatorQualificationComments: '',
        privacyConfidentialityComments: '',
        conflictOfInterestComments: '',
        humanParticipantsComments: '',
        vulnerablePopulationsComments: '',
        voluntaryRecruitmentComments: '',
        riskBenefitComments: '',
        informedConsentComments: '',
        communityConsiderationsComments: '',
        collaborativeTermsComments: '',
        justification: ''
      };

    case 'informed-consent':
      return {
        ...baseFields,
        // Informed consent specific fields (q1-q17) - no auto-selection
        q1: undefined, q1Comments: '',
        q2: undefined, q2Comments: '',
        q3: undefined, q3Comments: '',
        q4: undefined, q4Comments: '',
        q5: undefined, q5Comments: '',
        q6: undefined, q6Comments: '',
        q7: undefined, q7Comments: '',
        q8: undefined, q8Comments: '',
        q9: undefined, q9Comments: '',
        q10: undefined, q10Comments: '',
        q11: undefined, q11Comments: '',
        q12: undefined, q12Comments: '',
        q13: undefined, q13Comments: '',
        q14: undefined, q14Comments: '',
        q15: undefined, q15Comments: '',
        q16: undefined, q16Comments: '',
        q17: undefined, q17Comments: '',
        recommendation: undefined,
        recommendationJustification: ''
      };

    case 'exemption-checklist':
      return {
        ...baseFields,
        // Exemption checklist specific fields - no auto-selection
        involvesHumanParticipants: undefined, involvesHumanParticipantsComments: '',
        involvesNonIdentifiableTissue: undefined, involvesNonIdentifiableTissueComments: '',
        involvesPublicData: undefined, involvesPublicDataComments: '',
        involvesInteraction: undefined, involvesInteractionComments: '',
        qualityAssurance: undefined, qualityAssuranceComments: '',
        publicServiceEvaluation: undefined, publicServiceEvaluationComments: '',
        publicHealthSurveillance: undefined, publicHealthSurveillanceComments: '',
        educationalEvaluation: undefined, educationalEvaluationComments: '',
        consumerAcceptability: undefined, consumerAcceptabilityComments: '',
        surveysQuestionnaire: undefined, surveysQuestionnaireComments: '',
        interviewsFocusGroup: undefined, interviewsFocusGroupComments: '',
        publicObservations: undefined, publicObservationsComments: '',
        existingData: undefined, existingDataComments: '',
        audioVideo: undefined, audioVideoComments: '',
        dataAnonymization: undefined,
        foreseeableRisk: undefined, foreseeableRiskComments: '',
        riskVulnerableGroups: undefined, riskVulnerableGroupsComments: '',
        riskSensitiveTopics: undefined, riskSensitiveTopicsComments: '',
        riskUseOfDrugs: undefined, riskUseOfDrugsComments: '',
        riskInvasiveProcedure: undefined, riskInvasiveProcedureComments: '',
        riskPhysicalDistress: undefined, riskPhysicalDistressComments: '',
        riskPsychologicalDistress: undefined, riskPsychologicalDistressComments: '',
        riskDeception: undefined, riskDeceptionComments: '',
        riskAccessData: undefined, riskAccessDataComments: '',
        riskConflictInterest: undefined, riskConflictInterestComments: '',
        riskOtherDilemmas: undefined, riskOtherDilemmasComments: '',
        riskBloodSampling: undefined, riskBloodSamplingComments: '',
        decision: undefined,
        decisionJustification: ''
      };

    case 'iacuc-review':
      return {
        ...baseFields,
        // IACUC specific fields
        iacucCode: baseFields.protocolCode, // Use protocol code as IACUC code
        scientificValue: undefined, scientificValueComments: '',
        // Section 2: SCIENTIFIC SOUNDNESS (2.1-2.6 only)
        studyObjectives: undefined, studyObjectivesComments: '',
        literatureReview: undefined, literatureReviewComments: '',
        researchDesign: undefined, researchDesignComments: '',
        dataCollection: undefined, dataCollectionComments: '',
        facilitiesInfrastructure: undefined, facilitiesInfrastructureComments: '',
        investigatorQualifications: undefined, investigatorQualificationsComments: '',
        // Section 3: JUSTIFICATION ON THE USE OF ANIMALS
        animalSource: undefined, animalSourceComments: '',
        housingCare: undefined, housingCareComments: '',
        restraintProcedures: undefined, restraintProceduresComments: '',
        anesthesiaAnalgesia: undefined, anesthesiaAnalgesiaComments: '',
        postProcedureMonitoring: undefined, postProcedureMonitoringComments: '',
        euthanasia: undefined, euthanasiaComments: '',
        biologicalAgentCollection: undefined, biologicalAgentCollectionComments: '',
        examinationMethods: undefined, examinationMethodsComments: '',
        surgicalProcedures: undefined, surgicalProceduresComments: '',
        humaneEndpoints: undefined, humaneEndpointsComments: '',
        potentialHazards: undefined, potentialHazardsComments: '',
        wasteDisposal: undefined, wasteDisposalComments: '',
        justification: ''
      };

    default:
      return baseFields;
  }
}

/**
 * Map assessment type to form type
 */
export function mapAssessmentTypeToFormType(assessmentType: string): string {
  const mapping: Record<string, string> = {
    'Protocol Review Assessment': 'protocol-review',
    'Informed Consent Assessment': 'informed-consent',
    'Checklist for Exemption Form Review': 'exemption-checklist',
    'IACUC Protocol Review Assessment': 'iacuc-review'
  };

  return mapping[assessmentType] || 'protocol-review';
}
