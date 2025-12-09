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
import { Save, Send, Clock } from 'lucide-react';
import useLocalDraft from '@/hooks/useLocalDraft';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Zod schema for Exemption Checklist
const exemptionSchema = z.object({
  protocolCode: z.string().min(1, 'Required'),
  submissionDate: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  studySite: z.string().min(1, 'Required'),
  principalInvestigator: z.string().min(1, 'Required'),
  sponsor: z.string().min(1, 'Required'),

  // Section 1: Scope of Exemption
  involvesHumanParticipants: z.enum(['yes', 'no']),
  involvesHumanParticipantsComments: z.string().optional(),
  involvesNonIdentifiableTissue: z.enum(['yes', 'no']),
  involvesNonIdentifiableTissueComments: z.string().optional(),
  involvesPublicData: z.enum(['yes', 'no']),
  involvesPublicDataComments: z.string().optional(),
  involvesInteraction: z.enum(['yes', 'no']),
  involvesInteractionComments: z.string().optional(),

  // Section 2: Type of Research
  qualityAssurance: z.enum(['yes', 'no']),
  qualityAssuranceComments: z.string().optional(),
  publicServiceEvaluation: z.enum(['yes', 'no']),
  publicServiceEvaluationComments: z.string().optional(),
  publicHealthSurveillance: z.enum(['yes', 'no']),
  publicHealthSurveillanceComments: z.string().optional(),
  educationalEvaluation: z.enum(['yes', 'no']),
  educationalEvaluationComments: z.string().optional(),
  consumerAcceptability: z.enum(['yes', 'no']),
  consumerAcceptabilityComments: z.string().optional(),

  // Section 3: Data Collection Methods
  surveysQuestionnaire: z.enum(['yes', 'no']),
  surveysQuestionnaireComments: z.string().optional(),
  interviewsFocusGroup: z.enum(['yes', 'no']),
  interviewsFocusGroupComments: z.string().optional(),
  publicObservations: z.enum(['yes', 'no']),
  publicObservationsComments: z.string().optional(),
  existingData: z.enum(['yes', 'no']),
  existingDataComments: z.string().optional(),
  audioVideo: z.enum(['yes', 'no']),
  audioVideoComments: z.string().optional(),

  // Section 4: Data Anonymization and Risk
  dataAnonymization: z.enum(['anonymized', 'identifiable', 'de-identified']),
  foreseeableRisk: z.enum(['yes', 'no']),
  foreseeableRiskComments: z.string().optional(),

  // Section 5: Additional Risk Categories
  riskVulnerableGroups: z.enum(['yes', 'no']),
  riskVulnerableGroupsComments: z.string().optional(),
  riskSensitiveTopics: z.enum(['yes', 'no']),
  riskSensitiveTopicsComments: z.string().optional(),
  riskUseOfDrugs: z.enum(['yes', 'no']),
  riskUseOfDrugsComments: z.string().optional(),
  riskInvasiveProcedure: z.enum(['yes', 'no']),
  riskInvasiveProcedureComments: z.string().optional(),
  riskPhysicalDistress: z.enum(['yes', 'no']),
  riskPhysicalDistressComments: z.string().optional(),
  riskPsychologicalDistress: z.enum(['yes', 'no']),
  riskPsychologicalDistressComments: z.string().optional(),
  riskDeception: z.enum(['yes', 'no']),
  riskDeceptionComments: z.string().optional(),
  riskAccessData: z.enum(['yes', 'no']),
  riskAccessDataComments: z.string().optional(),
  riskConflictInterest: z.enum(['yes', 'no']),
  riskConflictInterestComments: z.string().optional(),
  riskOtherDilemmas: z.enum(['yes', 'no']),
  riskOtherDilemmasComments: z.string().optional(),
  riskBloodSampling: z.enum(['yes', 'no']),
  riskBloodSamplingComments: z.string().optional(),

  // Decision
  decision: z.enum(['qualified', 'unqualified']),
  decisionJustification: z.string().min(1, 'Required'),
});

type ExemptionFormValues = z.infer<typeof exemptionSchema>;

interface ExemptionChecklistFormProps {
  readOnly?: boolean;
  defaultValues?: Record<string, any>;
  protocolId?: string;
  reviewerId?: string;
  reviewerName?: string;
  skipFirebaseLoad?: boolean;
}

