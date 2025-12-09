"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  AlertCircle,
  Download,
  FileText,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DecisionData, 
  getDecisionStatus, 
  getDecisionColors 
} from "@/lib/services/core/decisionService";
import { toast } from "sonner";
import { ref, getStorage, getDownloadURL } from "firebase/storage";
import firebaseApp from "@/lib/firebaseConfig";
import { DecisionDialog } from "@/components/rec/chairperson/components/protocol/dialogs/DecisionDialog";
import { getSubmissionById } from "@/lib/firebase/firestore";
import { documentGenerator } from "@/lib/services/documents/documentGenerator";
import { extractTemplateData } from "@/lib/services/documents/templateDataMapper";
import { LoadingSimple } from "@/components/ui/loading";

// Helper function to handle document download (background download without opening tab)
const handleDocumentDownload = async (doc: any) => {
  if (!doc.storagePath) {
    toast.error('Download not available - storage path missing');
    console.error('No storagePath for document:', doc);
    return;
  }

  const toastId = toast.loading(`Preparing download: ${doc.fileName || 'document'}...`);
  
  try {
    // Fetch fresh download URL from Firebase Storage (like protocol-overview does)
    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, doc.storagePath);
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Use hidden iframe to trigger download without opening tab
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    
    // Wait for download to start, then clean up
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      toast.dismiss(toastId);
      toast.success('Download started!');
    }, 1000);
  } catch (error) {
    console.error('Error downloading document:', error);
    toast.dismiss(toastId);
    toast.error('Failed to download document. Please try again.');
  }
};

interface DecisionCardProps {
  protocolId: string;
  collection?: 'accepted' | 'approved';
  userRole?: 'chairperson' | 'proponent' | 'reviewer';
  className?: string;
  onDecisionUpdate?: () => void;
}

