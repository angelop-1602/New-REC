"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { CheckCircle, Upload, X } from "lucide-react";
import { makeProtocolDecision } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  toChairpersonProtocol
} from '@/types';
import { InlineLoading } from "@/components/ui/loading";

interface DecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Record<string, unknown>;
  onStatusUpdate: (status: string) => void;
}

export function DecisionDialog({ 
  open, 
  onOpenChange, 
  submission, 
  onStatusUpdate 
}: DecisionDialogProps) {
  const { user } = useAuth();
  
  // Convert to typed protocol at the top
  const typedSubmission = toChairpersonProtocol(submission);
  
  const [decision, setDecision] = useState<'approved' | 'approved_minor_revisions' | 'major_revisions_deferred' | 'disapproved' | 'deferred'>('approved');
  const [timeline, setTimeline] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File>>({}); // Map document name to file
  const [isProcessing, setIsProcessing] = useState(false);
  const [meetingMonth, setMeetingMonth] = useState<string>("");
  const [meetingYear, setMeetingYear] = useState<string>("");
  
  // Check if this is a full board review
  const typeOfReview = typedSubmission.information?.reviewType || typedSubmission.researchType || '';
  const isFullBoard = String(typeOfReview).toLowerCase() === 'full' || String(typeOfReview).toLowerCase() === 'full board';
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Reset to default values when dialog opens
      setDecision('approved');
      setTimeline("");
      setUploadedDocuments({});
      setMeetingMonth("");
      setMeetingYear("");
    }
  }, [open]);

  const handleMakeDecision = async () => {
    if ((decision === 'approved_minor_revisions' || decision === 'major_revisions_deferred' || decision === 'deferred') && !timeline.trim()) {
      const timelineLabel = decision === 'deferred' ? 'deferral' : 'revisions';
      toast.error(`Please specify timeline for ${timelineLabel}`);
      return;
    }

    // Validate meeting reference for full board decisions (required for all full board decisions)
    if (isFullBoard && (!meetingMonth || !meetingYear)) {
      toast.error("Please specify meeting month and year for full board review. Meeting reference is required for all full board decisions.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to make decisions");
      return;
    }

    setIsProcessing(true);
    try {
      // Convert uploaded documents map to array for makeProtocolDecision
      const documentsArray = Object.values(uploadedDocuments);
      
      // Make the decision in Firebase
      await makeProtocolDecision(
        String(typedSubmission.id),
        decision,
        "",
        user.uid,
        timeline || undefined,
        documentsArray.length > 0 ? documentsArray : undefined,
        isFullBoard && meetingMonth ? parseInt(meetingMonth, 10) : undefined,
        isFullBoard && meetingYear ? parseInt(meetingYear, 10) : undefined
      );
      
      // Match decision text with decision card status labels
      const decisionText = {
        'approved': 'Approved',
        'approved_minor_revisions': 'Minor Modification Required',
        'major_revisions_deferred': 'Major Modification Required',
        'disapproved': 'Disapproved',
        'deferred': 'Deferred'
      }[decision];
      
      toast.success(`Protocol ${decisionText} successfully`);
      
      onStatusUpdate(decision === 'approved' ? 'approved' : 'accepted');
      onOpenChange(false);
      
      // Reset form
      setDecision('approved');
      setTimeline("");
      setUploadedDocuments({});
      setMeetingMonth("");
      setMeetingYear("");
    } catch (error) {
      console.error("Error making decision:", error);
      toast.error("Failed to make decision. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (documentName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedDocuments(prev => ({
        ...prev,
        [documentName]: file
      }));
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const removeFile = (documentName: string) => {
    setUploadedDocuments(prev => {
      const updated = { ...prev };
      delete updated[documentName];
      return updated;
    });
  };

  const getDecisionDescription = (decisionType: string) => {
    switch (decisionType) {
      case 'approved':
        return 'The research may proceed as submitted. The protocol has been approved by the SPUP Research Ethics Committee.';
      case 'approved_minor_revisions':
        return 'Your protocol requires minor revisions based on the reviewers\' comments. Please refer to the attached documents for specific recommendations.';
      case 'major_revisions_deferred':
        return 'Your protocol requires major revisions before approval can be considered. The revised version will undergo a full board review upon resubmission.';
      case 'deferred':
        return 'The REC has deferred its decision on your protocol pending additional information or clarification. Submission is incomplete or resubmission does not meet requirements.';
      case 'disapproved':
        return 'Your protocol was not approved by the SPUP Research Ethics Committee. Please review the attached decision letter for the reasons and recommendations provided by the committee.';
      default:
        return '';
    }
  };

  const getRequiredDocuments = (decisionType: string) => {
    // Check if this is an exemption protocol
    const info = submission?.information as Record<string, unknown> | undefined;
    const researchType = submission?.researchType ||
      (info?.nature_and_type_of_study as { type?: string } | undefined)?.type || '';
    const isExemption = researchType === 'EX' || researchType?.toString().toUpperCase() === 'EX' || 
                        researchType?.toString().toLowerCase().includes('exempt');

    switch (decisionType) {
      case 'approved':
        if (isExemption) {
          return [
            { name: 'Form 04B - Certificate of Exemption from Review', required: true, description: 'Official certificate for exemption from ethics review' },
            { name: 'Form 08B - Notification of SPUP REC Decision', required: true, description: 'Decision notification letter' }
          ];
        } else {
          return [
            { name: 'Form 08C - Certificate of Approval', required: true, description: 'Official approval certificate (Full Board or Expedited)' },
            { name: 'Form 08B - Notification of SPUP REC Decision', required: true, description: 'Decision notification letter' }
          ];
        }
      case 'approved_minor_revisions':
        return [
          { name: 'Form 08B - Notification of SPUP REC Decision', required: true, description: 'Decision letter with detailed reviewer comments and required revisions' },
          { name: 'Form 08A - Protocol Resubmission Form', required: false, description: 'Form for proponents to use when resubmitting (optional - can be generated separately)' }
        ];
      case 'major_revisions_deferred':
        return [
          { name: 'Form 08B - Notification of SPUP REC Decision', required: true, description: 'Decision letter with detailed feedback and major concerns' },
          { name: 'Form 08A - Protocol Resubmission Form', required: false, description: 'Form for proponents to use when resubmitting (optional - can be generated separately)' }
        ];
      case 'deferred':
        return [
          { name: 'Form 08B - Notification of SPUP REC Decision', required: true, description: 'Decision letter outlining specific requirements, questions, or additional information needed' }
        ];
      case 'disapproved':
        return [
          { name: 'Form 08B - Notification of SPUP REC Decision', required: true, description: 'Decision letter explaining reasons for disapproval and recommendations' }
        ];
      default:
        return [];
    }
  };

  return (
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl border-[#036635]/20 dark:border-[#FECC07]/30 animate-in fade-in zoom-in-95 duration-300">
    <DialogHeader>
      <DialogTitle className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Make Protocol Decision</DialogTitle>
      <DialogDescription>
        Make a final decision on this protocol after review
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Decision Type Selection */}
      <div>
        <Label className="text-gray-800">Decision Type</Label>
        <RadioGroup value={decision} onValueChange={(value) => setDecision(value as typeof decision)}>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 border border-[#036635]/10 dark:border-[#FECC07]/20 rounded-lg hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200">
              <RadioGroupItem value="approved" id="approved" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="approved" className="font-medium cursor-pointer text-green-600">
                  Approved
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  {getDecisionDescription("approved")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border border-[#036635]/10 dark:border-[#FECC07]/20 rounded-lg hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200">
              <RadioGroupItem value="approved_minor_revisions" id="minor" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="minor" className="font-medium cursor-pointer text-blue-600">
                  Minor Modification Required
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  {getDecisionDescription("approved_minor_revisions")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border border-[#036635]/10 dark:border-[#FECC07]/20 rounded-lg hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200">
              <RadioGroupItem value="major_revisions_deferred" id="major" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="major" className="font-medium cursor-pointer text-yellow-600">
                  Major Modification Required
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  {getDecisionDescription("major_revisions_deferred")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border border-[#036635]/10 dark:border-[#FECC07]/20 rounded-lg hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200">
              <RadioGroupItem value="deferred" id="deferred" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="deferred" className="font-medium cursor-pointer text-cyan-600">
                  Deferred
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Submission is incomplete or resubmission does not meet requirements. Additional information needed.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border border-[#036635]/10 dark:border-[#FECC07]/20 rounded-lg hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200">
              <RadioGroupItem value="disapproved" id="disapproved" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="disapproved" className="font-medium cursor-pointer text-red-600">
                  Disapproved
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  {getDecisionDescription("disapproved")}
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Timeline (for revisions and deferred) */}
      {(decision === "approved_minor_revisions" || decision === "major_revisions_deferred" || decision === "deferred") && (
        <div>
          <Label htmlFor="timeline" className="text-gray-800">
            Timeline for Compliance <span className="text-red-500">*</span>
          </Label>
          <Select value={timeline} onValueChange={setTimeline} required>
            <SelectTrigger className="bg-white border-gray-200">
              <SelectValue placeholder="Select compliance timeline" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {decision === "approved_minor_revisions" ? (
                <>
                  <SelectItem value="14 days">14 days (Default - Per SOP)</SelectItem>
                  <SelectItem value="3 days">3 days</SelectItem>
                  <SelectItem value="5 days">5 days</SelectItem>
                  <SelectItem value="7 days">7 days</SelectItem>
                  <SelectItem value="10 days">10 days</SelectItem>
                </>
              ) : decision === "major_revisions_deferred" ? (
                <>
                  <SelectItem value="14 days">14 days (Default - Per SOP)</SelectItem>
                  <SelectItem value="7 days">7 days</SelectItem>
                  <SelectItem value="10 days">10 days</SelectItem>
                  <SelectItem value="21 days">21 days</SelectItem>
                  <SelectItem value="30 days">30 days</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="7 days">7 days (Default - Per SOP)</SelectItem>
                  <SelectItem value="5 days">5 days</SelectItem>
                  <SelectItem value="10 days">10 days</SelectItem>
                  <SelectItem value="14 days">14 days</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            {decision === "approved_minor_revisions" && "Resubmission required within the selected timeline. Failure to resubmit may result in withdrawal of application."}
            {decision === "major_revisions_deferred" && "Resubmission required within the selected timeline. The revised protocol will undergo full board review."}
            {decision === "deferred" && "Additional information or documents must be submitted within the selected timeline. Failure to comply may delay the review process."}
          </p>
        </div>
      )}

      {/* Meeting Reference (for full board only - required for all decisions) */}
      {isFullBoard && (
        <div className="space-y-2">
          <Label className="text-gray-800">
            Meeting Reference / Tracking ID <span className="text-red-500">*</span>
            <span className="text-sm font-normal text-gray-600 ml-2">(Full Board Only)</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="meeting-month" className="text-sm text-gray-600">
                Month <span className="text-red-500">*</span>
              </Label>
              <Select value={meetingMonth} onValueChange={setMeetingMonth} required>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    const monthName = new Date(2024, i, 1).toLocaleString('default', { month: 'long' });
                    return (
                      <SelectItem key={month} value={month.toString()}>
                        {month.toString().padStart(2, '0')} - {monthName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="meeting-year" className="text-sm text-gray-600">
                Year <span className="text-red-500">*</span>
              </Label>
              <Select value={meetingYear} onValueChange={setMeetingYear} required>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 1 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Sequential number will be auto-generated based on existing decisions for this month-year (e.g., 001-03-2025, 002-03-2025)
          </p>
        </div>
      )}



      {/* Required Documents Information with Individual Upload Buttons */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Label className="text-gray-800 font-semibold mb-3 block">
          Required Documents for This Decision
        </Label>
        <div className="space-y-3">
          {getRequiredDocuments(decision).map((doc, index) => {
            const file = uploadedDocuments[doc.name];
            const uploadId = `upload-${doc.name.replace(/\s+/g, '-').toLowerCase()}`;
            
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <span className={doc.required ? "text-red-500 font-bold mt-0.5" : "text-gray-400 mt-0.5"}>
                        {doc.required ? "•" : "○"}
                      </span>
                      <div className="flex-1">
                        <span className={doc.required ? "font-medium text-gray-900" : "text-gray-700"}>
                          {doc.name}
                        </span>
                        {doc.required && (
                          <span className="text-red-500 text-xs ml-1">(Required)</span>
                        )}
                        <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                        {file && (
                          <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-green-700 font-medium">{file.name}</span>
                            <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(doc.name)}
                              className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 ml-auto"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(doc.name, e)}
                      className="hidden"
                      id={uploadId}
                      disabled={isProcessing}
                    />
                    <label htmlFor={uploadId}>
                      <Button
                        type="button"
                        variant={file ? "outline" : "default"}
                        size="sm"
                        className={file ? "border-green-300 text-green-700 hover:bg-green-50" : ""}
                        disabled={isProcessing}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-1.5" />
                          {file ? "Replace" : "Upload"}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => {
          onOpenChange(false);
          setTimeline("");
          setUploadedDocuments({});
          setMeetingMonth("");
          setMeetingYear("");
        }}
        disabled={isProcessing}
        className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300"
      >
        Cancel
      </Button>

      <Button
        onClick={handleMakeDecision}
        disabled={isProcessing}
        className={
          decision === "approved"
            ? "bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
            : decision === "approved_minor_revisions"
            ? "bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
            : decision === "major_revisions_deferred"
            ? "bg-[#FECC07] hover:bg-[#E6B800] dark:bg-[#036635] dark:hover:bg-[#024A28] text-black dark:text-white transition-all duration-300 hover:scale-105"
            : decision === "deferred"
            ? "bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
            : "bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:scale-105"
        }
      >
        {isProcessing ? (
          <>
            <InlineLoading size="sm" />
            <span className="ml-2">Processing...</span>
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirm Decision
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

  );
}
