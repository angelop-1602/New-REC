/**
 * Assessment Form Export Service
 * 
 * Exports assessment forms to Word document templates using the correct placeholders
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// Template file mapping for assessment forms
const ASSESSMENT_TEMPLATE_FILES: Record<string, string> = {
  'protocol-review': '/templates/assessment/Form 06B Protocol Review Assessment.docx',
  'informed-consent': '/templates/assessment/Form 06C Informed Consent Assessment.docx',
  'exemption-checklist': '/templates/assessment/Form 04A Checklist for Exempted from Review.docx',
  'iacuc-review': '/templates/assessment/Form 06B IACUC Protocol Review Assessment.docx',
};

/**
 * Format Yes/No/Unable values for display
 */
function formatYesNoUnable(value: string | undefined): string {
  if (!value) return '';
  switch (value.toLowerCase()) {
    case 'yes':
      return 'Yes';
    case 'no':
      return 'No';
    case 'unable':
      return 'Unable to assess';
    default:
      return value;
  }
}

/**
 * Format recommendation values for display
 */
function formatRecommendation(value: string | undefined): string {
  if (!value) return '';
  switch (value.toLowerCase()) {
    case 'approved':
      return 'Approved';
    case 'minor':
      return 'Minor Modifications Required';
    case 'major':
      return 'Major Modifications Required';
    case 'disapproved':
      return 'Disapproved';
    default:
      return value;
  }
}

/**
 * Format decision values for display
 */
function formatDecision(value: string | undefined): string {
  if (!value) return '';
  switch (value.toLowerCase()) {
    case 'qualified':
      return 'Qualified for Exemption';
    case 'unqualified':
      return 'Unqualified for Exemption';
    default:
      return value;
  }
}

/**
 * Format date for display
 */
