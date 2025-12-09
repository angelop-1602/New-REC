"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  FileText as FileTextIcon,
  RefreshCw,
  MoreVertical,
  Download,
  FileJson,
} from "lucide-react";
import { reviewerService } from "@/lib/services/reviewers/reviewerService";
import { ApproveDialog } from "./dialogs/ApproveDialog";
import { RejectDialog } from "./dialogs/RejectDialog";
import { DecisionDialog } from "./dialogs/DecisionDialog";
import { AssignReviewersDialog } from "./dialogs/AssignReviewersDialog";
import { ReassignReviewerDialog } from "./dialogs/ReassignReviewerDialog";
import { ViewAssessmentDialog } from "./dialogs/ViewAssessmentDialog";
import { getProtocolReviewerAssessments, ProtocolAssessmentsResult } from "@/lib/services/assessments/assessmentAggregationService";
import { Separator } from "@/components/ui/separator";
import { ProtocolReports } from "@/components/rec/proponent/application/components/protocol/report";
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { enhancedDocumentManagementService } from "@/lib/services/documents/enhancedDocumentManagementService";
import { useRealtimeDocuments } from "@/hooks/useRealtimeDocuments";
import { useRealtimeProtocol } from "@/hooks/useRealtimeProtocol";
import { documentGenerator } from "@/lib/services/documents/documentGenerator";
import { getCurrentChairName } from "@/lib/services/core/recSettingsService";
import { extractTemplateData } from "@/lib/services/documents/templateDataMapper";
import { customToast } from "@/components/ui/custom/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  toChairpersonProtocol,
  getProtocolCode,
  toDate,
  FirestoreDate
} from '@/types';

interface ChairpersonActionsProps {
  submission: Record<string, unknown>;
  onStatusUpdate: (status: string) => void;
}

