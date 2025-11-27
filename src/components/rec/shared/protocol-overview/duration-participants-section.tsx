"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { InformationType } from "@/types";

interface DurationParticipantsSectionProps {
  information: InformationType;
  isReviewer?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DurationParticipantsSection({
  information,
  isReviewer = false,
  isOpen,
  onOpenChange,
}: DurationParticipantsSectionProps) {
  const content = (
    <>
      <div className={`grid ${isReviewer ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3 text-sm`}>
        <div>
          <p className="text-muted-foreground">Start Date</p>
          <p className="font-medium">{information.duration_of_study?.start_date || ''}</p>
        </div>
        <div>
          <p className="text-muted-foreground">End Date</p>
          <p className="font-medium">{information.duration_of_study?.end_date || ''}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Number of Participants</p>
          <p className="font-medium">{information.participants?.number_of_participants || ''}</p>
        </div>
      </div>
      {information.participants?.type_and_description && (
        <div className="mt-2">
          <p className="text-muted-foreground text-sm mb-1">Participant Description</p>
          <p className="text-sm">{information.participants.type_and_description}</p>
        </div>
      )}
    </>
  );

  if (isReviewer) {
    return (
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className="pt-4 border-t">
        <CollapsibleTrigger className="w-full">
          <h3 className="font-semibold text-sm text-[#036635] dark:text-[#FECC07] flex items-center justify-between w-full hover:opacity-80 transition-colors duration-200">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Duration & Participants
            </span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </h3>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3">
          {content}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-3 pt-4 border-t">
      <h3 className="font-semibold text-sm text-[#036635] dark:text-[#FECC07] flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Duration & Participants
      </h3>
      {content}
    </div>
  );
}

