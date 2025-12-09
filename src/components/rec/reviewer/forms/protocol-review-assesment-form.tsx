'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Save, Send, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import useLocalDraft from '@/hooks/useLocalDraft';
import SubmissionConfirmationDialog from '@/components/ui/submission-confirmation-dialog';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Zod schema for full protocol review form
const protocolReviewSchema = z.object({
  protocolCode: z.string().min(1, 'Required'),
  submissionDate: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  studySite: z.string().min(1, 'Required'),
  principalInvestigator: z.string().min(1, 'Required'),
  sponsor: z.string().min(1, 'Required'),
  typeOfReview: z.enum(['expedited', 'full']),
  socialValue: z.enum(['yes', 'no', 'unable']),
  socialValueComments: z.string().optional(),
  studyObjectives: z.enum(['yes', 'no', 'unable']),
  studyObjectivesComments: z.string().optional(),
  literatureReview: z.enum(['yes', 'no', 'unable']),
  literatureReviewComments: z.string().optional(),
  researchDesign: z.enum(['yes', 'no', 'unable']),
  researchDesignComments: z.string().optional(),
  dataCollection: z.enum(['yes', 'no', 'unable']),
  dataCollectionComments: z.string().optional(),
  inclusionExclusion: z.enum(['yes', 'no', 'unable']),
  inclusionExclusionComments: z.string().optional(),
  withdrawalCriteria: z.enum(['yes', 'no', 'unable']),
  withdrawalCriteriaComments: z.string().optional(),
  facilities: z.enum(['yes', 'no', 'unable']),
  facilitiesComments: z.string().optional(),
  investigatorQualification: z.enum(['yes', 'no', 'unable']),
  investigatorQualificationComments: z.string().optional(),
  privacyConfidentiality: z.enum(['yes', 'no', 'unable']),
  privacyConfidentialityComments: z.string().optional(),
  conflictOfInterest: z.enum(['yes', 'no', 'unable']),
  conflictOfInterestComments: z.string().optional(),
  humanParticipants: z.enum(['yes', 'no', 'unable']),
  humanParticipantsComments: z.string().optional(),
  vulnerablePopulations: z.enum(['yes', 'no', 'unable']),
  vulnerablePopulationsComments: z.string().optional(),
  voluntaryRecruitment: z.enum(['yes', 'no', 'unable']),
  voluntaryRecruitmentComments: z.string().optional(),
  riskBenefit: z.enum(['yes', 'no', 'unable']),
  riskBenefitComments: z.string().optional(),
  informedConsent: z.enum(['yes', 'no', 'unable']),
  informedConsentComments: z.string().optional(),
  communityConsiderations: z.enum(['yes', 'no', 'unable']),
  communityConsiderationsComments: z.string().optional(),
  collaborativeTerms: z.enum(['yes', 'no', 'unable']),
  collaborativeTermsComments: z.string().optional(),
  recommendation: z.enum(['approved', 'minor', 'major', 'disapproved']),
  justification: z.string().optional(),
});

type ProtocolReviewFormValues = z.infer<typeof protocolReviewSchema>;

interface ProtocolReviewFormProps {
  readOnly?: boolean;
  defaultValues?: Record<string, any>;
  protocolId?: string;
  reviewerId?: string;
  reviewerName?: string;
  skipFirebaseLoad?: boolean; // Skip Firebase loading if data is already provided
}

