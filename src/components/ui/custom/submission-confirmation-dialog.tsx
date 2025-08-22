"use client";

import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Progress from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Users, 
  Calendar,
  XCircle,
  Info
} from "lucide-react";
import { InformationType } from "@/types/information.types";
import { DocumentsType } from "@/types/documents.types";
import { LoadingSpinner, LoadingBar } from "@/components/ui/loading";

export interface SubmissionSummary {
  formData: InformationType;
  documents: DocumentsType[];
  totalFields: number;
  completedFields: number;
  requiredDocuments: number;
  uploadedDocuments: number;
}

export interface SubmissionConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submissionError: string | null;
  submissionSuccess: boolean;
  submissionId?: string;
  summary: SubmissionSummary;
}

export const SubmissionConfirmationDialog: React.FC<SubmissionConfirmationDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  isSubmitting,
  submissionError,
  submissionSuccess,
  submissionId,
  summary,
}) => {
  const { formData, documents, totalFields, completedFields, requiredDocuments, uploadedDocuments } = summary;

  // Calculate completion percentages
  const formCompletionPercentage = (completedFields / totalFields) * 100;
  const documentsCompletionPercentage = requiredDocuments > 0 ? (uploadedDocuments / requiredDocuments) * 100 : 100;

  // Determine if ready to submit
  const isReadyToSubmit = formCompletionPercentage === 100 && documentsCompletionPercentage >= 80; // Allow 80% for optional docs

  // Get dialog content based on current state
  const getDialogContent = () => {
    if (submissionSuccess) {
      return (
        <>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-green-800">Submission Successful!</DialogTitle>
                <DialogDescription className="text-green-600">
                  Your research protocol has been submitted for ethics review.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Submission ID:</strong> {submissionId}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Next Steps:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You will receive an email confirmation shortly</li>
                <li>• The REC will review your submission within 7-14 business days</li>
                <li>• You can track the status in your dashboard</li>
                <li>• You will be notified of any requests for additional information</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => {
              onOpenChange(false);
              // Navigate to dashboard or submissions page
              window.location.href = "/rec/proponent/dashboard";
            }} className="w-full">
              Go to Dashboard
            </Button>
          </DialogFooter>
        </>
      );
    }

    if (submissionError) {
      return (
        <>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-red-800">Submission Failed</DialogTitle>
                <DialogDescription className="text-red-600">
                  There was an error submitting your application.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {submissionError}
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
          </DialogFooter>
        </>
      );
    }

    if (isSubmitting) {
      return (
        <>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                <LoadingSpinner size="md" showText={false} />
              </div>
              <div>
                <DialogTitle>Submitting Application...</DialogTitle>
                <DialogDescription>
                  Please wait while we process your submission.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading documents...</span>
                <span>Processing...</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please do not close this window while your submission is being processed.
              </AlertDescription>
            </Alert>
          </div>
        </>
      );
    }

    // Default confirmation state
    return (
      <>
        <DialogHeader>
          <DialogTitle>Review & Submit Research Protocol Application</DialogTitle>
          <DialogDescription>
            Please review all information and documents before submitting. Once submitted, you will not be able to edit your application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {/* General Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              General Information
            </h4>
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Protocol Title</div>
                  <div className="text-sm">{formData.general_information?.protocol_title || "Not specified"}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Principal Investigator</div>
                    <div className="text-sm">{formData.general_information?.principal_investigator?.name || "Not specified"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Institution</div>
                    <div className="text-sm">{formData.general_information?.principal_investigator?.position_institution || "Not specified"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Co-Researchers</div>
                  <div className="text-sm">
                    {formData.general_information?.co_researchers && formData.general_information.co_researchers.length > 0 
                      ? formData.general_information.co_researchers.join(", ")
                      : "None specified"
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Study Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Study Details
            </h4>
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Study Level</div>
                  <div className="text-sm">{formData.nature_and_type_of_study?.level || "Not specified"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Study Type</div>
                  <div className="text-sm">{formData.nature_and_type_of_study?.type || "Not specified"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Number of Participants</div>
                  <div className="text-sm">{formData.participants?.number_of_participants || "Not specified"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Participant Type</div>
                  <div className="text-sm">
                    {formData.participants?.type_and_description || "Not specified"}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Study Duration</div>
                <div className="text-sm">
                  {formData.duration_of_study?.start_date && formData.duration_of_study?.end_date
                    ? `${formData.duration_of_study.start_date} to ${formData.duration_of_study.end_date}`
                    : "Not specified"
                  }
                </div>
              </div>
              {formData.brief_description_of_study && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Study Description</div>
                  <div className="text-sm">{formData.brief_description_of_study}</div>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Uploaded Documents ({documents.length})
            </h4>
            {documents.length > 0 ? (
              <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                {documents.map((doc, index) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{doc.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {doc.category} • {doc.status}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {doc.originalFileName || `Document ${index + 1}`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground text-center">
                  No documents uploaded. While documents are not required, they may be helpful for the review process.
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          {formData.brief_description_of_study && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Study Summary
              </h4>
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="text-sm">{formData.brief_description_of_study}</div>
              </div>
            </div>
          )}

          {/* Confirmation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              By submitting this application, you confirm that all information provided is accurate 
              and complete to the best of your knowledge. Your application will be reviewed by the Research Ethics Committee.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700"
          >
            Submit Application
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        {getDialogContent()}
      </DialogContent>
    </Dialog>
  );
}; 