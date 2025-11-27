"use client"

import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle, Edit, X, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { assessmentFormsService } from "@/lib/services/assessments/assessmentFormsService";
import { toast } from "sonner";

interface ViewAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: Record<string, unknown>;
  reviewerName: string;
  protocolId?: string;
  onStatusUpdate?: () => void;
}

export function ViewAssessmentDialog({ 
  open, 
  onOpenChange, 
  assessment,
  reviewerName,
  protocolId,
  onStatusUpdate
}: ViewAssessmentDialogProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!assessment || !assessment.formData) {
    return null;
  }

  const formData = assessment.formData;
  const formType = assessment.formType as 'protocol-review' | 'informed-consent' | 'exemption-checklist' | 'iacuc-review';

  const handleApprove = async () => {
    if (!protocolId || !assessment.reviewerId) return;
    
    setIsProcessing(true);
    try {
      const success = await assessmentFormsService.updateFormStatus(
        protocolId,
        assessment.formType as 'protocol-review' | 'informed-consent' | 'exemption-checklist' | 'iacuc-review',
        assessment.reviewerId as string,
        'approved'
      );
      
      if (success) {
        toast.success('Assessment approved successfully');
        onStatusUpdate?.();
        onOpenChange(false);
      } else {
        toast.error('Failed to approve assessment');
      }
    } catch (error) {
      console.error('Error approving assessment:', error);
      toast.error('Failed to approve assessment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!protocolId || !assessment.reviewerId || !rejectionReason.trim()) {
      toast.error('Please provide a return reason');
      return;
    }
    
    setIsProcessing(true);
    try {
      const success = await assessmentFormsService.updateFormStatus(
        protocolId,
        assessment.formType as 'protocol-review' | 'informed-consent' | 'exemption-checklist' | 'iacuc-review',
        assessment.reviewerId as string,
        'returned',
        rejectionReason.trim()
      );
      
      if (success) {
        toast.success('Assessment returned to reviewer');
        onStatusUpdate?.();
        setShowRejectDialog(false);
        setRejectionReason("");
        onOpenChange(false);
      } else {
        toast.error('Failed to return assessment');
      }
    } catch (error) {
      console.error('Error returning assessment:', error);
      toast.error('Failed to return assessment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to render field value
  const renderFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object' && (value as { value?: unknown }).value) return String((value as { value: unknown }).value);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };


  // Ordered, per-form sections to mirror actual form flow
  type Field = { key: string; label: string };
  type Section = { title: string; fields: Field[] };

  const yesNoUnable = (k: string, label: string): Field[] => ([
    { key: k, label },
    { key: `${k}Comments`, label: 'Comments' },
  ]);

  const protocolInfo: Field[] = [
    { key: 'iacucCode', label: 'SPUP IACUC Protocol Code' },
    { key: 'protocolCode', label: 'SPUP REC Protocol Code' },
    { key: 'submissionDate', label: 'Submission Date' },
    { key: 'title', label: 'Protocol Title' },
    { key: 'studySite', label: 'Study Site' },
    { key: 'principalInvestigator', label: 'Principal Investigator' },
    { key: 'sponsor', label: 'Sponsor / CRO / Institution' },
    { key: 'typeOfReview', label: 'Type of Review' },
  ];

  const sectionsByForm: Record<string, Section[]> = {
    'protocol-review': [
      { title: 'Protocol Information', fields: protocolInfo.filter(f => f.key !== 'iacucCode') },
      { title: '1. SOCIAL VALUE', fields: yesNoUnable('socialValue', 'Does the study have scientific or social value?') },
      { title: '2. SCIENTIFIC SOUNDNESS', fields: [
        ...yesNoUnable('studyObjectives', '2.1 Study Objectives'),
        ...yesNoUnable('literatureReview', '2.2 Literature Review'),
        ...yesNoUnable('researchDesign', '2.3 Research and Sampling design'),
        ...yesNoUnable('dataCollection', '2.4 Specimen/Data Collection, Processing, Storage'),
        ...yesNoUnable('inclusionExclusion', '2.5 Inclusion/Exclusion Criteria'),
        ...yesNoUnable('withdrawalCriteria', '2.6 Withdrawal Criteria'),
        ...yesNoUnable('facilities', '2.7 Facilities/Infrastructure at Study Site'),
        ...yesNoUnable('investigatorQualification', '2.8 Investigator\'s Qualification, Competence, and Experience'),
      ] },
      { title: '3. ETHICAL SOUNDNESS', fields: [
        ...yesNoUnable('privacyConfidentiality', '3.1 Privacy and Confidentiality Safeguards'),
        ...yesNoUnable('conflictOfInterest', '3.2 Conflict of Interest'),
        ...yesNoUnable('humanParticipants', '3.3 Involvement of Human Participants'),
        ...yesNoUnable('vulnerablePopulations', '3.4 Involvement of Vulnerable Populations'),
        ...yesNoUnable('voluntaryRecruitment', '3.5 Participant Selection-voluntary, non-coercive recruitment'),
        ...yesNoUnable('riskBenefit', '3.6 Risk-Benefit Ratio'),
        ...yesNoUnable('informedConsent', '3.7 Informed Consent Process'),
        ...yesNoUnable('communityConsiderations', '3.8 Community Considerations'),
        ...yesNoUnable('collaborativeTerms', '3.9 Collaborative Study Terms of Reference'),
      ] },
      { title: 'III. RECOMMENDATION', fields: [
        { key: 'recommendation', label: 'Recommendation' },
        { key: 'justification', label: 'Justification for the Recommendation' },
      ] },
    ],
    'informed-consent': [
      { title: 'Protocol Information', fields: protocolInfo.filter(f => !['iacucCode','typeOfReview'].includes(f.key)) },
      { title: 'II. Guide Questions for Assessment', fields: [
        ...yesNoUnable('q1', '1. Does the Informed Consent document state that the procedures are primarily intended for research?'),
        ...yesNoUnable('q2', '2. Are procedures for obtaining Informed Consent appropriate?'),
        ...yesNoUnable('q3', '3. Does the Informed Consent document contain comprehensive and relevant information?'),
        ...yesNoUnable('q4', '4. Is the information provided in the protocol consistent with those in the consent form?'),
        ...yesNoUnable('q5', '5. Are study related risks mentioned in the consent form?'),
        ...yesNoUnable('q6', '6. Is the language in the Informed Consent document understandable?'),
        ...yesNoUnable('q7', '7. Is the Informed Consent translated into the local language/dialect?'),
        ...yesNoUnable('q8', '8. Is there adequate protection of vulnerable participants?'),
        ...yesNoUnable('q9', '9. Are the different types of consent forms (assent, legally acceptable representative) appropriate for the types of study participants?'),
        ...yesNoUnable('q10', '10. Are names and contact numbers from the research team and the SPUP REC in the informed consent?'),
        ...yesNoUnable('q11', '11. Does the ICF mention privacy & confidentiality protection?'),
        ...yesNoUnable('q12', '12. Is there any inducement for participation?'),
        ...yesNoUnable('q13', '13. Is there provision for medical / psychosocial support?'),
        ...yesNoUnable('q14', '14. Is there provision for treatment of study-related injuries?'),
        ...yesNoUnable('q15', '15. Is there provision for compensation?'),
        ...yesNoUnable('q16', '16. Does the ICF clearly describe the responsibilities of the participants?'),
        ...yesNoUnable('q17', '17. Does the ICF describe the benefits of participating in the research?'),
      ] },
      { title: 'Recommendation', fields: [
        { key: 'recommendation', label: 'Recommendation' },
        { key: 'recommendationJustification', label: 'Justification for the Recommendation' },
      ] },
    ],
    'exemption-checklist': [
      { title: 'Protocol Information', fields: protocolInfo.filter(f => !['iacucCode','typeOfReview'].includes(f.key)) },
      { title: 'II. Protocol Assessment', fields: [
        ...yesNoUnable('involvesHumanParticipants', '1. Does this research involve human participants?'),
        ...yesNoUnable('involvesNonIdentifiableTissue', '2. Does this research involve use of non-identifiable human tissue/biological samples?'),
        ...yesNoUnable('involvesPublicData', '3. Does this research involve use of non-identifiable publicly available data?'),
        ...yesNoUnable('involvesInteraction', '4. Does this research involve interaction with human participants?'),
        ...yesNoUnable('qualityAssurance', '5.1. Institutional quality assurance'),
        ...yesNoUnable('publicServiceEvaluation', '5.2. Evaluation of public service program'),
        ...yesNoUnable('publicHealthSurveillance', '5.3. Public health surveillance'),
        ...yesNoUnable('educationalEvaluation', '5.4. Educational evaluation activities'),
        ...yesNoUnable('consumerAcceptability', '5.5. Consumer acceptability test'),
        ...yesNoUnable('surveysQuestionnaire', '6.1. Surveys and /or questionnaire'),
        ...yesNoUnable('interviewsFocusGroup', '6.2. Interviews or focus group discussion'),
        ...yesNoUnable('publicObservations', '6.3. Public observations'),
        ...yesNoUnable('existingData', '6.4. Research which only uses existing data'),
        ...yesNoUnable('audioVideo', '6.5. Audio/video recordings'),
        { key: 'dataAnonymization', label: '7. Will the collected data be anonymized or identifiable?' },
        ...yesNoUnable('foreseeableRisk', '8. Is this research likely to involve any foreseeable risk of harm or discomfort to participants; above the level experienced in everyday life? (NEGHRR 2017)'),
      ] },
      { title: 'II. Risk Assessment', fields: [
        ...yesNoUnable('riskVulnerableGroups', '9.1. Any vulnerable group/s'),
        ...yesNoUnable('riskSensitiveTopics', '9.2. Sensitive topics that may make participants feel uncomfortable (i.e. sexual behavior, illegal activities, racial biases, etc.)'),
        ...yesNoUnable('riskUseOfDrugs', '9.3. Use of Drugs'),
        ...yesNoUnable('riskInvasiveProcedure', '9.4. Invasive procedure (e.g. blood sampling)'),
        ...yesNoUnable('riskPhysicalDistress', '9.5. Physical stress/distress, discomfort'),
        ...yesNoUnable('riskPsychologicalDistress', '9.6. Psychological/mental stress/distress'),
        ...yesNoUnable('riskDeception', '9.7. Deception of/or withholding information from subjects'),
        ...yesNoUnable('riskAccessData', '9.8. Access to data by individuals or organizations other than the investigators.'),
        ...yesNoUnable('riskConflictInterest', '9.9. Conflict of interest issues'),
        ...yesNoUnable('riskOtherDilemmas', '9.10. Or any other ethical dilemmas'),
        ...yesNoUnable('riskBloodSampling', '9.11. Is there any blood sampling involved in the study'),
      ] },
      { title: 'Decision', fields: [
        { key: 'decision', label: 'Decision' },
        { key: 'decisionJustification', label: 'Justification for the Decision' },
      ] },
    ],
    'iacuc-review': [
      { title: 'Protocol Information', fields: protocolInfo },
      { title: '1. SCIENTIFIC VALUE', fields: yesNoUnable('scientificValue', 'Does the study have scientific value?') },
      { title: '2. SCIENTIFIC SOUNDNESS', fields: [
        ...yesNoUnable('studyObjectives', '2.1 Study Objectives'),
        ...yesNoUnable('literatureReview', '2.2 Literature Review'),
        ...yesNoUnable('researchDesign', '2.3 Research and Sampling design'),
        ...yesNoUnable('dataCollection', '2.4 Specimen/Data Collection, Processing, Storage'),
        ...yesNoUnable('facilitiesInfrastructure', '2.5 Facilities/Infrastructure at Study Site'),
        ...yesNoUnable('investigatorQualifications', '2.6 Investigator\'s Qualification, Competence, and Experience'),
      ] },
      { title: '3. JUSTIFICATION ON THE USE OF ANIMALS', fields: [
        ...yesNoUnable('animalSource', '3.1 Animal Description(?)'),
        ...yesNoUnable('housingCare', '3.2 Animal Care Procedures(?)'),
        ...yesNoUnable('restraintProcedures', '3.3 Animal Diet(?)'),
        ...yesNoUnable('anesthesiaAnalgesia', '3.4 Animal Manipulation Methods(?)'),
        ...yesNoUnable('postProcedureMonitoring', '3.5 Dosing Methods(?)'),
        ...yesNoUnable('euthanasia', '3.6 Expected outcome or Effects(?)'),
        ...yesNoUnable('biologicalAgentCollection', '3.7 Collection of Biological Agent(?)'),
        ...yesNoUnable('examinationMethods', '3.8 Animal Examination Methods(?)'),
        ...yesNoUnable('surgicalProcedures', '3.9 Surgical Procedures(?)'),
        ...yesNoUnable('humaneEndpoints', '3.10 Humane Endpoints'),
        ...yesNoUnable('potentialHazards', '3.11 Potential Hazards'),
        ...yesNoUnable('wasteDisposal', '3.12 Waste Disposal'),
      ] },
      { title: 'Recommendation', fields: [
        { key: 'recommendation', label: 'Recommendation' },
        { key: 'justification', label: 'Justification for the Recommendation' },
      ] },
    ],
  };

  const sections = sectionsByForm[formType] ?? [];

  // Get status display info
  const getStatusInfo = () => {
    const status = assessment.status || 'draft';
    switch (status) {
      case 'submitted':
        return {
          label: 'Submitted',
          variant: 'default' as const,
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        };
      case 'approved':
        return {
          label: 'Approved',
          variant: 'default' as const,
          icon: CheckCircle,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
        };
      case 'completed':
        return {
          label: 'Completed',
          variant: 'default' as const,
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        };
      case 'draft':
      default:
        return {
          label: 'In Progress',
          variant: 'secondary' as const,
          icon: Edit,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Format form type for display
  const formatFormType = (type: string) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] z-50 border-[#036635]/20 dark:border-[#FECC07]/30 animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#036635] dark:text-[#FECC07]" />
            <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Assessment Review</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Review the assessment form by {reviewerName}
          </DialogDescription>
        </DialogHeader>

        {/* Status Header Info */}
        <div className="rounded-lg p-4 border border-primary/20 bg-primary/5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-primary">Reviewer:</span>
              <p className="mt-1">{reviewerName}</p>
            </div>
            <div>
              <span className="font-medium text-primary">Form Type:</span>
              <p className="mt-1">{formatFormType(formType)}</p>
            </div>
            <div>
              <span className="font-medium text-primary">Status:</span>
              <div className="mt-1">
                <Badge variant={statusInfo.variant} className={statusInfo.className}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
            {assessment.submittedAt != null && (
              <div>
                <span className="font-medium text-primary">Submitted:</span>
                <p className="mt-1">
                  {(() => {
                    const submittedAt = assessment.submittedAt as { toDate?: () => Date; seconds?: number } | string | undefined;
                    if (submittedAt && typeof submittedAt === 'object' && submittedAt.toDate) {
                      return new Date(submittedAt.toDate()).toLocaleString();
                    }
                    if (submittedAt && typeof submittedAt === 'object' && submittedAt.seconds) {
                      return new Date(submittedAt.seconds * 1000).toLocaleString();
                    }
                    return String(submittedAt || '');
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">

            {/* Form Sections */}
            {sections.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {section.fields.map(({ key, label }) => (
                    <div key={key} className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="col-span-1 font-medium text-sm text-muted-foreground">
                        {label}:
                      </div>
                      <div className="col-span-2 text-sm">
                        {renderFieldValue((formData as Record<string, unknown>)[key])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* If no sections found, show raw data */}
            {sections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No assessment data available</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons - Only show for submitted assessments */}
        {assessment.status === 'submitted' && protocolId && (
          <>
            <Separator />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Approve'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="border-[#036635]/20 dark:border-[#FECC07]/30 animate-in fade-in zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Reject Assessment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this assessment. This will be visible to the reviewer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? 'Processing...' : 'Reject Assessment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

