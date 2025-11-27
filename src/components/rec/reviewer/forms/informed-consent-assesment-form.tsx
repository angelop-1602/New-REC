'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
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

// Zod schema for Informed Consent Assessment
const informedConsentSchema = z.object({
  // I. Protocol Information
  protocolCode: z.string().min(1, 'Required'),
  submissionDate: z.string().min(1, 'Required'),
  principalInvestigator: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  studySite: z.string().min(1, 'Required'),
  sponsor: z.string().min(1, 'Required'),

  // II. Guide Questions 1-17
  q1: z.enum(['yes', 'no', 'unable']), q1Comments: z.string().optional(),
  q2: z.enum(['yes', 'no', 'unable']), q2Comments: z.string().optional(),
  q3: z.enum(['yes', 'no', 'unable']), q3Comments: z.string().optional(),
  q4: z.enum(['yes', 'no', 'unable']), q4Comments: z.string().optional(),
  q5: z.enum(['yes', 'no', 'unable']), q5Comments: z.string().optional(),
  q6: z.enum(['yes', 'no', 'unable']), q6Comments: z.string().optional(),
  q7: z.enum(['yes', 'no', 'unable']), q7Comments: z.string().optional(),
  q8: z.enum(['yes', 'no', 'unable']), q8Comments: z.string().optional(),
  q9: z.enum(['yes', 'no', 'unable']), q9Comments: z.string().optional(),
  q10: z.enum(['yes', 'no', 'unable']), q10Comments: z.string().optional(),
  q11: z.enum(['yes', 'no', 'unable']), q11Comments: z.string().optional(),
  q12: z.enum(['yes', 'no', 'unable']), q12Comments: z.string().optional(),
  q13: z.enum(['yes', 'no', 'unable']), q13Comments: z.string().optional(),
  q14: z.enum(['yes', 'no', 'unable']), q14Comments: z.string().optional(),
  q15: z.enum(['yes', 'no', 'unable']), q15Comments: z.string().optional(),
  q16: z.enum(['yes', 'no', 'unable']), q16Comments: z.string().optional(),
  q17: z.enum(['yes', 'no', 'unable']), q17Comments: z.string().optional(),

  // Recommendation
  recommendation: z.enum([
    'Approved',
    'Minor Modifications Required',
    'Major Modifications Required',
    'Disapproved',
  ]),
  recommendationJustification: z.string().min(1, 'Required'),
});

type InformedConsentFormValues = z.infer<typeof informedConsentSchema>;

interface InformedConsentFormProps {
  readOnly?: boolean;
  defaultValues?: Record<string, any>;
  protocolId?: string;
  reviewerId?: string;
  reviewerName?: string;
  skipFirebaseLoad?: boolean;
}