export function DecisionCard({ 
  protocolId, 
  collection = 'accepted',
  userRole = 'proponent',
  className,
  onDecisionUpdate
}: DecisionCardProps) {
  const router = useRouter();
  const [decisionData, setDecisionData] = useState<DecisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [submission, setSubmission] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Validate protocolId before making the call
        if (!protocolId || typeof protocolId !== 'string' || protocolId.trim() === '') {
          setError("Invalid protocol ID");
          setLoading(false);
          return;
        }

        setLoading(true);
        
        // Fetch decision data
        const data = await import("@/lib/services/core/decisionService").then(module => 
          module.getDecisionData(protocolId, collection)
        );
        setDecisionData(data);
        
        // Fetch submission data (needed for both chairperson edit dialog and proponent download forms)
        const submissionData = await getSubmissionById(protocolId);
        setSubmission(submissionData);
        
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load decision data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [protocolId, collection, userRole]);

  const handleEditDecision = () => {
    if (!submission) {
      toast.error("Unable to load protocol data. Please try again.");
      return;
    }
    setEditDialogOpen(true);
  };

  const handleDecisionUpdated = async () => {
    setEditDialogOpen(false);
    
    // Refresh decision data
    try {
      const data = await import("@/lib/services/core/decisionService").then(module => 
        module.getDecisionData(protocolId, collection)
      );
      setDecisionData(data);
      toast.success("Decision updated successfully!");
    } catch (err) {
      console.error("Error refreshing decision data:", err);
      toast.error("Failed to refresh decision data");
    }
    
    // Call parent callback
    if (onDecisionUpdate) {
      onDecisionUpdate();
    }
  };

  // ✅ USE CENTRALIZED DATA MAPPER - NO MORE DUPLICATE CODE!
  // All template data extraction is now in src/lib/services/templateDataMapper.ts

  // Handle Progress Report download (currently not used in UI)
  // Handle Progress Report download (currently not used in UI)
  // const handleDownloadProgressReport = async () => {
  //   const toastId = toast.loading("Generating Progress Report Form...");
  //   try {
  //     // ✅ Use centralized data mapper
  //     const templateData = extractTemplateData(submission);
  //     const blob = await documentGenerator.generateDocument('progress_report', templateData);
  //     const fileName = `Progress_Report_Form_${submission.spupCode || protocolId}.docx`;
  //     
  //     // Download the file
  //     const link = document.createElement('a');
  //     link.href = URL.createObjectURL(blob);
  //     link.download = fileName;
  //     link.click();
  //     URL.revokeObjectURL(link.href);
  //     
  //     toast.dismiss(toastId);
  //     toast.success("Progress Report Form downloaded successfully!");
  //   } catch (error) {
  //     console.error("Error generating progress report:", error);
  //     toast.dismiss(toastId);
  //     toast.error("Failed to generate Progress Report Form. Please try again.");
  //   }
  // };

  // Handle Final Report download (currently not used in UI)
  // Handle Final Report download (currently not used in UI)
  // const handleDownloadFinalReport = async () => {
  //   const toastId = toast.loading("Generating Final Report Form...");
  //   try {
  //     // ✅ Use centralized data mapper
  //     const templateData = extractTemplateData(submission);
  //     const blob = await documentGenerator.generateDocument('final_report', templateData);
  //     const fileName = `Final_Report_Form_${submission.spupCode || protocolId}.docx`;
  //     
  //     // Download the file
  //     const link = document.createElement('a');
  //     link.href = URL.createObjectURL(blob);
  //     link.download = fileName;
  //     link.click();
  //     URL.revokeObjectURL(link.href);
  //     
  //     toast.dismiss(toastId);
  //     toast.success("Final Report Form downloaded successfully!");
  //   } catch (error) {
  //     console.error("Error generating final report:", error);
  //     toast.dismiss(toastId);
  //     toast.error("Failed to generate Final Report Form. Please try again.");
  //   }
  // };

  // Don't render if protocolId is invalid
  if (!protocolId || typeof protocolId !== 'string' || protocolId.trim() === '') {
    return null;
  }

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSimple size="md" text="Loading decision..." />
        </CardContent>
      </Card>
    );
  }

  if (error || !decisionData?.details) {
    return null; // Don't show card if no decision exists
  }

  const { details, documents } = decisionData;
  
  // ⚠️ IMPORTANT: Decision status and colors are IDENTICAL for both proponent and chairperson
  // Only role-specific actions differ (buttons, download options), not the decision display itself
  
  // Determine if protocol is exempted (approved + EX researchType)
  const researchType = submission?.researchType || 
                       submission?.information?.nature_and_type_of_study?.type || '';
  const isExempted = details.decision === 'approved' && 
                     (researchType === 'EX' || researchType?.toString().toUpperCase() === 'EX' || 
                      researchType?.toString().toLowerCase().includes('exempt'));
  
  // Get decision status text - SAME for both proponent and chairperson
  const decisionStatus = getDecisionStatus(details.decision, isExempted);
  
  // Get decision colors - SAME for both proponent and chairperson
  const colors = isExempted ? {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-800'
  } : getDecisionColors(details.decision);

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approved':
        return CheckCircle;
      case 'approved_minor_revisions':
        return AlertTriangle;
      case 'major_revisions_deferred':
        return AlertCircle;
      case 'disapproved':
        return XCircle;
      case 'deferred':
        return AlertCircle;
      default:
        return CheckCircle;
    }
  };
  
  const Icon = getDecisionIcon(details.decision);
  
  // Determine display decision (exempted takes precedence)
  const displayDecision = isExempted ? 'exempted' : details.decision;
  
  // Check if full board for meeting reference display
  const typeOfReview = submission?.information?.general_information?.typeOfReview || 
                       submission?.typeOfReview || '';
  const isFullBoard = typeOfReview?.toString().toLowerCase() === 'full' || 
                      typeOfReview?.toString().toLowerCase() === 'full board';

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get decision instructions based on the improved format
  const getDecisionInstructions = (decision: string, timeline?: string) => {
    const timelineText = timeline || (decision === 'approved_minor_revisions' || decision === 'major_revisions_deferred' ? '14 days' : decision === 'deferred' ? '7 days' : '');
    
    switch (decision) {
      case 'approved':
        return {
          title: "Your protocol has been **approved** by the SPUP Research Ethics Committee.",
          subtitle: "You may now proceed with the conduct of your study following the approved protocol and documents.",
          instructions: [
            "Ensure all study activities follow the approved procedures and ethical conditions.",
            "Submit **progress reports** (Form 09B) based on the risk level and timeline indicated in your approval letter.",
            "Submit a **Final Report** (Form 14A) within one month after study completion.",
            "For any changes or amendments to your protocol, accomplish and submit **Form 10A** before implementation."
          ],
          footer: "For clarifications, use the system's messaging function to contact the REC Secretariat or Chair."
        };
      case 'approved_minor_revisions':
        return {
          title: "Your protocol requires **minor revisions** based on the reviewers' comments.",
          subtitle: "Please refer to the attached documents for specific recommendations.",
          instructions: [
            "Review all comments and recommendations in the decision letter.",
            "Revise your documents accordingly.",
            `Submit the revised version through the system using **Form 08A – Protocol Resubmission Form** within **${timelineText}**.`,
            "Notify the REC via the messaging function once resubmitted."
          ],
          footer: "Failure to resubmit within the given timeframe may result in the withdrawal of your application."
        };
      case 'major_revisions_deferred':
        return {
          title: "Your protocol requires **major revisions** before approval can be considered.",
          subtitle: "The revised version will undergo a **full board review** upon resubmission.",
          instructions: [
            "Review the detailed feedback in your attached decision letter.",
            "Address all major concerns and recommendations.",
            `Submit your revised protocol using **Form 08A – Protocol Resubmission Form** within **${timelineText}**.`,
            "Wait for notice of your schedule for the next full board review."
          ],
          footer: "Use the system's messaging function for clarification or to confirm your submission."
        };
      case 'exempted':
        return {
          title: "Your protocol has been **exempted from full ethics review**.",
          subtitle: "The study may proceed under the conditions stated in the attached communication.",
          instructions: [
            "Conduct your study as described in your approved submission.",
            "Submit a **Final Report (Form 14A)** within one month after completion of the study.",
            "If your study scope or method changes, inform the REC immediately for reassessment."
          ],
          footer: "Use the system messaging function if you have any clarifications."
        };
      case 'deferred':
        return {
          title: "The REC has **deferred** its decision on your protocol pending additional information or clarification.",
          subtitle: "",
          instructions: [
            "Review the attached document for the committee's specific requirements or questions.",
            `Submit the requested documents or responses through the system within **${timelineText}**.`,
            "Notify the REC Secretariat via the system messaging once your response is uploaded.",
            "The committee will deliberate again upon receipt of complete information."
          ],
          footer: "Failure to comply within the given time may delay your review process."
        };
      case 'disapproved':
        return {
          title: "Your protocol was **not approved** by the SPUP Research Ethics Committee.",
          subtitle: "Please review the attached decision letter for the reasons and recommendations provided by the committee.",
          appealNote: "You may **appeal this decision** if you believe that:\n\n* There was a misunderstanding or error in the review process, or\n* You can provide new or clarifying information relevant to the decision.",
          instructions: [
            "Accomplish **Form 16 – Protocol Appeal Application Form** (available in the system).",
            "Attach any **supporting documents** that clarify or justify your appeal.",
            "Submit your appeal within **10 working days** from the date of decision release through the system.",
            "Wait for confirmation that your appeal has been received and logged.",
            "The appeal will undergo **full board review**, and the final decision will be communicated within **10 working days** after complete documentation is received."
          ],
          footer: "Use the system's messaging function to contact the REC Secretariat or Chair if you need assistance with your appeal."
        };
      default:
        return null;
    }
  };
  
  // Handle Form 16 download for disapproved decisions
  const handleDownloadAppealForm = async () => {
    const toastId = toast.loading("Generating Form 16 Appeal Application...");
    try {
      const templateData = extractTemplateData(submission);
      const blob = await documentGenerator.generateDocument('appeal_form', templateData);
      const fileName = `Form_16_Appeal_Application_${submission.spupCode || protocolId}_${new Date().toISOString().split('T')[0]}.docx`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      
      toast.dismiss(toastId);
      toast.success("Form 16 Appeal Application downloaded successfully!");
    } catch (error) {
      console.error("Error generating appeal form:", error);
      toast.dismiss(toastId);
      toast.error("Failed to generate Appeal Form. Please try again.");
    }
  };
  
  const instructions = getDecisionInstructions(displayDecision, details.timeline);

  return (
    <Card className={cn("w-full border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden p-0", colors.bg, colors.border, className)}>
      <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 rounded-t-lg pt-6 pb-6">
        <CardTitle className={cn("text-lg font-semibold flex items-center gap-2 bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent", colors.text)}>
          <Icon className={cn("h-5 w-5 text-[#036635] dark:text-[#FECC07]", colors.text)} />
          Decision Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Header: Decision Status, Meeting Reference, Decision Date */}
        <div className="flex flex-col space-y-2 bg-white/50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Decision Status</span>
            <Badge className={colors.badge}>{decisionStatus}</Badge>
          </div>
          {isFullBoard && details.meetingReference && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Meeting Reference / Tracking ID</span>
              <span className="text-sm font-mono text-gray-900">{details.meetingReference}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Decision Date</span>
            <span className="text-sm text-gray-600">{formatDate(details.decisionDate)}</span>
          </div>
        </div>

        {/* Decision Instructions (Blockquote Style) */}
        {instructions && (
          <div className="space-y-4">
            <div className="bg-white/80 border-l-4 border-gray-300 pl-4 py-3 rounded-r-lg">
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium" dangerouslySetInnerHTML={{ 
                  __html: instructions.title.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                }} />
                {instructions.subtitle && (
                  <p>{instructions.subtitle}</p>
                )}
                {instructions.appealNote && (
                  <div className="mt-3 space-y-2">
                    <p className="font-medium" dangerouslySetInnerHTML={{ 
                      __html: instructions.appealNote.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') 
                    }} />
                  </div>
                )}
                {instructions.instructions && instructions.instructions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="font-semibold text-gray-800">Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1.5 ml-2">
                      {instructions.instructions.map((instruction, index) => (
                        <li key={index} dangerouslySetInnerHTML={{ 
                          __html: instruction.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                        }} />
                      ))}
                    </ol>
                  </div>
                )}
                {instructions.footer && (
                  <p className="mt-3 text-xs italic text-gray-600">{instructions.footer}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form 16 Download Button for Disapproved */}
        {displayDecision === 'disapproved' && userRole === 'proponent' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 mb-1">Appeal This Decision</p>
                <p className="text-xs text-red-700">Download Form 16 to file an appeal within 10 working days.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAppealForm}
                disabled={!submission}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Download className="h-4 w-4 mr-1" />
                Download Form 16
              </Button>
            </div>
          </div>
        )}

        {/* Decision Documents */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Decision Documents</h4>
            <div className="space-y-2">
              {documents.map((document, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{document.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {document.fileSize ? `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDocumentDownload(document)}
                    disabled={!document.downloadUrl}
                    className="h-8"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Role-specific actions */}
        {userRole === 'chairperson' && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleEditDecision}>
                <Edit className="h-4 w-4 mr-1" />
                Edit Decision
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => router.push(`/rec/chairperson/protocol/${protocolId}/generate-documents`)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Generate Documents
              </Button>
            </div>
          </div>
        )}

        {/* Edit Decision Dialog */}
        {userRole === 'chairperson' && submission && (
          <DecisionDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            submission={submission}
            onStatusUpdate={handleDecisionUpdated}
          />
        )}

        {/* Optional Footer Note */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic">
            This decision card summarizes the outcome of the REC review. For full details, refer to the attached decision letter and supporting documents.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
