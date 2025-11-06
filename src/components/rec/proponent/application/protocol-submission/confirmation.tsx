"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  FileText,
  Users,
  Info,
} from "lucide-react";
import { useSubmissionContext } from "@/contexts/SubmissionContext";

export default function SubmissionConfirmation() {
  const {
    formData,
    documents,
    submissionError,
    getSubmissionSummary,
  } = useSubmissionContext();

  const [isChecked, setIsChecked] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmationValid = confirmationText.toUpperCase().trim() === "CONFIRM";

  const summary = getSubmissionSummary();

  // Expose confirmation state to parent component
  React.useEffect(() => {
    // Store confirmation state in a way that parent can access
    const confirmationState = {
      isChecked,
      isConfirmationValid,
      canSubmit: isChecked && isConfirmationValid
    };
    
    // Store in sessionStorage for parent to access
    sessionStorage.setItem('confirmationState', JSON.stringify(confirmationState));
  }, [isChecked, isConfirmationValid]);

  return (
    <div className="w-full  space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Review & Confirm Submission
        </h2>
        <p className="text-muted-foreground">
          Please review all information and documents before submitting your application.
        </p>
      </div>

      

      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            General Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Protocol Title
              </div>
              <div className="text-base">
                {formData.general_information?.protocol_title || "Not specified"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Principal Investigator
                </div>
                <div className="text-base">
                  {formData.general_information?.principal_investigator?.name || "Not specified"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Position & Institution
                </div>
                <div className="text-base">
                  {formData.general_information?.principal_investigator?.position_institution || "Not specified"}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Co-Researchers
              </div>
              <div className="text-base">
                {formData.general_information?.co_researchers &&
                formData.general_information.co_researchers.length > 0
                  ? formData.general_information.co_researchers.join(", ")
                  : "None specified"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Study Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Study Level
              </div>
              <div className="text-base">
                {formData.nature_and_type_of_study?.level || "Not specified"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Study Type
              </div>
              <div className="text-base">
                {formData.nature_and_type_of_study?.type || "Not specified"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Number of Participants
              </div>
              <div className="text-base">
                {formData.participants?.number_of_participants || "Not specified"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Participant Type
              </div>
              <div className="text-base">
                {formData.participants?.type_and_description || "Not specified"}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Study Duration
            </div>
            <div className="text-base">
              {formData.duration_of_study?.start_date &&
              formData.duration_of_study?.end_date
                ? `${formData.duration_of_study.start_date} to ${formData.duration_of_study.end_date}`
                : "Not specified"}
            </div>
          </div>
          {formData.brief_description_of_study && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Study Description
              </div>
              <div className="text-base">
                {formData.brief_description_of_study}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Uploaded Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {doc.category} • {doc.status}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {doc.originalFileName || `Document ${index + 1}`}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-muted-foreground">
                No documents uploaded. While documents are not required, they may be helpful for the review process.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation */}
      <Alert>
            <AlertDescription className="space-y-4">
              <p>
              By submitting this application, I affirm that all information provided is true, accurate, and complete to the best of my knowledge. I further confirm that all required documents have been reviewed and duly endorsed by my Adviser, and that I take full responsibility for the authenticity and integrity of all submissions to the St. Paul University Philippines Research Ethics Committee (SPUP REC).
              </p>

              {/* Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms-checkbox"
                  checked={isChecked}
                  onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                />
                <Label htmlFor="terms-checkbox" className="text-sm font-medium">
                I hereby affirm the statement above.
                </Label>
              </div>

              {/* Confirmation Input - Only show when checkbox is checked */}
              {isChecked && (
                <div className=" flex flex-row">
                  <Label htmlFor="confirm" className="text-sm font-medium w-100">
                    To proceed, please type CONFIRM
                  </Label>
                  <Input
                    id="confirm"
                    value={confirmationText}
                    autoComplete="off"
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type here..."
                    className={`w-full ${
                      !isConfirmationValid && confirmationText.length > 0
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                  />

                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {submissionError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {submissionError}
              </AlertDescription>
            </Alert>
          )}
    </div>
  );
}