export default function InformedConsentForm({ 
  readOnly = false, 
  defaultValues = {},
  protocolId,
  reviewerId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reviewerName: _reviewerName,
  skipFirebaseLoad = false
}: InformedConsentFormProps) {
  const router = useRouter();
  const form = useForm<InformedConsentFormValues>({
    resolver: zodResolver(informedConsentSchema),
    defaultValues: {
      protocolCode: defaultValues.protocolCode || '', 
      submissionDate: defaultValues.submissionDate || '', 
      principalInvestigator: defaultValues.principalInvestigator || '', 
      title: defaultValues.title || '', 
      studySite: defaultValues.studySite || '', 
      sponsor: defaultValues.sponsor || '',
      q1: defaultValues.q1 || undefined, 
      q2: defaultValues.q2 || undefined, 
      q3: defaultValues.q3 || undefined, 
      q4: defaultValues.q4 || undefined, 
      q5: defaultValues.q5 || undefined, 
      q6: defaultValues.q6 || undefined, 
      q7: defaultValues.q7 || undefined, 
      q8: defaultValues.q8 || undefined, 
      q9: defaultValues.q9 || undefined,
      q10: defaultValues.q10 || undefined, 
      q11: defaultValues.q11 || undefined, 
      q12: defaultValues.q12 || undefined, 
      q13: defaultValues.q13 || undefined, 
      q14: defaultValues.q14 || undefined, 
      q15: defaultValues.q15 || undefined, 
      q16: defaultValues.q16 || undefined, 
      q17: defaultValues.q17 || undefined,
      recommendation: defaultValues.recommendation || undefined, 
      recommendationJustification: defaultValues.recommendationJustification || '',
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
    formType: 'informed-consent',
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
            console.log('✅ Informed Consent form loaded with provided defaultValues (skipFirebaseLoad)');
            return;
          }

          // Step 1: Try to load existing draft from Firebase/localStorage
          const existingData = await loadDraft();
          
          if (existingData && Object.keys(existingData).length > 0) {
            // Found existing draft - use it
            form.reset({ ...(form.getValues() as any), ...(existingData as any) });
            console.log('✅ Informed Consent form loaded with existing draft data');
          } else if (defaultValues && Object.keys(defaultValues).length > 0) {
            // No existing draft - use prefill data
            form.reset({ ...(form.getValues() as any), ...(defaultValues as any) });
            console.log('✅ Informed Consent form pre-populated with protocol data');
          }
        } catch (error) {
          console.error('Error loading/prefilling Informed Consent form:', error);
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

  const onSubmit = async (values: InformedConsentFormValues) => {
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
    name: keyof InformedConsentFormValues,
    number: string,
    questionText: string
  ) => (
    <FormField name={name as string} render={({ field }) => (
      <FormItem className="space-y-3">
        <FormLabel className="text-lg font-semibold text-foreground">
          {number}. {questionText}
        </FormLabel>
        <FormControl>
          <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-6" disabled={readOnly}>
            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes"/></FormControl><FormLabel>Yes</FormLabel></FormItem>
            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no"/></FormControl><FormLabel>No</FormLabel></FormItem>
            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="unable"/></FormControl><FormLabel>Unable to assess</FormLabel></FormItem>
          </RadioGroup>
        </FormControl>
        <FormControl><Textarea placeholder="Comments..." {...form.register(name + 'Comments' as any)} disabled={readOnly} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );

  return (
    <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* I. Protocol Information */}
          <div className="grid grid-cols-2 gap-4">
            <FormField name="protocolCode" render={({ field }) => (
              <FormItem>
                <FormLabel>SPUP REC Protocol Code</FormLabel>
                <FormControl><Input {...field} placeholder="Enter protocol code" disabled={readOnly} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="submissionDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Submission Date</FormLabel>
                <FormControl><Input type="date" {...field} disabled={readOnly}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="principalInvestigator" render={({ field }) => (
              <FormItem>
                <FormLabel>Principal Investigator</FormLabel>
                <FormControl><Input {...field} placeholder="Enter PI name" disabled={readOnly}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Protocol Title</FormLabel>
                <FormControl><Input {...field} placeholder="Enter title" disabled={readOnly}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="studySite" render={({ field }) => (
              <FormItem>
                <FormLabel>Study Site</FormLabel>
                <FormControl><Input {...field} placeholder="Enter study site" disabled={readOnly}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="sponsor" render={({ field }) => (
              <FormItem>
                <FormLabel>Sponsor / CRO / Institution</FormLabel>
                <FormControl><Input {...field} placeholder="Enter sponsor" disabled={readOnly}/></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* II. Guide Questions for Assessment */}
          {renderYesNoUnable('q1', '1', 'Does the Informed Consent document state that the procedures are primarily intended for research?')}
          {renderYesNoUnable('q2', '2', 'Are procedures for obtaining Informed Consent appropriate?')}
          {renderYesNoUnable('q3', '3', 'Does the Informed Consent document contain comprehensive and relevant information?')}
          {renderYesNoUnable('q4', '4', 'Is the information provided in the protocol consistent with those in the consent form?')}
          {renderYesNoUnable('q5', '5', 'Are study related risks mentioned in the consent form?')}
          {renderYesNoUnable('q6', '6', 'Is the language in the Informed Consent document understandable?')}
          {renderYesNoUnable('q7', '7', 'Is the Informed Consent translated into the local language/dialect?')}
          {renderYesNoUnable('q8', '8', 'Is there adequate protection of vulnerable participants?')}
          {renderYesNoUnable('q9', '9', 'Are the different types of consent forms (assent, legally acceptable representative) appropriate for the types of study participants?')}
          {renderYesNoUnable('q10', '10', 'Are names and contact numbers from the research team and the SPUP REC in the informed consent?')}
          {renderYesNoUnable('q11', '11', 'Does the ICF mention privacy & confidentiality protection?')}
          {renderYesNoUnable('q12', '12', 'Is there any inducement for participation?')}
          {renderYesNoUnable('q13', '13', 'Is there provision for medical / psychosocial support?')}
          {renderYesNoUnable('q14', '14', 'Is there provision for treatment of study-related injuries?')}
          {renderYesNoUnable('q15', '15', 'Is there provision for compensation?')}
          {renderYesNoUnable('q16', '16', 'Does the ICF clearly describe the responsibilities of the participants?')}
          {renderYesNoUnable('q17', '17', 'Does the ICF describe the benefits of participating in the research?')}

          {/* Recommendation */}
          <FormField name="recommendation" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Recommendation</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-col space-y-2" disabled={readOnly}>
                  {['Approved','Minor Modifications Required','Major Modifications Required','Disapproved'].map(opt => (
                    <FormItem key={opt} className="flex items-center space-x-2">
                      <FormControl><RadioGroupItem value={opt as any} /></FormControl>
                      <FormLabel>{opt}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormDescription>Justification for the Recommendation</FormDescription>
              <FormControl><Textarea placeholder="Enter justification" {...form.register('recommendationJustification')} disabled={readOnly} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

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
                       Submit Assessment
                     </>
                   )}
                 </Button>
               </div>
             </div>
           )}
        </form>
      </Form>
    </div>
  );
}