function formatDate(date: any): string {
  if (!date) return '';
  
  try {
    // Handle Firestore Timestamp
    if (date.toDate) {
      return date.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Handle string dates (YYYY-MM-DD)
    if (typeof date === 'string') {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  return '';
}

/**
 * Format type of review for display
 */
function formatTypeOfReview(value: string | undefined): string {
  if (!value) return '';
  switch (value.toLowerCase()) {
    case 'expedited':
      return 'Expedited';
    case 'full':
      return 'Full Review';
    default:
      return value;
  }
}

/**
 * Format data anonymization for display
 */
function formatDataAnonymization(value: string | undefined): string {
  if (!value) return '';
  switch (value.toLowerCase()) {
    case 'anonymized':
      return 'Anonymized';
    case 'identifiable':
      return 'Identifiable';
    case 'de-identified':
      return 'De-identified';
    default:
      return value;
  }
}

/**
 * Prepare form data for template export
 */
function prepareFormDataForTemplate(formData: Record<string, any>, formType: string, protocolData?: any, reviewerData?: any): Record<string, string> {
  const templateData: Record<string, string> = {};

  // Common protocol information
  templateData.spupCode = formData.protocolCode || formData.iacucCode || protocolData?.spupCode || '';
  templateData.protocolId = protocolData?.id || '';
  templateData.protocolTitle = formData.title || protocolData?.information?.general_information?.protocol_title || '';
  templateData.principalInvestigator = formData.principalInvestigator || protocolData?.information?.general_information?.principal_investigator?.name || '';
  templateData.studySite = formData.studySite || '';
  templateData.sponsor = formData.sponsor || '';
  templateData.institution = protocolData?.information?.general_information?.principal_investigator?.position_institution || '';
  templateData.submissionDate = formatDate(formData.submissionDate || protocolData?.createdAt);
  templateData.reviewerName = reviewerData?.name || reviewerData?.reviewerName || '';
  templateData.reviewerEmail = reviewerData?.email || '';
  templateData.formType = formType;
  templateData.status = formData.status || 'draft';
  templateData.submittedAt = formData.submittedAt ? formatDate(formData.submittedAt) : '';
  
  templateData.typeOfReview = formatTypeOfReview(formData.typeOfReview);

  // Form-specific fields
  switch (formType) {
    case 'protocol-review':
      // Section 1: Social Value
      templateData.SocialValue = formatYesNoUnable(formData.socialValue);
      templateData.SocialValueComments = formData.socialValueComments || '';
      // Backward-compatible aliases (camelCase)
      templateData.socialValue = templateData.SocialValue;
      templateData.socialValueComments = templateData.SocialValueComments;
      
      // Section 2: Scientific Soundness (2.1-2.8)
      templateData.StudyObjectives = formatYesNoUnable(formData.studyObjectives);
      templateData.StudyObjectivesComments = formData.studyObjectivesComments || '';
      templateData.LiteratureReview = formatYesNoUnable(formData.literatureReview);
      templateData.LiteratureReviewComments = formData.literatureReviewComments || '';
      templateData.ResearchDesign = formatYesNoUnable(formData.researchDesign);
      templateData.ResearchDesignComments = formData.researchDesignComments || '';
      templateData.DataCollection = formatYesNoUnable(formData.dataCollection);
      templateData.DataCollectionComments = formData.dataCollectionComments || '';
      templateData.InclusionExclusion = formatYesNoUnable(formData.inclusionExclusion);
      templateData.InclusionExclusionComments = formData.inclusionExclusionComments || '';
      templateData.WithdrawalCriteria = formatYesNoUnable(formData.withdrawalCriteria);
      templateData.WithdrawalCriteriaComments = formData.withdrawalCriteriaComments || '';
      templateData.Facilities = formatYesNoUnable(formData.facilities);
      templateData.FacilitiesComments = formData.facilitiesComments || '';
      templateData.InvestigatorQualification = formatYesNoUnable(formData.investigatorQualification);
      templateData.InvestigatorQualificationComments = formData.investigatorQualificationComments || '';
      // Aliases
      templateData.studyObjectives = templateData.StudyObjectives;
      templateData.studyObjectivesComments = templateData.StudyObjectivesComments;
      templateData.literatureReview = templateData.LiteratureReview;
      templateData.literatureReviewComments = templateData.LiteratureReviewComments;
      templateData.researchDesign = templateData.ResearchDesign;
      templateData.researchDesignComments = templateData.ResearchDesignComments;
      templateData.dataCollection = templateData.DataCollection;
      templateData.dataCollectionComments = templateData.DataCollectionComments;
      templateData.inclusionExclusion = templateData.InclusionExclusion;
      templateData.inclusionExclusionComments = templateData.InclusionExclusionComments;
      templateData.withdrawalCriteria = templateData.WithdrawalCriteria;
      templateData.withdrawalCriteriaComments = templateData.WithdrawalCriteriaComments;
      templateData.facilities = templateData.Facilities;
      templateData.facilitiesComments = templateData.FacilitiesComments;
      templateData.investigatorQualification = templateData.InvestigatorQualification;
      templateData.investigatorQualificationComments = templateData.InvestigatorQualificationComments;
      
      // Section 3: Ethical Soundness (3.1-3.9)
      templateData.PrivacyConfidentiality = formatYesNoUnable(formData.privacyConfidentiality);
      templateData.PrivacyConfidentialityComments = formData.privacyConfidentialityComments || '';
      templateData.ConflictOfInterest = formatYesNoUnable(formData.conflictOfInterest);
      templateData.ConflictOfInterestComments = formData.conflictOfInterestComments || '';
      templateData.HumanParticipants = formatYesNoUnable(formData.humanParticipants);
      templateData.HumanParticipantsComments = formData.humanParticipantsComments || '';
      templateData.VulnerablePopulations = formatYesNoUnable(formData.vulnerablePopulations);
      templateData.VulnerablePopulationsComments = formData.vulnerablePopulationsComments || '';
      templateData.VoluntaryRecruitment = formatYesNoUnable(formData.voluntaryRecruitment);
      templateData.VoluntaryRecruitmentComments = formData.voluntaryRecruitmentComments || '';
      templateData.RiskBenefit = formatYesNoUnable(formData.riskBenefit);
      templateData.RiskBenefitComments = formData.riskBenefitComments || '';
      templateData.InformedConsent = formatYesNoUnable(formData.informedConsent);
      templateData.InformedConsentComments = formData.informedConsentComments || '';
      templateData.CommunityConsiderations = formatYesNoUnable(formData.communityConsiderations);
      templateData.CommunityConsiderationsComments = formData.communityConsiderationsComments || '';
      templateData.CollaborativeTerms = formatYesNoUnable(formData.collaborativeTerms);
      templateData.CollaborativeTermsComments = formData.collaborativeTermsComments || '';
      // Aliases
      templateData.privacyConfidentiality = templateData.PrivacyConfidentiality;
      templateData.privacyConfidentialityComments = templateData.PrivacyConfidentialityComments;
      templateData.conflictOfInterest = templateData.ConflictOfInterest;
      templateData.conflictOfInterestComments = templateData.ConflictOfInterestComments;
      templateData.humanParticipants = templateData.HumanParticipants;
      templateData.humanParticipantsComments = templateData.HumanParticipantsComments;
      templateData.vulnerablePopulations = templateData.VulnerablePopulations;
      templateData.vulnerablePopulationsComments = templateData.VulnerablePopulationsComments;
      templateData.voluntaryRecruitment = templateData.VoluntaryRecruitment;
      templateData.voluntaryRecruitmentComments = templateData.VoluntaryRecruitmentComments;
      templateData.riskBenefit = templateData.RiskBenefit;
      templateData.riskBenefitComments = templateData.RiskBenefitComments;
      templateData.informedConsent = templateData.InformedConsent;
      templateData.informedConsentComments = templateData.InformedConsentComments;
      templateData.communityConsiderations = templateData.CommunityConsiderations;
      templateData.communityConsiderationsComments = templateData.CommunityConsiderationsComments;
      templateData.collaborativeTerms = templateData.CollaborativeTerms;
      templateData.collaborativeTermsComments = templateData.CollaborativeTermsComments;
      
      // Recommendation
      templateData.recommendation = formatRecommendation(formData.recommendation);
      templateData.justification = formData.justification || '';
      break;

    case 'informed-consent':
      // Guide Questions (q1-q17)
      for (let i = 1; i <= 17; i++) {
        const qKey = `q${i}`;
        const commentsKey = `${qKey}Comments`;
        templateData[qKey] = formatYesNoUnable(formData[qKey]);
        templateData[commentsKey] = formData[commentsKey] || '';
      }
      
      // Recommendation
      templateData.recommendation = formatRecommendation(formData.recommendation);
      templateData.recommendationJustification = formData.recommendationJustification || '';
      break;

    case 'exemption-checklist':
      // Scope and type items
      templateData.involvesHumanParticipants = formData.involvesHumanParticipants === 'yes' ? 'Yes' : 'No';
      templateData.involvesHumanParticipantsComments = formData.involvesHumanParticipantsComments || '';
      templateData.involvesNonIdentifiableTissue = formData.involvesNonIdentifiableTissue === 'yes' ? 'Yes' : 'No';
      templateData.involvesNonIdentifiableTissueComments = formData.involvesNonIdentifiableTissueComments || '';
      templateData.involvesPublicData = formData.involvesPublicData === 'yes' ? 'Yes' : 'No';
      templateData.involvesPublicDataComments = formData.involvesPublicDataComments || '';
      templateData.involvesInteraction = formData.involvesInteraction === 'yes' ? 'Yes' : 'No';
      templateData.involvesInteractionComments = formData.involvesInteractionComments || '';
      templateData.qualityAssurance = formData.qualityAssurance === 'yes' ? 'Yes' : 'No';
      templateData.qualityAssuranceComments = formData.qualityAssuranceComments || '';
      templateData.publicServiceEvaluation = formData.publicServiceEvaluation === 'yes' ? 'Yes' : 'No';
      templateData.publicServiceEvaluationComments = formData.publicServiceEvaluationComments || '';
      templateData.publicHealthSurveillance = formData.publicHealthSurveillance === 'yes' ? 'Yes' : 'No';
      templateData.publicHealthSurveillanceComments = formData.publicHealthSurveillanceComments || '';
      templateData.educationalEvaluation = formData.educationalEvaluation === 'yes' ? 'Yes' : 'No';
      templateData.educationalEvaluationComments = formData.educationalEvaluationComments || '';
      templateData.consumerAcceptability = formData.consumerAcceptability === 'yes' ? 'Yes' : 'No';
      templateData.consumerAcceptabilityComments = formData.consumerAcceptabilityComments || '';
      templateData.surveysQuestionnaire = formData.surveysQuestionnaire === 'yes' ? 'Yes' : 'No';
      templateData.surveysQuestionnaireComments = formData.surveysQuestionnaireComments || '';
      templateData.interviewsFocusGroup = formData.interviewsFocusGroup === 'yes' ? 'Yes' : 'No';
      templateData.interviewsFocusGroupComments = formData.interviewsFocusGroupComments || '';
      templateData.publicObservations = formData.publicObservations === 'yes' ? 'Yes' : 'No';
      templateData.publicObservationsComments = formData.publicObservationsComments || '';
      templateData.existingData = formData.existingData === 'yes' ? 'Yes' : 'No';
      templateData.existingDataComments = formData.existingDataComments || '';
      templateData.audioVideo = formData.audioVideo === 'yes' ? 'Yes' : 'No';
      templateData.audioVideoComments = formData.audioVideoComments || '';
      templateData.dataAnonymization = formatDataAnonymization(formData.dataAnonymization);
      templateData.foreseeableRisk = formData.foreseeableRisk === 'yes' ? 'Yes' : 'No';
      templateData.foreseeableRiskComments = formData.foreseeableRiskComments || '';
      
      // Risk Assessment
      templateData.riskVulnerableGroups = formData.riskVulnerableGroups === 'yes' ? 'Yes' : 'No';
      templateData.riskVulnerableGroupsComments = formData.riskVulnerableGroupsComments || '';
      templateData.riskSensitiveTopics = formData.riskSensitiveTopics === 'yes' ? 'Yes' : 'No';
      templateData.riskSensitiveTopicsComments = formData.riskSensitiveTopicsComments || '';
      templateData.riskUseOfDrugs = formData.riskUseOfDrugs === 'yes' ? 'Yes' : 'No';
      templateData.riskUseOfDrugsComments = formData.riskUseOfDrugsComments || '';
      templateData.riskInvasiveProcedure = formData.riskInvasiveProcedure === 'yes' ? 'Yes' : 'No';
      templateData.riskInvasiveProcedureComments = formData.riskInvasiveProcedureComments || '';
      templateData.riskPhysicalDistress = formData.riskPhysicalDistress === 'yes' ? 'Yes' : 'No';
      templateData.riskPhysicalDistressComments = formData.riskPhysicalDistressComments || '';
      templateData.riskPsychologicalDistress = formData.riskPsychologicalDistress === 'yes' ? 'Yes' : 'No';
      templateData.riskPsychologicalDistressComments = formData.riskPsychologicalDistressComments || '';
      templateData.riskDeception = formData.riskDeception === 'yes' ? 'Yes' : 'No';
      templateData.riskDeceptionComments = formData.riskDeceptionComments || '';
      templateData.riskAccessData = formData.riskAccessData === 'yes' ? 'Yes' : 'No';
      templateData.riskAccessDataComments = formData.riskAccessDataComments || '';
      templateData.riskConflictInterest = formData.riskConflictInterest === 'yes' ? 'Yes' : 'No';
      templateData.riskConflictInterestComments = formData.riskConflictInterestComments || '';
      templateData.riskOtherDilemmas = formData.riskOtherDilemmas === 'yes' ? 'Yes' : 'No';
      templateData.riskOtherDilemmasComments = formData.riskOtherDilemmasComments || '';
      templateData.riskBloodSampling = formData.riskBloodSampling === 'yes' ? 'Yes' : 'No';
      templateData.riskBloodSamplingComments = formData.riskBloodSamplingComments || '';
      
      // Decision
      templateData.decision = formatDecision(formData.decision);
      templateData.decisionJustification = formData.decisionJustification || '';
      break;

    case 'iacuc-review':
      // Section 1: Scientific Value
      templateData.ScientificValue = formatYesNoUnable(formData.scientificValue);
      templateData.ScientificValueComments = formData.scientificValueComments || '';
      
      // Section 2: Scientific Soundness (2.1-2.6 only)
      templateData.StudyObjectives = formatYesNoUnable(formData.studyObjectives);
      templateData.StudyObjectivesComments = formData.studyObjectivesComments || '';
      templateData.LiteratureReview = formatYesNoUnable(formData.literatureReview);
      templateData.LiteratureReviewComments = formData.literatureReviewComments || '';
      templateData.ResearchDesign = formatYesNoUnable(formData.researchDesign);
      templateData.ResearchDesignComments = formData.researchDesignComments || '';
      templateData.DataCollection = formatYesNoUnable(formData.dataCollection);
      templateData.DataCollectionComments = formData.dataCollectionComments || '';
      templateData.FacilitiesInfrastructure = formatYesNoUnable(formData.facilitiesInfrastructure);
      templateData.FacilitiesInfrastructureComments = formData.facilitiesInfrastructureComments || '';
      templateData.InvestigatorQualifications = formatYesNoUnable(formData.investigatorQualifications);
      templateData.InvestigatorQualificationsComments = formData.investigatorQualificationsComments || '';
      
      // Section 3: Justification on the Use of Animals (3.1-3.12)
      templateData.AnimalDescription = formatYesNoUnable(formData.animalSource);
      templateData.AnimalDescriptionComments = formData.animalSourceComments || '';
      templateData.AnimalCareProcedures = formatYesNoUnable(formData.housingCare);
      templateData.AnimalCareProceduresComments = formData.housingCareComments || '';
      templateData.AnimalDiet = formatYesNoUnable(formData.restraintProcedures);
      templateData.AnimalDietComments = formData.restraintProceduresComments || '';
      templateData.AnimalManipulationMethods = formatYesNoUnable(formData.anesthesiaAnalgesia);
      templateData.AnimalManipulationMethodsComments = formData.anesthesiaAnalgesiaComments || '';
      templateData.DosingMethods = formatYesNoUnable(formData.postProcedureMonitoring);
      templateData.DosingMethodsComments = formData.postProcedureMonitoringComments || '';
      templateData.ExpectedOutcomeOrEffects = formatYesNoUnable(formData.euthanasia);
      templateData.ExpectedOutcomeOrEffectsComments = formData.euthanasiaComments || '';
      templateData.CollectionOfBiologicalAgent = formatYesNoUnable(formData.biologicalAgentCollection);
      templateData.CollectionOfBiologicalAgentComments = formData.biologicalAgentCollectionComments || '';
      templateData.AnimalExaminationMethods = formatYesNoUnable(formData.examinationMethods);
      templateData.AnimalExaminationMethodsComments = formData.examinationMethodsComments || '';
      templateData.SurgicalProcedures = formatYesNoUnable(formData.surgicalProcedures);
      templateData.SurgicalProceduresComments = formData.surgicalProceduresComments || '';
      templateData.HumaneEndpoints = formatYesNoUnable(formData.humaneEndpoints);
      templateData.HumaneEndpointsComments = formData.humaneEndpointsComments || '';
      templateData.PotentialHazards = formatYesNoUnable(formData.potentialHazards);
      templateData.PotentialHazardsComments = formData.potentialHazardsComments || '';
      templateData.WasteDisposal = formatYesNoUnable(formData.wasteDisposal);
      templateData.WasteDisposalComments = formData.wasteDisposalComments || '';
      
      // Recommendation
      templateData.recommendation = formatRecommendation(formData.recommendation);
      templateData.justification = formData.justification || '';
      break;
  }

  // Ensure all values are strings (empty string for undefined/null)
  Object.keys(templateData).forEach(key => {
    if (templateData[key] === undefined || templateData[key] === null) {
      templateData[key] = '';
    }
  });

  return templateData;
}

/**
 * Export assessment form to Word document template
 */
export async function exportAssessmentFormToTemplate(
  formData: Record<string, any>,
  formType: string,
  protocolData?: any,
  reviewerData?: any
): Promise<Blob> {
  const templatePath = ASSESSMENT_TEMPLATE_FILES[formType];
  
  if (!templatePath) {
    throw new Error(`No template found for form type: ${formType}`);
  }

  try {
    // Fetch the template file
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load template: ${templatePath}`);
    }

    const templateBuffer = await response.arrayBuffer();
    
    // Load the docx file as binary
    const zip = new PizZip(templateBuffer);
    
    // Initialize docxtemplater with {{ }} delimiters (as specified in placeholder.txt)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '{{',
        end: '}}'
      }
    });

    // Prepare template data
    const templateData = prepareFormDataForTemplate(formData, formType, protocolData, reviewerData);
    
    // Set the template variables
    doc.setData(templateData);
    
    // Render the document
    doc.render();
    
    // Generate the document as a blob
    const generatedDoc = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    
    return generatedDoc;
  } catch (error: any) {
    // Provide detailed Docxtemplater errors to help identify wrong placeholders
    if (error && error.properties && Array.isArray(error.properties.errors)) {
      console.group('Docxtemplater export errors');
      error.properties.errors.forEach((e: any, idx: number) => {
        console.error(`#${idx + 1}`, {
          id: e.id,
          explanation: e.properties && e.properties.explanation,
          tag: e.properties && e.properties.tag,
        });
      });
      console.groupEnd();
    } else {
      console.error('Error exporting assessment form to template:', error);
    }
    throw new Error(`Assessment form export failed: ${error && error.message ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download exported assessment form
 */
export function downloadAssessmentForm(blob: Blob, fileName: string): void {
  saveAs(blob, fileName);
}

