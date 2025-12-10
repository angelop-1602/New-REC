"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Save, X } from "lucide-react";
import { InformationType } from "@/types";
import { updateSubmission } from "@/lib/firebase/firestore";
import { customToast } from "@/components/ui/custom/toast";

interface GeneralInformationSectionProps {
  information: InformationType;
  isReviewer?: boolean;
  userType?: "proponent" | "reviewer" | "chairperson";
  protocolId?: string;
}

export function GeneralInformationSection({
  information,
  isReviewer = false,
  userType = "proponent",
  protocolId,
}: GeneralInformationSectionProps) {
  const [orNumber, setOrNumber] = useState(information.or_number || "");
  const [isEditingOrNumber, setIsEditingOrNumber] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isChairperson = userType === "chairperson";

  // Sync orNumber state when information prop changes (for real-time updates)
  useEffect(() => {
    if (!isEditingOrNumber) {
      setOrNumber(information.or_number || "");
    }
  }, [information.or_number, isEditingOrNumber]);

  const handleSaveOrNumber = async () => {
    if (!protocolId) {
      customToast.error("Error", "Protocol ID is required");
      return;
    }

    setIsSaving(true);
    try {
      const updatedInformation: InformationType = {
        ...information,
        or_number: orNumber.trim() || undefined,
      };

      await updateSubmission(protocolId, updatedInformation);
      setIsEditingOrNumber(false);
      customToast.success("Success", "OR Number updated successfully");
    } catch (error) {
      console.error("Error updating OR Number:", error);
      customToast.error("Error", "Failed to update OR Number. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setOrNumber(information.or_number || "");
    setIsEditingOrNumber(false);
  };
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-[#036635] dark:text-[#FECC07] flex items-center gap-2">
        <User className="h-4 w-4" />
        General Information
      </h3>
      <div className={`grid ${isReviewer ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3 text-sm`}>
        <div>
          <p className="text-muted-foreground">Principal Investigator</p>
          <p className="font-medium">{information.general_information.principal_investigator.name}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Email</p>
          <p className="font-medium">{information.general_information.principal_investigator.email}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Contact Number</p>
          <p className="font-medium">{information.general_information.principal_investigator.contact_number}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Position & Institution</p>
          <p className="font-medium">
            {information.general_information.principal_investigator.position_institution || ''}
          </p>
        </div>
        {information.general_information.principal_investigator.course_program && (
          <div>
            <p className="text-muted-foreground">Course/Program</p>
            <p className="font-medium">{information.general_information.principal_investigator.course_program.toUpperCase()}</p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground">Address</p>
          <p className="font-medium">{information.general_information.principal_investigator.address}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Adviser</p>
          <p className="font-medium">{information.general_information.adviser.name}</p>
        </div>
        
        {/* OR Number - Editable for Chairperson */}
        {isChairperson && (
          <div className="md:col-span-2">
            <p className="text-muted-foreground mb-2">OR Number</p>
            {isEditingOrNumber ? (
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  value={orNumber}
                  onChange={(e) => setOrNumber(e.target.value)}
                  placeholder="Enter OR Number"
                  className="flex-1"
                  disabled={isSaving}
                />
                <Button
                  size="sm"
                  onClick={handleSaveOrNumber}
                  disabled={isSaving}
                  className="shrink-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-medium flex-1">
                  {information.or_number ? (
                    information.or_number
                  ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingOrNumber(true)}
                  className="shrink-0"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* OR Number - Read-only for non-chairperson */}
        {!isChairperson && information.or_number && (
          <div>
            <p className="text-muted-foreground">OR Number</p>
            <p className="font-medium">{information.or_number}</p>
          </div>
        )}
      </div>

      {information.general_information.co_researchers && information.general_information.co_researchers.length > 0 && (
        <div className="mt-3">
          <p className="text-muted-foreground text-sm mb-2">Co-Researchers</p>
          <div className="flex flex-wrap gap-2">
            {information.general_information.co_researchers.map((researcher, index: number) => (
              <Badge key={index} variant="secondary">
                {String((researcher as { name?: string }).name || '')}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