export function ChairpersonActions({
  submission: initialSubmission,
  onStatusUpdate,
}: ChairpersonActionsProps) {
  const router = useRouter();
  
  // Convert to typed protocol at the top
  const typedInitialSubmission = toChairpersonProtocol(initialSubmission);
  
  // ⚡ Use real-time protocol hook for all protocol data updates
  const { protocol: realtimeProtocol } = useRealtimeProtocol({
    protocolId: String(typedInitialSubmission.id),
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: true,
  });

  // Use realtime protocol if available, fallback to initial submission
  const rawSubmission = realtimeProtocol || initialSubmission;
  const submission = toChairpersonProtocol(rawSubmission);

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [assignReviewersDialogOpen, setAssignReviewersDialogOpen] =
    useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [viewAssessmentDialogOpen, setViewAssessmentDialogOpen] = useState(false);

  // Reviewer assignment states
  const [assignedReviewers, setAssignedReviewers] = useState<Record<string, unknown>[]>([]);
  const [selectedAssignmentToReassign, setSelectedAssignmentToReassign] = useState<Record<string, unknown> | null>(null);
  const [selectedAssessmentToView, setSelectedAssessmentToView] = useState<Record<string, unknown> | null>(null);
  const [selectedReviewerName, setSelectedReviewerName] = useState<string>("");
  const [assessments, setAssessments] = useState<Record<string, unknown> | null>(null);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  // ⚡ Use real-time documents hook for auto-updates
  const { documents: realtimeDocs, loading: loadingDocuments } = useRealtimeDocuments({
    protocolId: String(submission.id),
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: submission.status === "pending",
  });

  // Document validation states
  const documents = realtimeDocs;
  const [allDocumentsAccepted, setAllDocumentsAccepted] = useState(false);
  const [documentRequests, setDocumentRequests] = useState<Record<string, unknown>[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Load assigned reviewers when component mounts
  useEffect(() => {
    const loadAssignedReviewers = async () => {
      try {
        const existingAssignments = await reviewerService.getProtocolReviewers(
          String(submission.id)
        );
        setAssignedReviewers(existingAssignments);
      } catch (error) {
        console.error("Error loading assigned reviewers:", error);
      }
    };

    loadAssignedReviewers();
  }, [submission.id]);

  // ⚡ Real-time check if all documents are accepted
  useEffect(() => {
    const checkDocuments = async () => {
      if (submission.status === "pending" && !loadingDocuments) {
        try {
          // Load document requests
          const requests = await enhancedDocumentManagementService.getProtocolDocumentRequests(String(submission.id));
          setDocumentRequests(requests as unknown as Record<string, unknown>[]);
          
          // Count pending requests (documents with status "requested")
          const pending = requests.filter((r) => {
            const status = ((r as unknown as Record<string, unknown>).currentStatus as string) || ((r as unknown as Record<string, unknown>).status as string);
            return status === 'requested';
          }).length;
          setPendingRequestsCount(pending);
          
          // Check if all documents are accepted AND no pending requests
          const hasDocuments = documents.length > 0;
          const allAccepted = documents.every((doc) => {
            const docRec = doc as unknown as Record<string, unknown>;
            const docStatus = (docRec.currentStatus as string) || (docRec.status as string);
            return docStatus === "accepted";
          });
          const noPendingRequests = pending === 0;
          
          const shouldEnableButton = hasDocuments && allAccepted && noPendingRequests;
          setAllDocumentsAccepted(shouldEnableButton);

        } catch (error) {
          console.error("Error checking documents:", error);
          setAllDocumentsAccepted(false);
        }
      }
    };

    checkDocuments();
  }, [submission.id, submission.status, documents, loadingDocuments]);

  // Function to reload assigned reviewers
  const handleAssignmentsUpdate = async () => {
    try {
      const existingAssignments = await reviewerService.getProtocolReviewers(
        submission.id
      );
      setAssignedReviewers(existingAssignments);
    } catch (error) {
      console.error("Error loading assigned reviewers:", error);
    }
  };

  // Load aggregated reviewer assessments whenever there are assigned reviewers
  useEffect(() => {
    const loadAggregated = async () => {
      try {
        setLoadingAssessments(true);
        const result = await getProtocolReviewerAssessments(String(submission.id));
        setAssessments(result as unknown as Record<string, unknown> | null);
      } catch (e) {
        console.error("Failed to load reviewer assessments:", e);
      } finally {
        setLoadingAssessments(false);
      }
    };

    // Load assessments whenever there are assigned reviewers (even if not all completed)
    if (assignedReviewers.length > 0) {
      loadAggregated();
    }
  }, [assignedReviewers, submission.id]);

  // Manual refresh function for assessments
  const handleRefreshAssessments = async () => {
    try {
      setLoadingAssessments(true);
      const result = await getProtocolReviewerAssessments(String(submission.id));
      setAssessments(result as unknown as Record<string, unknown> | null);
    } catch (e) {
      console.error("Failed to refresh assessments:", e);
    } finally {
      setLoadingAssessments(false);
    }
  };

  // Helpers for row actions
  const handleViewAssessment = (assessment: Record<string, unknown>, reviewerName: string) => {
    setSelectedAssessmentToView(assessment);
    setSelectedReviewerName(reviewerName);
    setViewAssessmentDialogOpen(true);
  };

  const handleDownloadJson = (assessment: Record<string, unknown>, submissionId: string, reviewerId: string) => {
    // Structure JSON to follow question sequence (same as ViewAssessmentDialog)
    const formData = (assessment.formData ?? {}) as Record<string, unknown>;
    const formType = assessment.formType;
    
    // Define sections in order (same structure as ViewAssessmentDialog)
    const getOrderedStructure = () => {
      const protocolInfo: Record<string, unknown> = {
        'iacucCode': formData.iacucCode,
        'protocolCode': formData.protocolCode,
        'submissionDate': formData.submissionDate,
        'title': formData.title,
        'studySite': formData.studySite,
        'principalInvestigator': formData.principalInvestigator,
        'sponsor': formData.sponsor,
        'typeOfReview': formData.typeOfReview,
      };

      switch (formType) {
        case 'protocol-review':
          return {
            'Protocol Information': protocolInfo,
            '1. SOCIAL VALUE': {
              'socialValue': formData.socialValue,
              'socialValueComments': formData.socialValueComments,
            },
            '2. SCIENTIFIC SOUNDNESS': {
              'studyObjectives': formData.studyObjectives,
              'studyObjectivesComments': formData.studyObjectivesComments,
              'literatureReview': formData.literatureReview,
              'literatureReviewComments': formData.literatureReviewComments,
              'researchDesign': formData.researchDesign,
              'researchDesignComments': formData.researchDesignComments,
              'dataCollection': formData.dataCollection,
              'dataCollectionComments': formData.dataCollectionComments,
              'inclusionExclusion': formData.inclusionExclusion,
              'inclusionExclusionComments': formData.inclusionExclusionComments,
              'withdrawalCriteria': formData.withdrawalCriteria,
              'withdrawalCriteriaComments': formData.withdrawalCriteriaComments,
              'facilities': formData.facilities,
              'facilitiesComments': formData.facilitiesComments,
              'investigatorQualification': formData.investigatorQualification,
              'investigatorQualificationComments': formData.investigatorQualificationComments,
            },
            '3. ETHICAL SOUNDNESS': {
              'privacyConfidentiality': formData.privacyConfidentiality,
              'privacyConfidentialityComments': formData.privacyConfidentialityComments,
              'conflictOfInterest': formData.conflictOfInterest,
              'conflictOfInterestComments': formData.conflictOfInterestComments,
              'humanParticipants': formData.humanParticipants,
              'humanParticipantsComments': formData.humanParticipantsComments,
              'vulnerablePopulations': formData.vulnerablePopulations,
              'vulnerablePopulationsComments': formData.vulnerablePopulationsComments,
              'voluntaryRecruitment': formData.voluntaryRecruitment,
              'voluntaryRecruitmentComments': formData.voluntaryRecruitmentComments,
              'riskBenefit': formData.riskBenefit,
              'riskBenefitComments': formData.riskBenefitComments,
              'informedConsent': formData.informedConsent,
              'informedConsentComments': formData.informedConsentComments,
              'communityConsiderations': formData.communityConsiderations,
              'communityConsiderationsComments': formData.communityConsiderationsComments,
              'collaborativeTerms': formData.collaborativeTerms,
              'collaborativeTermsComments': formData.collaborativeTermsComments,
            },
            'III. RECOMMENDATION': {
              'recommendation': formData.recommendation,
              'justification': formData.justification,
            },
          };
        case 'informed-consent':
          const questions: Record<string, unknown> = {};
          for (let i = 1; i <= 17; i++) {
            questions[`q${i}`] = formData[`q${i}`];
            questions[`q${i}Comments`] = formData[`q${i}Comments`];
          }
          return {
            'Protocol Information': { ...protocolInfo, iacucCode: undefined, typeOfReview: undefined },
            'II. Guide Questions for Assessment': questions,
            'Recommendation': {
              'recommendation': formData.recommendation,
              'recommendationJustification': formData.recommendationJustification,
            },
          };
        case 'exemption-checklist':
          return {
            'Protocol Information': { ...protocolInfo, iacucCode: undefined, typeOfReview: undefined },
            'II. Protocol Assessment': {
              'involvesHumanParticipants': formData.involvesHumanParticipants,
              'involvesHumanParticipantsComments': formData.involvesHumanParticipantsComments,
              'involvesNonIdentifiableTissue': formData.involvesNonIdentifiableTissue,
              'involvesNonIdentifiableTissueComments': formData.involvesNonIdentifiableTissueComments,
              'involvesPublicData': formData.involvesPublicData,
              'involvesPublicDataComments': formData.involvesPublicDataComments,
              'involvesInteraction': formData.involvesInteraction,
              'involvesInteractionComments': formData.involvesInteractionComments,
              'qualityAssurance': formData.qualityAssurance,
              'qualityAssuranceComments': formData.qualityAssuranceComments,
              'publicServiceEvaluation': formData.publicServiceEvaluation,
              'publicServiceEvaluationComments': formData.publicServiceEvaluationComments,
              'publicHealthSurveillance': formData.publicHealthSurveillance,
              'publicHealthSurveillanceComments': formData.publicHealthSurveillanceComments,
              'educationalEvaluation': formData.educationalEvaluation,
              'educationalEvaluationComments': formData.educationalEvaluationComments,
              'consumerAcceptability': formData.consumerAcceptability,
              'consumerAcceptabilityComments': formData.consumerAcceptabilityComments,
              'surveysQuestionnaire': formData.surveysQuestionnaire,
              'surveysQuestionnaireComments': formData.surveysQuestionnaireComments,
              'interviewsFocusGroup': formData.interviewsFocusGroup,
              'interviewsFocusGroupComments': formData.interviewsFocusGroupComments,
              'publicObservations': formData.publicObservations,
              'publicObservationsComments': formData.publicObservationsComments,
              'existingData': formData.existingData,
              'existingDataComments': formData.existingDataComments,
              'audioVideo': formData.audioVideo,
              'audioVideoComments': formData.audioVideoComments,
              'dataAnonymization': formData.dataAnonymization,
              'foreseeableRisk': formData.foreseeableRisk,
              'foreseeableRiskComments': formData.foreseeableRiskComments,
            },
            'II. Risk Assessment': {
              'riskVulnerableGroups': formData.riskVulnerableGroups,
              'riskVulnerableGroupsComments': formData.riskVulnerableGroupsComments,
              'riskSensitiveTopics': formData.riskSensitiveTopics,
              'riskSensitiveTopicsComments': formData.riskSensitiveTopicsComments,
              'riskUseOfDrugs': formData.riskUseOfDrugs,
              'riskUseOfDrugsComments': formData.riskUseOfDrugsComments,
              'riskInvasiveProcedure': formData.riskInvasiveProcedure,
              'riskInvasiveProcedureComments': formData.riskInvasiveProcedureComments,
              'riskPhysicalDistress': formData.riskPhysicalDistress,
              'riskPhysicalDistressComments': formData.riskPhysicalDistressComments,
              'riskPsychologicalDistress': formData.riskPsychologicalDistress,
              'riskPsychologicalDistressComments': formData.riskPsychologicalDistressComments,
              'riskDeception': formData.riskDeception,
              'riskDeceptionComments': formData.riskDeceptionComments,
              'riskAccessData': formData.riskAccessData,
              'riskAccessDataComments': formData.riskAccessDataComments,
              'riskConflictInterest': formData.riskConflictInterest,
              'riskConflictInterestComments': formData.riskConflictInterestComments,
              'riskOtherDilemmas': formData.riskOtherDilemmas,
              'riskOtherDilemmasComments': formData.riskOtherDilemmasComments,
              'riskBloodSampling': formData.riskBloodSampling,
              'riskBloodSamplingComments': formData.riskBloodSamplingComments,
            },
            'Decision': {
              'decision': formData.decision,
              'decisionJustification': formData.decisionJustification,
            },
          };
        case 'iacuc-review':
          return {
            'Protocol Information': protocolInfo,
            '1. SCIENTIFIC VALUE': {
              'scientificValue': formData.scientificValue,
              'scientificValueComments': formData.scientificValueComments,
            },
            '2. SCIENTIFIC SOUNDNESS': {
              'studyObjectives': formData.studyObjectives,
              'studyObjectivesComments': formData.studyObjectivesComments,
              'literatureReview': formData.literatureReview,
              'literatureReviewComments': formData.literatureReviewComments,
              'researchDesign': formData.researchDesign,
              'researchDesignComments': formData.researchDesignComments,
              'dataCollection': formData.dataCollection,
              'dataCollectionComments': formData.dataCollectionComments,
              'facilitiesInfrastructure': formData.facilitiesInfrastructure,
              'facilitiesInfrastructureComments': formData.facilitiesInfrastructureComments,
              'investigatorQualifications': formData.investigatorQualifications,
              'investigatorQualificationsComments': formData.investigatorQualificationsComments,
            },
            '3. JUSTIFICATION ON THE USE OF ANIMALS': {
              'animalSource': formData.animalSource,
              'animalSourceComments': formData.animalSourceComments,
              'housingCare': formData.housingCare,
              'housingCareComments': formData.housingCareComments,
              'restraintProcedures': formData.restraintProcedures,
              'restraintProceduresComments': formData.restraintProceduresComments,
              'anesthesiaAnalgesia': formData.anesthesiaAnalgesia,
              'anesthesiaAnalgesiaComments': formData.anesthesiaAnalgesiaComments,
              'postProcedureMonitoring': formData.postProcedureMonitoring,
              'postProcedureMonitoringComments': formData.postProcedureMonitoringComments,
              'euthanasia': formData.euthanasia,
              'euthanasiaComments': formData.euthanasiaComments,
              'biologicalAgentCollection': formData.biologicalAgentCollection,
              'biologicalAgentCollectionComments': formData.biologicalAgentCollectionComments,
              'examinationMethods': formData.examinationMethods,
              'examinationMethodsComments': formData.examinationMethodsComments,
              'surgicalProcedures': formData.surgicalProcedures,
              'surgicalProceduresComments': formData.surgicalProceduresComments,
              'humaneEndpoints': formData.humaneEndpoints,
              'humaneEndpointsComments': formData.humaneEndpointsComments,
              'potentialHazards': formData.potentialHazards,
              'potentialHazardsComments': formData.potentialHazardsComments,
              'wasteDisposal': formData.wasteDisposal,
              'wasteDisposalComments': formData.wasteDisposalComments,
            },
            'Recommendation': {
              'recommendation': formData.recommendation,
              'justification': formData.justification,
            },
          };
        default:
          return formData;
      }
    };

    const orderedData = getOrderedStructure();
    const dataStr = URL.createObjectURL(
      new Blob([JSON.stringify(orderedData, null, 2)], {
        type: "application/json",
      })
    );
    const link = document.createElement("a");
    link.href = dataStr;
    link.download = `assessment_${submissionId}_${reviewerId}_${assessment.formType}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(dataStr);
  };

  const handleExportTemplate = async (assessment: Record<string, unknown>) => {
    try {
      const { exportAssessmentFormToTemplate, downloadAssessmentForm } = await import(
        '@/lib/services/assessments/assessmentFormExportService'
      );
      
      // Ensure submittedAt is available to the template (it's stored on the assessment doc, not formData)
      const formDataForExport = {
        ...(assessment.formData || {}),
        submittedAt: assessment.submittedAt || (assessment.formData as Record<string, unknown>)?.submittedAt || null,
        status: assessment.status || (assessment.formData as Record<string, unknown>)?.status || 'draft',
      };

      // Export form to Word template
      const blob = await exportAssessmentFormToTemplate(
        formDataForExport,
        assessment.formType as string,
        submission,
        { name: assessment.reviewerName as string, reviewerName: assessment.reviewerName as string }
      );
      
      // Generate filename
      const formTypeName = (assessment.formType as string).replace(/-/g, '_');
      const fileName = `${getProtocolCode(submission) || String(submission.id)}_${formTypeName}_${(assessment.reviewerId as string) || 'reviewer'}.docx`;
      
      // Download the file
      downloadAssessmentForm(blob, fileName);
    } catch (error) {
      console.error('Error exporting assessment form to template:', error);
        customToast.error(
          "Export Failed",
          "Failed to export assessment form. Please try again."
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const isApproved =
    submission.status === "approved" || submission.status === "archived";

  return (
    <>
      <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden p-0">
        <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 rounded-t-lg pt-6 pb-6">
          <CardTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Administrative Actions</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(submission.status)}
              <Badge
                variant={
                  submission.status === "approved" ||
                  submission.status === "accepted"
                    ? "default"
                    : (submission.status as string) === "rejected"
                    ? "destructive"
                    : "secondary"
                }
                className="border-[#036635]/20 dark:border-[#FECC07]/30"
              >
                {submission.status.charAt(0).toUpperCase() +
                  submission.status.slice(1)}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Manage protocol review and approval process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {/* Document Status Summary for Pending Protocols */}
          {submission.status === "pending" && (documents.length > 0 || documentRequests.length > 0) && (
            <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Document Review Status</span>
                </div>
                <div className="flex gap-2">
                  {documents.length > 0 && (
                    <Badge variant={documents.every((d) => {
                      const dRec = d as unknown as Record<string, unknown>;
                      const status = (dRec.currentStatus as string) || (dRec.status as string);
                      return status === "accepted";
                    }) ? "default" : "secondary"}>
                      {documents.filter((d) => {
                        const dRec = d as unknown as Record<string, unknown>;
                        const status = (dRec.currentStatus as string) || (dRec.status as string);
                        return status === "accepted";
                      }).length} / {documents.length} Accepted
                    </Badge>
                  )}
                  {pendingRequestsCount > 0 && (
                    <Badge variant="destructive" className="bg-blue-100 text-blue-800 border-blue-200">
                      {pendingRequestsCount} Requested Document{pendingRequestsCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              {!allDocumentsAccepted && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {pendingRequestsCount > 0 && `${pendingRequestsCount} requested document(s) must be uploaded by proponent. `}
                    {documents.some((d) => {
                      const dRec = d as unknown as Record<string, unknown>;
                      const status = (dRec.currentStatus as string) || (dRec.status as string);
                      return status !== "accepted" && status !== "requested";
                    }) && `${documents.filter((d) => {
                      const dRec = d as unknown as Record<string, unknown>;
                      const status = (dRec.currentStatus as string) || (dRec.status as string);
                      return status !== "accepted" && status !== "requested";
                    }).length} document(s) need review. `}
                  </p>
                  <p className="text-sm font-medium text-[#036635] dark:text-[#FECC07]">
                    Review and accept all documents before accepting the protocol.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Info */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-3 flex-wrap">
              {submission.status === "pending" && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            onClick={() => setApproveDialogOpen(true)}
                            className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
                            disabled={!allDocumentsAccepted || loadingDocuments}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept Protocol
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!allDocumentsAccepted && !loadingDocuments && (
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-semibold">Cannot Accept Protocol</p>
                            <p className="text-sm">
                              {documents.length === 0 
                                ? "No documents have been submitted yet" 
                                : pendingRequestsCount > 0
                                ? `${pendingRequestsCount} requested document(s) pending fulfillment by proponent`
                                : `${documents.filter((d) => {
                                    const dRec = d as unknown as Record<string, unknown>;
                                    const status = (dRec.currentStatus as string) || (dRec.status as string);
                                    return status !== "accepted";
                                  }).length} document(s) need to be reviewed and accepted`}
                            </p>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    variant="destructive"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Protocol
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(submission.status === "accepted") && assignedReviewers.length === 0 && (
                <Button
                  onClick={() => setAssignReviewersDialogOpen(true)}
                  className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Assign Reviewers
                </Button>
              )}

              {submission.status === "accepted" && !submission.decision && (
                <Button
                  onClick={() => setDecisionDialogOpen(true)}
                  variant="outline"
                  className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300 hover:scale-105"
                >
                  <CheckCircle className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                  Make Decision
                </Button>
              )}
              {submission.status === "accepted" && !submission.decision && (
                <Button
                  onClick={() =>
                    router.push(
                      `/rec/chairperson/protocol/${submission.id}/generate-documents`
                    )
                  }
                  variant="outline"
                  className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300 hover:scale-105"
                >
                  <FileTextIcon className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                  Generate Documents
                </Button>
              )}
            </div>
          </div>

          {/* Reviewer Assessments Summary */}
          {assignedReviewers.length > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">
                  Reviewer Assessments Summary
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshAssessments}
                  disabled={loadingAssessments}
                  className="text-xs"
                >
                  {loadingAssessments ? (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Refresh Status
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant={assessments?.allCompleted ? "default" : "secondary"}
                >
                  {assessments ? `${assessments.totalCompleted}/${assessments.totalAssigned}` : `${assignedReviewers.filter(r => r.reviewStatus === "completed").length}/${assignedReviewers.length}`} Completed
                </Badge>
                {assessments && (
                  <Button
                    variant="outline"
                    size="sm"
                  className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300"
                    onClick={async () => {
                      const { formatAssessmentsToDocxData } = await import(
                        "@/lib/services/assessments/assessmentAggregationService"
                      );
                      const { buildReviewerSummaryDocx } = await import(
                        "@/lib/services/documents/wordExportService"
                      );
                      const docxData = formatAssessmentsToDocxData(
                        submission,
                        assessments as unknown as ProtocolAssessmentsResult
                      );
                      const blob = await buildReviewerSummaryDocx(docxData);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Consolidated_Reviews_${submission.id}.docx`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Export All Reviews
                  </Button>
                )}
              </div>
              <Separator className="my-2" />
              <div className="space-y-2">
                {assignedReviewers.map((assignment) => {
                  const deadline = toDate(assignment.deadline as FirestoreDate) || new Date();
                  const now = new Date();

                  // Find corresponding assessment data if available
                  const assessment = ((assessments as unknown as ProtocolAssessmentsResult)?.assessments as unknown as Record<string, unknown>[])?.find(
                    (a: Record<string, unknown>) => (a.reviewerId as string) === (assignment.reviewerId as string)
                  );

                  // Determine the actual status to display
                  const getAssessmentStatus = () => {
                    if (assessment?.status) {
                      switch (assessment.status) {
                        case 'draft':
                          return { label: 'In Progress', variant: 'secondary' as const, isCompleted: false };
                        case 'submitted':
                          return { label: 'Submitted', variant: 'default' as const, isCompleted: true };
                        case 'approved':
                          return { label: 'Approved', variant: 'default' as const, isCompleted: true };
                        case 'returned':
                          return { label: 'Returned', variant: 'destructive' as const, isCompleted: false };
                        case 'completed':
                          return { label: 'Completed', variant: 'default' as const, isCompleted: true };
                        default:
                          return { label: 'In Progress', variant: 'secondary' as const, isCompleted: false };
                      }
                    }
                    // Fallback to assignment status if no assessment
                    if (assignment.reviewStatus === 'completed') {
                      return { label: 'Completed', variant: 'default' as const, isCompleted: true };
                    }
                    return { label: 'Not Started', variant: 'outline' as const, isCompleted: false };
                  };

                  const statusInfo = getAssessmentStatus();

                  // Check if overdue - should be overdue if deadline passed and not completed
                  const isOverdue = deadline < now && !statusInfo.isCompleted;
                  const daysOverdue = isOverdue
                    ? Math.ceil(
                        (now.getTime() - deadline.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 0;
                  const daysRemaining = !isOverdue
                    ? Math.ceil(
                        (deadline.getTime() - now.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : 0;

                  return (
                    <div
                      key={String(assignment.id)}
                      className="flex items-center justify-between p-3 bg-background rounded border text-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {String(assignment.reviewerName || 'Unknown')}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {assessment ? `Form: ${assessment.formType as string} • ` : ''}
                          Status: {statusInfo.label} • 
                          Due: {deadline.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            statusInfo.isCompleted
                              ? "default"
                              : isOverdue
                              ? "destructive"
                              : daysRemaining <= 3
                              ? "secondary"
                              : statusInfo.variant
                          }
                          className="text-xs"
                        >
                          {statusInfo.isCompleted
                            ? statusInfo.label
                            : isOverdue
                            ? `${daysOverdue} days overdue`
                            : daysRemaining <= 3
                            ? `${daysRemaining} days left`
                            : `${daysRemaining} days left`}
                        </Badge>
                        {/* Actions menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              disabled={!assessment || !assessment.formData}
                              onClick={() => assessment && handleViewAssessment(assessment, String(assignment.reviewerName || 'Unknown'))}
                            >
                              <FileTextIcon className="mr-2 h-4 w-4" />
                              View Assessment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!assessment || !assessment.formData}
                              onClick={() => assessment && handleDownloadJson(assessment, String(submission.id), String(assignment.reviewerId))}
                            >
                              <FileJson className="mr-2 h-4 w-4" />
                              Download JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!assessment || !assessment.formData}
                              onClick={() => assessment && handleExportTemplate(assessment)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Export to Template
                            </DropdownMenuItem>
                            {isOverdue && !statusInfo.isCompleted && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedAssignmentToReassign(assignment);
                                    setReassignDialogOpen(true);
                                  }}
                                >
                                  <Users className="mr-2 h-4 w-4" />
                                  Reassign Reviewer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Research Reports - Integrated for approved protocols */}
          {isApproved && (
            <ProtocolReports
              progressReports={[]}
              onSubmitProgressReport={() => {}} // Empty function for chairperson view-only
              onSubmitFinalReport={() => {}} // Empty function for chairperson view-only
              isApproved={true}
              isCompleted={submission.status === "archived"}
              isChairpersonView={true} // New prop to indicate chairperson view
              onGenerateArchiveNotification={async () => {
                try {
                  const chairName = await getCurrentChairName();
                  const data = extractTemplateData(submission, chairName);
                  const blob = await documentGenerator.generateDocument('archiving_notification', data);
                  const fileName = `${submission.spupCode || submission.tempProtocolCode || 'SPUP_REC'}_Archiving_Notification_${new Date().toISOString().split('T')[0]}.docx`;
                  documentGenerator.downloadDocument(blob, fileName);
                } catch (e) {
                  console.error('Failed to generate archiving notification:', e);
                }
              }}
              onUploadArchiveNotification={async (file: File) => {
                try {
                  const fileName = `${submission.spupCode || submission.tempProtocolCode || 'SPUP_REC'}_Archiving_Notification_${file.name}`;
                  const { storagePath, downloadUrl } = await documentGenerator.uploadToStorage(file, fileName, submission.id);
                } catch (e) {
                  console.error('Failed to upload archiving notification:', e);
                }
              }}
            />
          )}

          {/* Action Buttons */}
        </CardContent>
      </Card>

      {/* Dialog Components */}
      <ApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        submission={submission as unknown as Record<string, unknown>}
        onStatusUpdate={onStatusUpdate}
      />

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        submission={submission as unknown as Record<string, unknown>}
        onStatusUpdate={onStatusUpdate}
      />

      <DecisionDialog
        open={decisionDialogOpen}
        onOpenChange={setDecisionDialogOpen}
        submission={submission as unknown as Record<string, unknown>}
        onStatusUpdate={onStatusUpdate}
      />

      <AssignReviewersDialog
        open={assignReviewersDialogOpen}
        onOpenChange={setAssignReviewersDialogOpen}
        submission={submission as unknown as Record<string, unknown>}
        onAssignmentsUpdate={handleAssignmentsUpdate}
      />
      
      {/* Reassign Reviewer Dialog */}
      {selectedAssignmentToReassign && (
        <ReassignReviewerDialog
          open={reassignDialogOpen}
          onOpenChange={setReassignDialogOpen}
          assignment={selectedAssignmentToReassign}
          protocolId={submission.id}
          onReassignmentSuccess={() => {
            // Reload assigned reviewers and assessments
            handleAssignmentsUpdate();
          }}
        />
      )}
      
      {/* View Assessment Dialog */}
      {selectedAssessmentToView && (
        <ViewAssessmentDialog
          open={viewAssessmentDialogOpen}
          onOpenChange={setViewAssessmentDialogOpen}
          assessment={selectedAssessmentToView}
          reviewerName={selectedReviewerName}
          protocolId={submission.id}
          onStatusUpdate={handleRefreshAssessments}
        />
      )}
    </>
  );
}
