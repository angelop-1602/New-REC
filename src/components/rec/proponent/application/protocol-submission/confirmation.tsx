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
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  UserCheck,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useSubmissionContext } from "@/contexts/SubmissionContext";
import { getFileReferenceSync } from "@/lib/utils/fileReferenceManager";

export default function SubmissionConfirmation() {
  const {
    formData,
    documents,
    submissionError,
  } = useSubmissionContext();

  const [isChecked, setIsChecked] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmationValid = confirmationText.toUpperCase().trim() === "CONFIRM";

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
    <div className="w-full space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Header */}
      <div className="text-center space-y-2 px-2">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Review & Confirm Submission
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
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
            {/* Protocol Title */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Protocol Title
              </div>
              <div className="text-base font-semibold">
                {formData.general_information?.protocol_title || "Not specified"}
              </div>
            </div>

            {/* Principal Investigator Details */}
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-muted-foreground mb-3">
                Principal Investigator
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Name
                  </div>
                  <div className="text-base">
                    {formData.general_information?.principal_investigator?.name || "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </div>
                  <div className="text-base">
                    {formData.general_information?.principal_investigator?.email || "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Contact Number
                  </div>
                  <div className="text-base">
                    {formData.general_information?.principal_investigator?.contact_number || "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Address
                  </div>
                  <div className="text-base">
                    {formData.general_information?.principal_investigator?.address || "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Position & Institution
                  </div>
                  <div className="text-base">
                    {formData.general_information?.principal_investigator?.position_institution || "Not specified"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    Course/Program
                  </div>
                  <div className="text-base font-mono">
                    {formData.general_information?.principal_investigator?.course_program 
                      ? formData.general_information.principal_investigator.course_program.toUpperCase()
                      : "Not specified"}
                  </div>
                </div>
              </div>
            </div>

            {/* Adviser */}
            <div className="border-t pt-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Research Adviser
              </div>
              <div className="text-base">
                {formData.general_information?.adviser?.name || "Not specified"}
              </div>
            </div>

            {/* Co-Researchers */}
            <div className="border-t pt-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Co-Researchers
              </div>
              <div className="text-base">
                {formData.general_information?.co_researchers &&
                formData.general_information.co_researchers.length > 0
                  ? formData.general_information.co_researchers
                      .map((r) => r.name)
                      .filter(Boolean)
                      .join(", ")
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Study Level */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Study Level
              </div>
              <div className="text-base">
                {formData.nature_and_type_of_study?.level || "Not specified"}
              </div>
            </div>
            
            {/* Study Type */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Study Type
              </div>
              <div className="text-base">
                {formData.nature_and_type_of_study?.type || "Not specified"}
              </div>
            </div>

            {/* Study Site */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Study Site
              </div>
              <div className="text-base">
                {formData.study_site?.location === "within"
                  ? "Within University"
                  : formData.study_site?.location === "outside"
                  ? formData.study_site?.outside_specify || "Outside University (Not specified)"
                  : "Not specified"}
              </div>
            </div>

            {/* Source of Funding */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Source of Funding
              </div>
              <div className="text-base">
                {(() => {
                  const funding = formData.source_of_funding?.selected;
                  if (!funding) return "Not specified";
                  
                  const fundingLabels: Record<string, string> = {
                    self_funded: "Self-funded",
                    institution_funded: "Institution Funded",
                    government_funded: "Government Funded",
                    scholarship: "Scholarship",
                    research_grant: "Research Grant",
                    pharmaceutical_company: `Pharmaceutical Company${formData.source_of_funding?.pharmaceutical_company_specify ? `: ${formData.source_of_funding.pharmaceutical_company_specify}` : ""}`,
                    others: formData.source_of_funding?.others_specify || "Others",
                  };
                  
                  return fundingLabels[funding] || funding;
                })()}
              </div>
            </div>

            {/* Number of Participants */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Number of Participants
              </div>
              <div className="text-base">
                {formData.participants?.number_of_participants ?? "Not specified"}
              </div>
            </div>

            {/* Participant Type */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Participant Type & Description
              </div>
              <div className="text-base">
                {formData.participants?.type_and_description || "Not specified"}
              </div>
            </div>
          </div>

          {/* Study Duration */}
          <div className="border-t pt-4">
            <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Study Duration
            </div>
            <div className="text-base">
              {formData.duration_of_study?.start_date &&
              formData.duration_of_study?.end_date
                ? `${formData.duration_of_study.start_date} to ${formData.duration_of_study.end_date}`
                : "Not specified"}
            </div>
          </div>

          {/* Brief Description */}
          {formData.brief_description_of_study && (
            <div className="border-t pt-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Brief Description of Study
              </div>
              <div className="text-base whitespace-pre-wrap">
                {formData.brief_description_of_study}
              </div>
            </div>
          )}

          {/* Technical Review Status */}
          {(formData.technical_review_completed !== null || formData.submitted_to_other_committee !== null) && (
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-muted-foreground mb-2">
                Pre-Submission Status
              </div>
              <div className="space-y-2">
                {formData.technical_review_completed !== null && (
                  <div className="flex items-center gap-2">
                    {formData.technical_review_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm">
                      Technical Review Completed: {formData.technical_review_completed ? "Yes" : "No"}
                    </span>
                  </div>
                )}
                {formData.submitted_to_other_committee !== null && (
                  <div className="flex items-center gap-2">
                    {formData.submitted_to_other_committee ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm">
                      Submitted to Other Committee: {formData.submitted_to_other_committee ? "Yes" : "No"}
                    </span>
                  </div>
                )}
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
              {documents.map((doc, index) => {
                // Check if file reference exists (sync check for display)
                const hasFileRef = doc._fileRef instanceof File || getFileReferenceSync(doc.id) !== undefined;
                const fileRef = doc._fileRef instanceof File ? doc._fileRef : getFileReferenceSync(doc.id);
                const fileSize = fileRef ? (fileRef.size / 1024 / 1024).toFixed(2) + " MB" : "Unknown";
                const fileType = fileRef ? fileRef.type : doc.fileType || "Unknown";
                
                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-lg border ${
                      hasFileRef 
                        ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
                        : "bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 flex-1 w-full sm:w-auto">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          hasFileRef 
                            ? "bg-green-100 dark:bg-green-900/30" 
                            : "bg-yellow-100 dark:bg-yellow-900/30"
                        }`}>
                          {hasFileRef ? (
                            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-base mb-1">{doc.title}</div>
                          {doc.description && (
                            <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {doc.description}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs capitalize">
                              {doc.category || "Unknown"}
                            </Badge>
                            <Badge 
                              variant={doc.status === "pending" ? "secondary" : "default"}
                              className="text-xs capitalize"
                            >
                              {doc.status || "Unknown"}
                            </Badge>
                            {doc.originalFileName && (
                              <span className="truncate max-w-[150px] sm:max-w-[200px]" title={doc.originalFileName}>
                                📄 {doc.originalFileName}
                              </span>
                            )}
                            {fileSize !== "Unknown" && (
                              <span className="whitespace-nowrap">📊 {fileSize}</span>
                            )}
                            {fileType !== "Unknown" && (
                              <span className="truncate max-w-[100px] sm:max-w-[150px]" title={fileType}>
                                {fileType.split("/")[1]?.toUpperCase() || fileType}
                              </span>
                            )}
                            {doc.uploadedAt && (
                              <span className="whitespace-nowrap">
                                📅 {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                        {hasFileRef ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 w-full sm:w-auto justify-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700 w-full sm:w-auto justify-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Re-upload
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!hasFileRef && (
                      <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            This document's file reference was lost. Please go back to the Documents step and re-upload this file before submitting.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
                  <Label htmlFor="confirm" className="text-sm font-medium sm:w-auto w-full">
                    To proceed, please type CONFIRM
                  </Label>
                  <Input
                    id="confirm"
                    value={confirmationText}
                    autoComplete="off"
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="CONFIRM"
                    className={`w-full sm:flex-1 ${
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