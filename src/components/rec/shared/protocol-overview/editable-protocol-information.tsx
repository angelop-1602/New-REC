"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit2, Save, X } from "lucide-react";
import { InformationType } from "@/types";
import { updateSubmission } from "@/lib/firebase/firestore";
import { customToast } from "@/components/ui/custom/toast";
import { SubmissionInformation } from "@/components/rec/proponent/application/protocol-submission/information";
import { SubmissionProvider } from "@/contexts/SubmissionContext";
import { normalizeFormData } from "@/lib/utils/normalizeFormData";

interface EditableProtocolInformationProps {
  information: InformationType;
  protocolId: string;
  onSave?: (updatedInformation: InformationType) => void;
}

export function EditableProtocolInformation({
  information,
  protocolId,
  onSave,
}: EditableProtocolInformationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedInformation, setEditedInformation] = useState<InformationType>(information);

  // Sync with prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditedInformation(information);
    }
  }, [information, isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedInformation(information);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedInformation(information);
  };

  const handleSave = async () => {
    if (!protocolId) {
      customToast.error("Error", "Protocol ID is required");
      return;
    }

    setIsSaving(true);
    try {
      // Normalize the data
      const normalizedInformation = normalizeFormData(editedInformation);
      
      // Update submission
      await updateSubmission(protocolId, normalizedInformation);
      
      setIsEditing(false);
      customToast.success("Success", "Protocol information updated successfully");
      
      if (onSave) {
        onSave(normalizedInformation);
      }
    } catch (error) {
      console.error("Error updating protocol information:", error);
      customToast.error("Error", "Failed to update protocol information. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden p-0">
      <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 rounded-t-lg pt-6 pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#036635] dark:text-[#FECC07]" />
            <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
              Protocol Information
            </span>
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        {isEditing ? (
          <SubmissionProvider>
            <EditableFormContent
              initialInformation={editedInformation}
              onInformationChange={setEditedInformation}
            />
          </SubmissionProvider>
        ) : (
          <ReadOnlyView information={information} />
        )}
      </CardContent>
    </Card>
  );
}

// Component to handle form editing with SubmissionContext
function EditableFormContent({
  initialInformation,
  onInformationChange,
}: {
  initialInformation: InformationType;
  onInformationChange: (info: InformationType) => void;
}) {
  const { formData, updateField } = require("@/contexts/SubmissionContext").useSubmissionContext();

  // Sync formData with initialInformation
  useEffect(() => {
    if (formData && JSON.stringify(formData) !== JSON.stringify(initialInformation)) {
      // Update all fields from initialInformation
      Object.keys(initialInformation).forEach((key) => {
        const value = (initialInformation as Record<string, unknown>)[key];
        if (value !== undefined) {
          updateField(key, value);
        }
      });
    }
  }, [initialInformation]);

  // Notify parent of changes
  useEffect(() => {
    if (formData) {
      onInformationChange(formData);
    }
  }, [formData, onInformationChange]);

  return <SubmissionInformation />;
}

// Read-only view component
function ReadOnlyView({ information }: { information: InformationType }) {
  const { GeneralInformationSection } = require("./general-information-section");
  const { StudyDetailsSection } = require("./study-details-section");
  const { DurationParticipantsSection } = require("./duration-participants-section");

  return (
    <>
      <GeneralInformationSection
        information={information}
        isReviewer={false}
        userType="proponent"
      />
      
      <StudyDetailsSection
        information={information}
        isReviewer={false}
        isOpen={true}
        onOpenChange={() => {}}
      />

      <DurationParticipantsSection
        information={information}
        isReviewer={false}
        isOpen={true}
        onOpenChange={() => {}}
      />

      {information.brief_description_of_study && (
        <div className="space-y-2 pt-4 border-t">
          <h3 className="font-semibold text-sm text-[#036635] dark:text-[#FECC07]">
            Brief Description of Study
          </h3>
          <p className="text-sm text-muted-foreground">{information.brief_description_of_study}</p>
        </div>
      )}
    </>
  );
}

