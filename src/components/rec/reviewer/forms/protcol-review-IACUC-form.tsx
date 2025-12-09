'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { prePopulateFormFields, getFormDefaultValues } from '@/lib/utils/formPrepopulation';
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

// Zod schema for IACUC protocol review
const iacucReviewSchema = z.object({
  iacucCode: z.string().min(1, 'Required'),
  submissionDate: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  studySite: z.string().min(1, 'Required'),
  principalInvestigator: z.string().min(1, 'Required'),
  sponsor: z.string().min(1, 'Required'),
  typeOfReview: z.enum(['expedited', 'full']),

  scientificValue: z.enum(['yes', 'no', 'unable']),
  scientificValueComments: z.string().optional(),

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
  facilitiesInfrastructure: z.enum(['yes', 'no', 'unable']),
  facilitiesInfrastructureComments: z.string().optional(),
  investigatorQualifications: z.enum(['yes', 'no', 'unable']),
  investigatorQualificationsComments: z.string().optional(),
  privacyConfidentiality: z.enum(['yes', 'no', 'unable']),
  privacyConfidentialityComments: z.string().optional(),
  conflictOfInterest: z.enum(['yes', 'no', 'unable']),
  conflictOfInterestComments: z.string().optional(),

  animalSource: z.enum(['yes', 'no', 'unable']),
  animalSourceComments: z.string().optional(),
  housingCare: z.enum(['yes', 'no', 'unable']),
  housingCareComments: z.string().optional(),
  restraintProcedures: z.enum(['yes', 'no', 'unable']),
  restraintProceduresComments: z.string().optional(),
  anesthesiaAnalgesia: z.enum(['yes', 'no', 'unable']),
  anesthesiaAnalgesiaComments: z.string().optional(),
  postProcedureMonitoring: z.enum(['yes', 'no', 'unable']),
  postProcedureMonitoringComments: z.string().optional(),
  euthanasia: z.enum(['yes', 'no', 'unable']),
  euthanasiaComments: z.string().optional(),
  biologicalAgentCollection: z.enum(['yes', 'no', 'unable']),
  biologicalAgentCollectionComments: z.string().optional(),
  examinationMethods: z.enum(['yes', 'no', 'unable']),
  examinationMethodsComments: z.string().optional(),
  surgicalProcedures: z.enum(['yes', 'no', 'unable']),
  surgicalProceduresComments: z.string().optional(),
  humaneEndpoints: z.enum(['yes', 'no', 'unable']),
  humaneEndpointsComments: z.string().optional(),
  potentialHazards: z.enum(['yes', 'no', 'unable']),
  potentialHazardsComments: z.string().optional(),
  wasteDisposal: z.enum(['yes', 'no', 'unable']),
  wasteDisposalComments: z.string().optional(),

  recommendation: z.enum(['approved', 'minor', 'major', 'disapproved']),
  justification: z.string().optional(),
});

type IACUCFormValues = z.infer<typeof iacucReviewSchema>;

interface IACUCFormProps {
  readOnly?: boolean;
  defaultValues?: Record<string, any>;
  protocolId?: string;
  reviewerId?: string;
  reviewerName?: string;
  protocolData?: any;
  reviewerAssignment?: any;
  skipFirebaseLoad?: boolean;
}