export default function ExemptionChecklistForm({ 
  readOnly = false, 
  defaultValues = {},
  protocolId,
  reviewerId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reviewerName: _reviewerName,
  skipFirebaseLoad = false
}: ExemptionChecklistFormProps) {
  const router = useRouter();
  const form = useForm<ExemptionFormValues>({
    resolver: zodResolver(exemptionSchema),
    defaultValues: {
      protocolCode: defaultValues.protocolCode || '',
      submissionDate: defaultValues.submissionDate || '',
      title: defaultValues.title || '',
      studySite: defaultValues.studySite || '',
      principalInvestigator: defaultValues.principalInvestigator || '',
      sponsor: defaultValues.sponsor || '',
      involvesHumanParticipants: undefined,
      involvesNonIdentifiableTissue: undefined,
      involvesPublicData: undefined,
      involvesInteraction: undefined,
      qualityAssurance: undefined,
      publicServiceEvaluation: undefined,
      publicHealthSurveillance: undefined,
      educationalEvaluation: undefined,
      consumerAcceptability: undefined,
      surveysQuestionnaire: undefined,
      interviewsFocusGroup: undefined,
      publicObservations: undefined,
      existingData: undefined,
      audioVideo: undefined,
      dataAnonymization: undefined,
      foreseeableRisk: undefined,
      riskVulnerableGroups: undefined,
      riskSensitiveTopics: undefined,
      riskUseOfDrugs: undefined,
      riskInvasiveProcedure: undefined,
      riskPhysicalDistress: undefined,
      riskPsychologicalDistress: undefined,
      riskDeception: undefined,
      riskAccessData: undefined,
      riskConflictInterest: undefined,
      riskOtherDilemmas: undefined,
      riskBloodSampling: undefined,
      decision: undefined,
      decisionJustification: '',
    },
  });

  // Handle successful submission
  const handleSubmissionSuccess = () => {
    router.push('/rec/reviewers');
  };

  // Use local draft hook
  const { isSubmitting, isAutoSaving, lastSaved, submitForm, saveDraft, autoSave, loadDraft } = useLocalDraft({
    protocolId: protocolId || '',
    formType: 'exemption-checklist',
    reviewerId: reviewerId || '',
    onSubmissionSuccess: handleSubmissionSuccess,
  });

  // Load existing assessment data OR prefill on mount
  useEffect(() => {
    const loadOrPrefill = async () => {
      if (!readOnly && protocolId && reviewerId) {
        try {
          // If parent asked to skip Firebase and supplied defaults, use immediately
          if (skipFirebaseLoad && defaultValues && Object.keys(defaultValues).length > 0) {
            form.reset({ ...(form.getValues() as any), ...(defaultValues as any) });
            return;
          }

          // Step 1: Try to load existing draft from Firebase/localStorage
          const existingData = await loadDraft();
          
          if (existingData && Object.keys(existingData).length > 0) {
            // Found existing draft - use it
            form.reset({ ...(form.getValues() as any), ...(existingData as any) });
          } else if (defaultValues && Object.keys(defaultValues).length > 0) {
            // No existing draft - use prefill data
            form.reset({ ...(form.getValues() as any), ...(defaultValues as any) });
          }
        } catch (error) {
          console.error('Error loading/prefilling Exemption Checklist form:', error);
        }
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

  const onSubmit = async (values: ExemptionFormValues) => {
    if (readOnly) return;
    
    try {
      await submitForm(values);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleSaveDraft = async () => {
    const values = form.getValues();
    await saveDraft(values);
  };

  const renderYesNo = (
    name: keyof ExemptionFormValues,
    label: string,
    description?: string
  ) => (
    <FormField
      name={name as string}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel>{label}</FormLabel>
          {description && <p className="text-sm">{description}</p>}
          <FormControl>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-6" disabled={readOnly}>
              <FormItem className="flex items-center space-x-2">
                <FormControl><RadioGroupItem value="yes" /></FormControl>
                <FormLabel>Yes</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2">
                <FormControl><RadioGroupItem value="no" /></FormControl>
                <FormLabel>No</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormControl>
            <Textarea placeholder="Comments..." {...form.register(`${name}Comments` as keyof ExemptionFormValues)} disabled={readOnly} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderThreeOptions = (
    name: keyof ExemptionFormValues,
    label: string,
    options: Array<{ value: string; label: string }>,
    readOnly: boolean
  ) => (
    <FormField
      name={name as string}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-6" disabled={readOnly}>
              {options.map(opt => (
                <FormItem key={opt.value} className="flex items-center space-x-2">
                  <FormControl><RadioGroupItem value={opt.value as any} /></FormControl>
                  <FormLabel>{opt.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="p-6">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
        {/* I. Protocol Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField name="protocolCode" render={({ field }) => (
            <FormItem>
              <FormLabel>Protocol Code</FormLabel>
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
              <FormControl><Input placeholder="Enter title" {...field} readOnly={readOnly} /></FormControl>
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
              <FormLabel>Principal Investigator</FormLabel>
              <FormControl><Input placeholder="Enter PI name" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="sponsor" render={({ field }) => (
            <FormItem>
              <FormLabel>Sponsor / CRO / Institution</FormLabel>
              <FormControl><Input placeholder="Enter sponsor" {...field} readOnly={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* II. Protocol Assessment */}
        <div className="space-y-6">
          {renderYesNo('involvesHumanParticipants', '1. Does this research involve human participants?', '')}
          {renderYesNo('involvesNonIdentifiableTissue', '2. Does this research involve use of non-identifiable human tissue/biological samples?', '')}
          {renderYesNo('involvesPublicData', '3. Does this research involve use of non-identifiable publicly available data?', '')}
          
          <div className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded">
            Note: Protocols that neither involve human participants, nor identifiable human tissue, biological samples and data shall be exempted from review (NEGHHR 2017).
          </div>
          
          {renderYesNo('involvesInteraction', '4. Does this research involve interaction with human participants?', '')}

          <h2 className="text-lg font-semibold">5. Type of Research</h2>
          {renderYesNo('qualityAssurance', '5.1. Institutional quality assurance', '')}
          {renderYesNo('publicServiceEvaluation', '5.2. Evaluation of public service program', '')}
          {renderYesNo('publicHealthSurveillance', '5.3. Public health surveillance', '')}
          {renderYesNo('educationalEvaluation', '5.4. Educational evaluation activities', '')}
          {renderYesNo('consumerAcceptability', '5.5. Consumer acceptability test', '')}
          
          <div className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded">
            Note: These 5 have been identified in the NEGHHR as exemptible, as long as it does not involve more than minimal risk.
          </div>

          <h2 className="text-lg font-semibold">6. What is/are the method/s of data collection?</h2>
          {renderYesNo('surveysQuestionnaire', '6.1. Surveys and /or questionnaire', '')}
          {renderYesNo('interviewsFocusGroup', '6.2. Interviews or focus group discussion', '')}
          {renderYesNo('publicObservations', '6.3. Public observations', '')}
          {renderYesNo('existingData', '6.4. Research which only uses existing data', '')}
          {renderYesNo('audioVideo', '6.5. Audio/video recordings', '')}
          
          <div className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded">
            Note: These 5 have been identified in the NEGHHR as exemptible, as long as anonymity and/or confidentiality is maintained.
          </div>

          {renderThreeOptions('dataAnonymization', '7. Will the collected data be anonymized or identifiable?', [
            { value: 'anonymized', label: 'Anonymized' },
            { value: 'identifiable', label: 'Identifiable' },
            { value: 'de-identified', label: 'De-identified' },
          ], readOnly)}

          {renderYesNo('foreseeableRisk', '8. Is this research likely to involve any foreseeable risk of harm or discomfort to participants; above the level experienced in everyday life? (NEGHRR 2017)', 'Note: Please refer to section III. Risk Assessment, prior to answering this item.')}
          
          <div className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded">
            Note: If Yes, then this protocol does not qualify for exemption.
          </div>

          <h2 className="text-lg font-semibold">II. Risk Assessment</h2>
          <h3 className="text-md font-semibold">9. Does this research involve the following:</h3>
          {renderYesNo('riskVulnerableGroups', '9.1. Any vulnerable group/s', '')}
          {renderYesNo('riskSensitiveTopics', '9.2. Sensitive topics that may make participants feel uncomfortable (i.e. sexual behavior, illegal activities, racial biases, etc.)', '')}
          {renderYesNo('riskUseOfDrugs', '9.3. Use of Drugs', '')}
          {renderYesNo('riskInvasiveProcedure', '9.4. Invasive procedure (e.g. blood sampling)', '')}
          {renderYesNo('riskPhysicalDistress', '9.5. Physical stress/distress, discomfort', '')}
          {renderYesNo('riskPsychologicalDistress', '9.6. Psychological/mental stress/distress', '')}
          {renderYesNo('riskDeception', '9.7. Deception of/or withholding information from subjects', '')}
          {renderYesNo('riskAccessData', '9.8. Access to data by individuals or organizations other than the investigators.', '')}
          {renderYesNo('riskConflictInterest', '9.9. Conflict of interest issues', '')}
          {renderYesNo('riskOtherDilemmas', '9.10. Or any other ethical dilemmas', '')}
          {renderYesNo('riskBloodSampling', '9.11. Is there any blood sampling involved in the study', '')}
        </div>

        {/* Decision */}
        <div className="space-y-2">
          <FormLabel className="font-medium text-lg">Decision</FormLabel>
          <FormField name="decision" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-6" disabled={readOnly}>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="qualified" /></FormControl><FormLabel>Qualified for Exemption</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="unqualified" /></FormControl><FormLabel>Unqualified for Exemption</FormLabel></FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>Justification for the Decision:</FormDescription>
              <FormControl><Textarea placeholder="Enter justification" {...form.register('decisionJustification')} disabled={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {!readOnly && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={isAutoSaving}
              className="flex-1 border-[#036635] dark:border-[#FECC07] text-[#036635] dark:text-[#FECC07] hover:bg-[#036635] dark:hover:bg-[#FECC07] hover:text-white dark:hover:text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          </div>
        )}
        
        {/* Auto-save indicator */}
        {!readOnly && (isAutoSaving || lastSaved) && (
          <div className="flex items-center justify-center text-xs text-muted-foreground mt-2">
            <Clock className="w-3 h-3 mr-1" />
            {isAutoSaving ? 'Auto-saving...' : `Last saved: ${lastSaved}`}
          </div>
        )}
      </form>
    </Form>
    </div>
  );
}
