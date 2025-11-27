"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { InformationType } from "@/types";
import { GeneralInformationSection } from "./general-information-section";
import { StudyDetailsSection } from "./study-details-section";
import { DurationParticipantsSection } from "./duration-participants-section";

interface ProtocolInformationCardProps {
  information: InformationType;
  isReviewer?: boolean;
  isStudyDetailsOpen?: boolean;
  onStudyDetailsOpenChange?: (open: boolean) => void;
  isDurationParticipantsOpen?: boolean;
  onDurationParticipantsOpenChange?: (open: boolean) => void;
}

export function ProtocolInformationCard({
  information,
  isReviewer = false,
  isStudyDetailsOpen,
  onStudyDetailsOpenChange,
  isDurationParticipantsOpen,
  onDurationParticipantsOpenChange,
}: ProtocolInformationCardProps) {
  return (
    <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden p-0">
      <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 rounded-t-lg pt-6 pb-6">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#036635] dark:text-[#FECC07]" />
          <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Protocol Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <GeneralInformationSection
          information={information}
          isReviewer={isReviewer}
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

