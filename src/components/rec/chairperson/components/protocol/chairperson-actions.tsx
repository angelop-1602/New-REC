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
  AlertTriangle,
  Users,
  FileText as FileTextIcon,
  RefreshCw,
  MoreVertical,
  Download,
  FileJson,
} from "lucide-react";
import { reviewerService } from "@/lib/services/reviewerService";
import { ApproveDialog } from "./dialogs/ApproveDialog";
import { RejectDialog } from "./dialogs/RejectDialog";
import { DecisionDialog } from "./dialogs/DecisionDialog";
import { AssignReviewersDialog } from "./dialogs/AssignReviewersDialog";
import { ReassignReviewerDialog } from "./dialogs/ReassignReviewerDialog";
import { ViewAssessmentDialog } from "./dialogs/ViewAssessmentDialog";
import { getProtocolReviewerAssessments } from "@/lib/services/assessmentAggregationService";
import { Separator } from "@/components/ui/separator";
import { ProtocolReports } from "@/components/rec/proponent/application/components/protocol/report";
import { getSubmissionDocuments, SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { enhancedDocumentManagementService } from "@/lib/services/enhancedDocumentManagementService";
import { useRealtimeDocuments } from "@/hooks/useRealtimeDocuments";
import { useRealtimeProtocol } from "@/hooks/useRealtimeProtocol";
import { documentGenerator } from "@/lib/services/documentGenerator";
import { getCurrentChairName } from "@/lib/services/recSettingsService";
import { extractTemplateData } from "@/lib/services/templateDataMapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChairpersonActionsProps {
  submission: any;
  onStatusUpdate: (status: string) => void;
}