export default function IACUCForm({ 
  readOnly = false, 
  defaultValues = {},
  protocolId,
  reviewerId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reviewerName: _reviewerName,
  protocolData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reviewerAssignment: _reviewerAssignment,
  skipFirebaseLoad = false
}: IACUCFormProps) {
  const router = useRouter();
  const [isLoadingData, setIsLoadingData] = useState(false);

  // No need for separate IACUC code - use SPUP REC code directly

  // Initialize form with base defaults first
  const form = useForm<IACUCFormValues>({
    resolver: zodResolver(iacucReviewSchema),
    defaultValues: {
      // Text inputs must start as empty strings to avoid uncontrolled->controlled warnings
      iacucCode: '',
      submissionDate: '',
      title: '',
      studySite: '',
      principalInvestigator: '',
      sponsor: '',
      typeOfReview: undefined,
      scientificValue: undefined,
      studyObjectives: undefined,
      literatureReview: undefined,
      researchDesign: undefined,
      dataCollection: undefined,
      inclusionExclusion: undefined,
      withdrawalCriteria: undefined,
      facilitiesInfrastructure: undefined,
      investigatorQualifications: undefined,
      privacyConfidentiality: undefined,
      conflictOfInterest: undefined,
      animalSource: undefined,
      housingCare: undefined,
      restraintProcedures: undefined,
      anesthesiaAnalgesia: undefined,
      postProcedureMonitoring: undefined,
      euthanasia: undefined,
      biologicalAgentCollection: undefined,
      examinationMethods: undefined,
      surgicalProcedures: undefined,
      humaneEndpoints: undefined,
      potentialHazards: undefined,
      wasteDisposal: undefined,
      recommendation: undefined,
      // Initialize comment fields as empty strings to avoid controlled/uncontrolled warning
      scientificValueComments: '',
      studyObjectivesComments: '',
      literatureReviewComments: '',
      researchDesignComments: '',
      dataCollectionComments: '',
      inclusionExclusionComments: '',
      withdrawalCriteriaComments: '',
      facilitiesInfrastructureComments: '',
      investigatorQualificationsComments: '',
      privacyConfidentialityComments: '',
      conflictOfInterestComments: '',
      animalSourceComments: '',
      housingCareComments: '',
      restraintProceduresComments: '',
      anesthesiaAnalgesiaComments: '',
      postProcedureMonitoringComments: '',
      euthanasiaComments: '',
      biologicalAgentCollectionComments: '',
      examinationMethodsComments: '',
      surgicalProceduresComments: '',
      humaneEndpointsComments: '',
      potentialHazardsComments: '',
      wasteDisposalComments: '',
      justification: '',
    },
  });

  // Handle successful submission
  const handleSubmissionSuccess = () => {
    router.push('/rec/reviewers');
  };

  // Use local draft hook
  const { isSubmitting, isAutoSaving, lastSaved, submitForm, saveDraft, autoSave, loadDraft } = useLocalDraft({
    protocolId: protocolId || '',
    formType: 'iacuc-review',
    reviewerId: reviewerId || '',
    onSubmissionSuccess: handleSubmissionSuccess,
    skipFirebaseLoad: skipFirebaseLoad,
  });

  // Load existing assessment data OR prefill on mount
  useEffect(() => {
    const loadOrPrefill = async () => {
      if (!readOnly && protocolId && reviewerId) {
        setIsLoadingData(true);
        try {
          // If parent already provided defaultValues and asked to skip Firebase load,
          // use those values immediately.
          if (skipFirebaseLoad && defaultValues && Object.keys(defaultValues).length > 0) {
            // Merge over existing defaults so missing fields stay controlled
            form.reset({ ...(form.getValues() as any), ...(defaultValues as any) });
            setIsLoadingData(false);
            return;
          }

          // Step 1: Try to load existing draft from Firebase/localStorage
          const existingData = await loadDraft();
          if (existingData && Object.keys(existingData).length > 0) {
            // Found existing draft - use it
            form.reset({ ...(form.getValues() as any), ...(existingData as any) });
          } else if (protocolData && !skipFirebaseLoad) {
            // No existing draft - use prefill data
            const prepopulatedFields = prePopulateFormFields(protocolData);
            const iacucDefaultValues = getFormDefaultValues('iacuc-review', prepopulatedFields);
            
            form.reset({
              ...(form.getValues() as any),
              ...iacucDefaultValues,
              iacucCode: prepopulatedFields.protocolCode,
            });
          } else if (defaultValues && Object.keys(defaultValues).length > 0) {
            // Fallback: if defaultValues exist, use them
            form.reset({ ...(form.getValues() as any), ...(defaultValues as any) });
          }
        } catch (error) {
          console.error('Error loading/prefilling IACUC form:', error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };
    
    loadOrPrefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDraft, form, readOnly, protocolId, reviewerId, protocolData, skipFirebaseLoad]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!readOnly && protocolId && reviewerId) {
        autoSave(value);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, autoSave, readOnly, protocolId, reviewerId]);

  const onSubmit = async (values: IACUCFormValues) => {
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

  const renderYesNoUnable = (
    name: keyof IACUCFormValues,
    label: string,
    description: string
  ) => (
    <FormField
      name={name as string}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel>{label}</FormLabel>
          <p className="text-sm">{description}</p>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex space-x-6"
              disabled={readOnly}
            >
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="yes" />
                </FormControl>
                <FormLabel>Yes</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="no" />
                </FormControl>
                <FormLabel>No</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="unable" />
                </FormControl>
                <FormLabel>Unable to assess</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormControl>
            <Textarea placeholder="Comments..." {...form.register(`${name}Comments` as keyof IACUCFormValues)} disabled={readOnly} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* I. Protocol Information */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="iacucCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SPUP IACUC Protocol Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter IACUC code" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="submissionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Protocol Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter protocol title" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="studySite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Site</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter study site" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="principalInvestigator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name of Principal Investigator</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter PI name" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="sponsor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sponsor / CRO / Institution</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sponsor name" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="typeOfReview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Review</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex space-x-6"
                      disabled={readOnly}
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl><RadioGroupItem value="expedited" /></FormControl>
                        <FormLabel>Expedited</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl><RadioGroupItem value="full" /></FormControl>
                        <FormLabel>Full Review</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* II. Assessment Points */}
          {renderYesNoUnable('scientificValue', '1. SCIENTIFIC VALUE', 'Does the study have scientific value?')}

          <FormLabel className="text-lg font-semibold">2. SCIENTIFIC SOUNDNESS</FormLabel>
          {renderYesNoUnable('studyObjectives', '2.1 Study Objectives', 'Is/are the proposal\'s scientific question/s reasonable?')}
          {renderYesNoUnable('literatureReview', '2.2 Literature Review', 'Does the protocol adequately present informational background as to the result of previous studies prior to human experimentation?')}
          {renderYesNoUnable('researchDesign', '2.3 Research and Sampling design', 'Is the study design, sampling method and techniques appropriate?')}
          {renderYesNoUnable('dataCollection', '2.4 Specimen/Data Collection, Processing, Storage', 'Are the procedures in collecting, processing, and storing data adequate?')}
          {renderYesNoUnable('facilitiesInfrastructure', '2.5 Facilities/Infrastructure at Study Site', 'Are the research facilities adequate?')}
          {renderYesNoUnable('investigatorQualifications', '2.6 Investigator\'s Qualification, Competence, and Experience', 'Is/are the investigator/s adequately trained and do they have sufficient experience?')} 

          <FormLabel className="text-lg font-semibold">3. JUSTIFICATION ON THE USE OF ANIMALS</FormLabel>
          {renderYesNoUnable('animalSource', '3.1 Animal Description(?)', '')}
          {renderYesNoUnable('housingCare', '3.2 Animal Care Procedures(?)', '')}
          {renderYesNoUnable('restraintProcedures', '3.3 Animal Diet(?)', '')}
          {renderYesNoUnable('anesthesiaAnalgesia', '3.4 Animal Manipulation Methods(?)', '')}
          {renderYesNoUnable('postProcedureMonitoring', '3.5 Dosing Methods(?)', '')}
          {renderYesNoUnable('euthanasia', '3.6 Expected outcome or Effects(?)', '')}
          {renderYesNoUnable('biologicalAgentCollection', '3.7 Collection of Biological Agent(?)', '')}
          {renderYesNoUnable('examinationMethods', '3.8 Animal Examination Methods(?)', '')}
          {renderYesNoUnable('surgicalProcedures', '3.9 Surgical Procedures(?)', '')}
          {renderYesNoUnable('humaneEndpoints', '3.10 Humane Endpoints', '')}
          {renderYesNoUnable('potentialHazards', '3.11 Potential Hazards', '')}
          {renderYesNoUnable('wasteDisposal', '3.12 Waste Disposal', '')}

          {/* Recommendation */}
          <FormLabel className="font-medium">Recommendation</FormLabel>
          <FormField
            name="recommendation"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex space-x-6"
                    disabled={readOnly}
                  >
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="approved" /></FormControl><FormLabel>Approved</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="minor" /></FormControl><FormLabel>Minor Modifications Required</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="major" /></FormControl><FormLabel>Major Modifications Required</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="disapproved" /></FormControl><FormLabel>Disapproved</FormLabel></FormItem>
                  </RadioGroup>
                </FormControl>
                <FormDescription>Justification for the Recommendation</FormDescription>
                <FormControl><Textarea placeholder="Provide justification..." {...form.register('justification')} disabled={readOnly} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