export default function ProtocolReviewForm({ 
  readOnly = false, 
  defaultValues = {},
  protocolId,
  reviewerId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reviewerName: _reviewerName,
  skipFirebaseLoad = false
}: ProtocolReviewFormProps) {
  const router = useRouter();
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [assessmentStatus, setAssessmentStatus] = useState<string | null>(null);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(true);
  const form = useForm<ProtocolReviewFormValues>({
    resolver: zodResolver(protocolReviewSchema),
    defaultValues: {
      protocolCode: defaultValues.protocolCode || '',
      submissionDate: defaultValues.submissionDate || '',
      title: defaultValues.title || '',
      studySite: defaultValues.studySite || '',
      principalInvestigator: defaultValues.principalInvestigator || '',
      sponsor: defaultValues.sponsor || '',
      typeOfReview: defaultValues.typeOfReview || undefined,
      socialValue: defaultValues.socialValue || undefined,
      studyObjectives: defaultValues.studyObjectives || undefined,
      literatureReview: defaultValues.literatureReview || undefined,
      researchDesign: defaultValues.researchDesign || undefined,
      dataCollection: defaultValues.dataCollection || undefined,
      inclusionExclusion: defaultValues.inclusionExclusion || undefined,
      withdrawalCriteria: defaultValues.withdrawalCriteria || undefined,
      facilities: defaultValues.facilities || undefined,
      investigatorQualification: defaultValues.investigatorQualification || undefined,
      privacyConfidentiality: defaultValues.privacyConfidentiality || undefined,
      conflictOfInterest: defaultValues.conflictOfInterest || undefined,
      humanParticipants: defaultValues.humanParticipants || undefined,
      vulnerablePopulations: defaultValues.vulnerablePopulations || undefined,
      voluntaryRecruitment: defaultValues.voluntaryRecruitment || undefined,
      riskBenefit: defaultValues.riskBenefit || undefined,
      informedConsent: defaultValues.informedConsent || undefined,
      communityConsiderations: defaultValues.communityConsiderations || undefined,
      collaborativeTerms: defaultValues.collaborativeTerms || undefined,
      recommendation: defaultValues.recommendation || undefined,
      socialValueComments: defaultValues.socialValueComments || '',
      studyObjectivesComments: defaultValues.studyObjectivesComments || '',
      literatureReviewComments: defaultValues.literatureReviewComments || '',
      researchDesignComments: defaultValues.researchDesignComments || '',
      dataCollectionComments: defaultValues.dataCollectionComments || '',
      inclusionExclusionComments: defaultValues.inclusionExclusionComments || '',
      withdrawalCriteriaComments: defaultValues.withdrawalCriteriaComments || '',
      facilitiesComments: defaultValues.facilitiesComments || '',
      investigatorQualificationComments: defaultValues.investigatorQualificationComments || '',
      privacyConfidentialityComments: defaultValues.privacyConfidentialityComments || '',
      conflictOfInterestComments: defaultValues.conflictOfInterestComments || '',
      humanParticipantsComments: defaultValues.humanParticipantsComments || '',
      vulnerablePopulationsComments: defaultValues.vulnerablePopulationsComments || '',
      voluntaryRecruitmentComments: defaultValues.voluntaryRecruitmentComments || '',
      riskBenefitComments: defaultValues.riskBenefitComments || '',
      informedConsentComments: defaultValues.informedConsentComments || '',
      communityConsiderationsComments: defaultValues.communityConsiderationsComments || '',
      collaborativeTermsComments: defaultValues.collaborativeTermsComments || '',
      justification: defaultValues.justification || '',
    },
  });

  // Handle successful submission
  const handleSubmissionSuccess = () => {
    // Navigate back to dashboard after successful submission
    router.push('/rec/reviewers');
  };

  // Use local draft hook
  const { isSubmitting, isAutoSaving, lastSaved, submitForm, saveDraft, autoSave, loadDraft } = useLocalDraft({
    protocolId: protocolId || '',
    formType: 'protocol-review',
    reviewerId: reviewerId || '',
    onSubmissionSuccess: handleSubmissionSuccess,
    skipFirebaseLoad: skipFirebaseLoad,
  });

  // Load existing assessment data OR prefill on mount
  useEffect(() => {
    const loadOrPrefill = async () => {
      if (!readOnly && protocolId && reviewerId) {
        try {
          setIsLoadingExistingData(true);

          // If parent asked to skip Firebase load and provided defaultValues, use immediately
          if (skipFirebaseLoad && Object.keys(defaultValues).length > 0) {
            form.reset({ ...(form.getValues() as any), ...(defaultValues as any) });
            setIsLoadingExistingData(false);
            return;
          }
          
          // Step 1: Try to load existing draft from Firebase/localStorage
          const existingData = await loadDraft();
          
          if (existingData && Object.keys(existingData).length > 0) {
            // Found existing draft - use it
            form.reset({ ...(form.getValues() as any), ...(existingData as any) });
            
            // Check assessment status
            const { default: AssessmentSubmissionService } = await import('@/lib/services/assessments/assessmentSubmissionService');
            const assessment = await AssessmentSubmissionService.getAssessment(protocolId, 'protocol-review', reviewerId || '');
            if (assessment) {
              setAssessmentStatus(assessment.status);
            }
          } else if (Object.keys(defaultValues).length > 0) {
            // No existing draft - use prefill data
            form.reset({ ...(form.getValues() as any), ...(defaultValues as any) });
          }
        } catch (error) {
          console.error('Error loading/prefilling form:', error);
        } finally {
          setIsLoadingExistingData(false);
        }
      } else {
        setIsLoadingExistingData(false);
      }
    };
    
    loadOrPrefill();
  }, [loadDraft, form, readOnly, protocolId, reviewerId, defaultValues, skipFirebaseLoad]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!readOnly && protocolId && reviewerId) {
        autoSave(value);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, autoSave, readOnly, protocolId, reviewerId]);

  const onSubmit = async (values: ProtocolReviewFormValues) => {
    if (readOnly) return;
    
    // Validate required fields
    const errors: string[] = [];
    
    // Check required text fields
    if (!values.protocolCode) errors.push('Protocol Code is required');
    if (!values.submissionDate) errors.push('Submission Date is required');
    if (!values.title) errors.push('Protocol Title is required');
    if (!values.studySite) errors.push('Study Site is required');
    if (!values.principalInvestigator) errors.push('Principal Investigator is required');
    if (!values.sponsor) errors.push('Sponsor is required');
    
    // Check assessment fields (all should be selected, not 'unable')
    const assessmentFields = [
      'socialValue', 'studyObjectives', 'literatureReview', 'researchDesign',
      'dataCollection', 'inclusionExclusion', 'withdrawalCriteria', 'facilities',
      'investigatorQualification', 'privacyConfidentiality', 'conflictOfInterest',
      'humanParticipants', 'vulnerablePopulations', 'voluntaryRecruitment',
      'riskBenefit', 'informedConsent', 'communityConsiderations', 'collaborativeTerms'
    ];
    
    assessmentFields.forEach(field => {
      if (values[field as keyof ProtocolReviewFormValues] === 'unable') {
        errors.push(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} must be assessed`);
      }
    });
    
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Show confirmation dialog if validation passes
    setShowConfirmationDialog(true);
  };

  const handleConfirmSubmission = async () => {
    const values = form.getValues();
    try {
      await submitForm(values);
      setShowConfirmationDialog(false);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleSaveDraft = async () => {
    const values = form.getValues();
    await saveDraft(values);
  };

  const renderYesNoUnable = (name: keyof ProtocolReviewFormValues, label: string, description: string) => {
    const hasError = validationErrors.some(error => 
      error.toLowerCase().includes(name.toString().toLowerCase()) || 
      error.toLowerCase().includes(label.toLowerCase())
    );
    
    return (
      <FormField name={name} render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className={hasError ? "text-destructive" : ""}>{label}</FormLabel>
          <p className="text-sm">{description}</p>
          <FormControl>
            <RadioGroup 
              value={field.value} 
              onValueChange={field.onChange} 
              disabled={readOnly}
              className={`flex space-x-6 ${hasError ? 'border border-red-500 rounded-md p-2' : ''}`}
            >
              <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel>Yes</FormLabel></FormItem>
              <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel>No</FormLabel></FormItem>
              <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="unable" /></FormControl><FormLabel>Unable to assess</FormLabel></FormItem>
            </RadioGroup>
          </FormControl>
          <FormControl>
            <Textarea 
              placeholder="Comments..." 
              {...form.register(`${name}Comments` as any)} 
              disabled={readOnly}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    );
  };

  return (
    <div className="p-6">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
        
        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-destructive mb-2">Please fix the following errors:</h4>
                <ul className="text-sm text-destructive/90 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Status Indicator */}
        {isLoadingExistingData ? (
          <div className="bg-[#036635]/10 dark:bg-[#FECC07]/20 border border-[#036635]/20 dark:border-[#FECC07]/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#036635] dark:text-[#FECC07] animate-spin" />
              <div>
                <h4 className="text-sm font-medium text-[#036635] dark:text-[#FECC07]">Loading existing assessment...</h4>
                <p className="text-xs text-[#036635]/80 dark:text-[#FECC07]/80">Please wait while we load your previous work.</p>
              </div>
            </div>
          </div>
        ) : assessmentStatus ? (
          <div className={`border rounded-lg p-4 mb-4 ${
            assessmentStatus === 'submitted' ? 'bg-[#036635]/10 dark:bg-[#FECC07]/20 border-[#036635]/20 dark:border-[#FECC07]/30' :
            assessmentStatus === 'approved' ? 'bg-[#036635]/10 dark:bg-[#FECC07]/20 border-[#036635]/20 dark:border-[#FECC07]/30' :
            assessmentStatus === 'returned' ? 'bg-destructive/10 border-destructive/30' :
            'bg-[#036635]/5 dark:bg-[#FECC07]/10 border-[#036635]/20 dark:border-[#FECC07]/30'
          }`}>
            <div className="flex items-center gap-3">
              {assessmentStatus === 'submitted' && <CheckCircle className="w-5 h-5 text-[#036635] dark:text-[#FECC07]" />}
              {assessmentStatus === 'approved' && <CheckCircle className="w-5 h-5 text-[#036635] dark:text-[#FECC07]" />}
              {assessmentStatus === 'returned' && <AlertTriangle className="w-5 h-5 text-destructive" />}
              {assessmentStatus === 'draft' && <Clock className="w-5 h-5 text-[#036635] dark:text-[#FECC07]" />}
              <div>
                <h4 className={`text-sm font-medium ${
                  assessmentStatus === 'submitted' ? 'text-[#036635] dark:text-[#FECC07]' :
                  assessmentStatus === 'approved' ? 'text-[#036635] dark:text-[#FECC07]' :
                  assessmentStatus === 'returned' ? 'text-destructive' :
                  'text-[#036635] dark:text-[#FECC07]'
                }`}>
                  Assessment Status: {
                    assessmentStatus === 'draft' ? 'In Progress' :
                    assessmentStatus === 'submitted' ? 'Submitted' :
                    assessmentStatus === 'approved' ? 'Approved' :
                    assessmentStatus === 'returned' ? 'Returned' :
                    assessmentStatus.charAt(0).toUpperCase() + assessmentStatus.slice(1)
                  }
                </h4>
                <p className={`text-xs ${
                  assessmentStatus === 'submitted' ? 'text-[#036635]/80 dark:text-[#FECC07]/80' :
                  assessmentStatus === 'approved' ? 'text-[#036635]/80 dark:text-[#FECC07]/80' :
                  assessmentStatus === 'returned' ? 'text-destructive/90' :
                  'text-[#036635]/80 dark:text-[#FECC07]/80'
                }`}>
                  {assessmentStatus === 'submitted' && 'Your assessment has been submitted and is under review.'}
                  {assessmentStatus === 'approved' && 'Your assessment has been approved by the chairperson.'}
                  {assessmentStatus === 'returned' && 'Your assessment was returned. Please review the reason and resubmit.'}
                  {assessmentStatus === 'draft' && 'This is a draft assessment. You can continue editing and submit when ready.'}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* I. Protocol Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField name="protocolCode" render={({ field }) => (
            <FormItem>
              <FormLabel>SPUP REC Protocol Code</FormLabel>
              <FormControl><Input placeholder="Enter protocol code" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="submissionDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Submission Date</FormLabel>
              <FormControl><Input type="date" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Protocol Title</FormLabel>
              <FormControl><Input placeholder="Enter study title" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="studySite" render={({ field }) => (
            <FormItem>
              <FormLabel>Study Site</FormLabel>
              <FormControl><Input placeholder="Enter study site" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="principalInvestigator" render={({ field }) => (
            <FormItem>
              <FormLabel>Name of Principal Investigator</FormLabel>
              <FormControl><Input placeholder="Enter PI name" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="sponsor" render={({ field }) => (
            <FormItem>
              <FormLabel>Sponsor / CRO / Institution</FormLabel>
              <FormControl><Input placeholder="Enter sponsor or institution" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Review Type */}
        <div className="space-y-2">
          <FormField name="typeOfReview" render={({ field }) => (
            <FormItem>
              <FormLabel>Type of Review</FormLabel>
              <FormControl>
                <RadioGroup 
                  value={field.value} 
                  onValueChange={field.onChange} 
                  disabled={readOnly}
                  className="flex space-x-6"
                >
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="expedited" /></FormControl><FormLabel>Expedited</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="full" /></FormControl><FormLabel>Full Review</FormLabel></FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* II. Assessment Points */}
        <div className="space-y-6">
          {/* 1. Social Value */}
          {renderYesNoUnable('socialValue', '1. SOCIAL VALUE', 'Does the study have scientific or social value?')}

          {/* 2. Scientific Soundness Subsections */}
          <FormLabel className="text-lg font-semibold">2. SCIENTIFIC SOUNDNESS</FormLabel>
          {renderYesNoUnable('studyObjectives', '2.1 Study Objectives', 'Is/are the proposal\'s scientific question/s reasonable?')}
          {renderYesNoUnable('literatureReview', '2.2 Literature Review', 'Does the protocol adequately present informational background as to the result of previous studies prior to human experimentation?')}
          {renderYesNoUnable('researchDesign', '2.3 Research and Sampling design', 'Is the study design, sampling method and techniques appropriate?')}
          {renderYesNoUnable('dataCollection', '2.4 Specimen/Data Collection, Processing, Storage', 'Are the procedures in collecting, processing, and storing data adequate?')}
          {renderYesNoUnable('inclusionExclusion', '2.5 Inclusion/Exclusion Criteria', 'Are the features of the target population appropriate?')}
          {renderYesNoUnable('withdrawalCriteria', '2.6 Withdrawal Criteria', 'Is there a provision for withdrawal from the research?')}
          {renderYesNoUnable('facilities', '2.7 Facilities/Infrastructure at Study Site', 'Are the research facilities adequate?')}
          {renderYesNoUnable('investigatorQualification', '2.8 Investigator\'s Qualification, Competence, and Experience', 'Is/are the investigator/s adequately trained and do they have sufficient experience?')}

          {/* 3. Ethical Soundness Subsections */}
          <FormLabel className="text-lg font-semibold">3. ETHICAL SOUNDNESS</FormLabel>
          {renderYesNoUnable('privacyConfidentiality', '3.1 Privacy and Confidentiality Safeguards', 'Does the research ensure to protect privacy and confidentiality of participant information?')}
          {renderYesNoUnable('conflictOfInterest', '3.2 Conflict of Interest', 'Does the research ensure mechanism of management of conflict arising from financial, familial, or proprietary considerations from PI, sponsor, or the study site?')}
          {renderYesNoUnable('humanParticipants', '3.3 Involvement of Human Participants', 'Does the research need to be carried out with human participants?')}
          {renderYesNoUnable('vulnerablePopulations', '3.4 Involvement of Vulnerable Populations', 'Does the study involve individuals who belong to vulnerable group?')}
          {renderYesNoUnable('voluntaryRecruitment', '3.5 Participant Selection-voluntary, non-coercive recruitment', 'Are appropriate mechanisms in place to protect above individual in vulnerable group?')}
          {renderYesNoUnable('riskBenefit', '3.6 Risk-Benefit Ratio', 'Does the protocol adequately address the risk/ benefit balance?')}
          {renderYesNoUnable('informedConsent', '3.7 Informed Consent Process', 'Is the informed consent procedure/ assent form adequately and culturally appropriate?')}
          {renderYesNoUnable('communityConsiderations', '3.8 Community Considerations', 'Does the study offer substantial and relevant contribution to local communities and address possible stigma or draining of local capacity?')}
          {renderYesNoUnable('collaborativeTerms', '3.9 Collaborative Study Terms of Reference', 'Does the study present clear terms on IP rights, publication rights, information and responsibility sharing, transparency, and capacity building?')}
        </div>

        {/* III. Recommendation */}
        <div className="space-y-2">
          <FormLabel className="font-medium">III. RECOMMENDATION</FormLabel>
          <FormField name="recommendation" render={({ field }) => (
            <FormItem className="space-y-2">
              <FormControl>
                <RadioGroup 
                  value={field.value} 
                  onValueChange={field.onChange} 
                  disabled={readOnly}
                  className="flex space-x-6"
                >
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="approved" /></FormControl><FormLabel>Approved</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="minor" /></FormControl><FormLabel>Minor Modifications Required</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="major" /></FormControl><FormLabel>Major Modifications Required</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="disapproved" /></FormControl><FormLabel>Disapproved</FormLabel></FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>Justification for the Recommendation</FormDescription>
              <FormControl>
                <Textarea 
                  placeholder="Provide justification..." 
                  {...form.register('justification')} 
                  disabled={readOnly}
                />
              </FormControl>
            </FormItem>
          )} />
        </div>

        {!readOnly && (
          <div className="space-y-4">
            {/* Auto-save indicator */}
            {(isAutoSaving || lastSaved) && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                {isAutoSaving ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Auto-saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : null}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSaveDraft}
                className="flex-1 border-[#036635] dark:border-[#FECC07] text-[#036635] dark:text-[#FECC07] hover:bg-[#036635] dark:hover:bg-[#FECC07] hover:text-white dark:hover:text-black"
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>

    {/* Submission Confirmation Dialog */}
    <SubmissionConfirmationDialog
      open={showConfirmationDialog}
      onOpenChange={setShowConfirmationDialog}
      onConfirm={handleConfirmSubmission}
      onCancel={() => setShowConfirmationDialog(false)}
      isSubmitting={isSubmitting}
      formType="protocol-review"
    />
    </div>
  );
}
