"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit2 } from "lucide-react";
import { InformationType } from "@/types";
import { GeneralInformationSection } from "./general-information-section";
import { StudyDetailsSection } from "./study-details-section";
import { DurationParticipantsSection } from "./duration-participants-section";
import { useRouter } from "next/navigation";

interface ProtocolInformationCardProps {
  information: InformationType;
  isReviewer?: boolean;
  userType?: "proponent" | "reviewer" | "chairperson";
  protocolId?: string;
  submissionStatus?: string;
  isStudyDetailsOpen?: boolean;
  onStudyDetailsOpenChange?: (open: boolean) => void;
  isDurationParticipantsOpen?: boolean;
  onDurationParticipantsOpenChange?: (open: boolean) => void;
}

export function ProtocolInformationCard({
  information,
  isReviewer = false,
  userType = "proponent",
  protocolId,
  submissionStatus,
  isStudyDetailsOpen,
  onStudyDetailsOpenChange,
  isDurationParticipantsOpen,
  onDurationParticipantsOpenChange,
}: ProtocolInformationCardProps) {
  const router = useRouter();
  
  // Check if editing is allowed (only for pending/draft status for proponent)
  const canEdit = userType === "proponent" && 
                  protocolId && 
                  (submissionStatus === "pending" || submissionStatus === "draft");

  const handleEdit = () => {
    if (protocolId) {
      router.push(`/rec/proponent/dashboard/protocol/${protocolId}/edit`);
    }
  };

  return (
    <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden p-0">
      <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 rounded-t-lg pt-6 pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#036635] dark:text-[#FECC07]" />
            <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Protocol Information</span>
          </CardTitle>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        <GeneralInformationSection
          information={information}
          isReviewer={isReviewer}
          userType={userType}
          protocolId={protocolId}
        />
        
        <StudyDetailsSection
          information={information}
          isReviewer={isReviewer}
          isOpen={isStudyDetailsOpen}
          onOpenChange={onStudyDetailsOpenChange}
        />

        <DurationParticipantsSection
          information={information}
          isReviewer={isReviewer}
          isOpen={isDurationParticipantsOpen}
          onOpenChange={onDurationParticipantsOpenChange}
        />

        {information.brief_description_of_study && (
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold text-sm text-[#036635] dark:text-[#FECC07]">Brief Description of Study</h3>
            <p className="text-sm text-muted-foreground">{information.brief_description_of_study}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