export function ChairpersonActions({
  submission: initialSubmission,
  onStatusUpdate,
}: ChairpersonActionsProps) {
  const router = useRouter();
  
  // ⚡ Use real-time protocol hook for all protocol data updates
  const { protocol: realtimeProtocol, loading: protocolLoading } = useRealtimeProtocol({
    protocolId: initialSubmission.id,
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: true,
  });

  // Use realtime protocol if available, fallback to initial submission
  const submission = realtimeProtocol || initialSubmission;

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [assignReviewersDialogOpen, setAssignReviewersDialogOpen] =
    useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [viewAssessmentDialogOpen, setViewAssessmentDialogOpen] = useState(false);

  // Reviewer assignment states
  const [assignedReviewers, setAssignedReviewers] = useState<any[]>([]);
  const [selectedAssignmentToReassign, setSelectedAssignmentToReassign] = useState<any | null>(null);
  const [selectedAssessmentToView, setSelectedAssessmentToView] = useState<any | null>(null);
  const [selectedReviewerName, setSelectedReviewerName] = useState<string>("");
  const [assessments, setAssessments] = useState<any | null>(null);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  // ⚡ Use real-time documents hook for auto-updates
  const { documents: realtimeDocs, loading: loadingDocuments } = useRealtimeDocuments({
    protocolId: submission.id,
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: submission.status === "pending",
  });

  // Document validation states
  const documents = realtimeDocs;
  const [allDocumentsAccepted, setAllDocumentsAccepted] = useState(false);
  const [documentRequests, setDocumentRequests] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Load assigned reviewers when component mounts
  useEffect(() => {
    const loadAssignedReviewers = async () => {
      try {
        const existingAssignments = await reviewerService.getProtocolReviewers(
          submission.id
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
          const requests = await enhancedDocumentManagementService.getProtocolDocumentRequests(submission.id);
          setDocumentRequests(requests);
          
          // Count pending requests (documents with status "requested")
          const pending = requests.filter((r: any) => r.currentStatus === 'requested' || r.status === 'requested').length;
          setPendingRequestsCount(pending);
          
          // Check if all documents are accepted AND no pending requests
          const hasDocuments = documents.length > 0;
          const allAccepted = documents.every((doc: any) => {
            const docStatus = doc.currentStatus || doc.status;
            console.log(`📄 Document "${doc.title}": status="${doc.status}", currentStatus="${doc.currentStatus}", final="${docStatus}"`);
            return docStatus === "accepted";
          });
          const noPendingRequests = pending === 0;
          
          const shouldEnableButton = hasDocuments && allAccepted && noPendingRequests;
          setAllDocumentsAccepted(shouldEnableButton);
          
          console.log(`✅ Documents check:`, {
            totalDocs: documents.length,
            acceptedDocs: documents.filter((d: any) => {
              const docStatus = d.currentStatus || d.status;
              return docStatus === "accepted";
            }).length,
            pendingRequests: pending,
            hasDocuments,
            allAccepted,
            noPendingRequests,
            buttonEnabled: shouldEnableButton
          });
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
        const result = await getProtocolReviewerAssessments(submission.id);
        setAssessments(result);
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
      const result = await getProtocolReviewerAssessments(submission.id);
      setAssessments(result);
    } catch (e) {
      console.error("Failed to refresh assessments:", e);
    } finally {
      setLoadingAssessments(false);
    }
  };

  // Helpers for row actions
  const handleViewAssessment = (assessment: any, reviewerName: string) => {
    setSelectedAssessmentToView(assessment);
    setSelectedReviewerName(reviewerName);
    setViewAssessmentDialogOpen(true);
  };

  const handleDownloadJson = (assessment: any, submissionId: string, reviewerId: string) => {
    // Structure JSON to follow question sequence (same as ViewAssessmentDialog)
    const formData = assessment.formData ?? {};
    const formType = assessment.formType;
    
    // Define sections in order (same structure as ViewAssessmentDialog)
    const getOrderedStructure = () => {
      const protocolInfo: any = {
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
          const questions: any = {};
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

  const handleExportTemplate = async (assessment: any) => {
    try {
      const { exportAssessmentFormToTemplate, downloadAssessmentForm } = await import(
        '@/lib/services/assessmentFormExportService'
      );
      
      // Ensure submittedAt is available to the template (it's stored on the assessment doc, not formData)
      const formDataForExport = {
        ...(assessment.formData || {}),
        submittedAt: assessment.submittedAt || assessment.formData?.submittedAt || null,
        status: assessment.status || assessment.formData?.status || 'draft',
      };

      // Export form to Word template
      const blob = await exportAssessmentFormToTemplate(
        formDataForExport,
        assessment.formType,
        submission,
        { name: assessment.reviewerName, reviewerName: assessment.reviewerName }
      );
      
      // Generate filename
      const formTypeName = assessment.formType.replace(/-/g, '_');
      const fileName = `${submission.spupCode || submission.id}_${formTypeName}_${assessment.reviewerId || 'reviewer'}.docx`;
      
      // Download the file
      downloadAssessmentForm(blob, fileName);
    } catch (error) {
      console.error('Error exporting assessment form to template:', error);
      alert('Failed to export assessment form. Please try again.');
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Administrative Actions</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(submission.status)}
              <Badge
                variant={
                  submission.status === "approved" ||
                  submission.status === "accepted"
                    ? "default"
                    : submission.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
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
        <CardContent className="space-y-4">
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
                    <Badge variant={documents.every((d: any) => {
                      const status = (d as any).currentStatus || d.status;
                      return status === "accepted";
                    }) ? "default" : "secondary"}>
                      {documents.filter((d: any) => {
                        const status = (d as any).currentStatus || d.status;
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
                    {documents.some((d: any) => {
                      const status = (d as any).currentStatus || d.status;
                      return status !== "accepted" && status !== "requested";
                    }) && `${documents.filter((d: any) => {
                      const status = (d as any).currentStatus || d.status;
                      return status !== "accepted" && status !== "requested";
                    }).length} document(s) need review. `}
                  </p>
                  <p className="text-sm font-medium text-primary">
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
                            className="bg-green-600 hover:bg-green-700"
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
                                : `${documents.filter((d: any) => {
                                    const status = (d as any).currentStatus || d.status;
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
                  className="bg-primary hover:bg-primary/80"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Assign Reviewers
                </Button>
              )}

              {submission.status === "accepted" && !submission.decision && (
                <Button
                  onClick={() => setDecisionDialogOpen(true)}
                  variant="outline"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
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
                >
                  <FileTextIcon className="mr-2 h-4 w-4" />
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
                    onClick={async () => {
                      const { formatAssessmentsToDocxData } = await import(
                        "@/lib/services/assessmentAggregationService"
                      );
                      const { buildReviewerSummaryDocx } = await import(
                        "@/lib/services/wordExportService"
                      );
                      const docxData = formatAssessmentsToDocxData(
                        submission,
                        assessments
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
                  const deadline =
                    assignment.deadline?.toDate?.() ||
                    new Date(assignment.deadline);
                  const now = new Date();

                  // Find corresponding assessment data if available
                  const assessment = assessments?.assessments.find(
                    (a: any) => a.reviewerId === assignment.reviewerId
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
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-background rounded border text-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {assignment.reviewerName}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {assessment ? `Form: ${assessment.formType} • ` : ''}
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
                              onClick={() => assessment && handleViewAssessment(assessment, assignment.reviewerName)}
                            >
                              <FileTextIcon className="mr-2 h-4 w-4" />
                              View Assessment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!assessment || !assessment.formData}
                              onClick={() => assessment && handleDownloadJson(assessment, submission.id, assignment.reviewerId)}
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
                  console.log('Uploaded archive notification to:', storagePath, downloadUrl);
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
        submission={submission}
        onStatusUpdate={onStatusUpdate}
      />

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        submission={submission}
        onStatusUpdate={onStatusUpdate}
      />

      <DecisionDialog
        open={decisionDialogOpen}
        onOpenChange={setDecisionDialogOpen}
        submission={submission}
        onStatusUpdate={onStatusUpdate}
      />

      <AssignReviewersDialog
        open={assignReviewersDialogOpen}
        onOpenChange={setAssignReviewersDialogOpen}
        submission={submission}
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
