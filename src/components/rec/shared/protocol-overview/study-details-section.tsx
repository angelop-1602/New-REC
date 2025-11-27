"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GraduationCap, ChevronDown, ChevronUp } from "lucide-react";
import { InformationType } from "@/types";

interface StudyDetailsSectionProps {
  information: InformationType;
  isReviewer?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StudyDetailsSection({
  information,
  isReviewer = false,
  isOpen,
  onOpenChange,
}: StudyDetailsSectionProps) {
  const content = (
    <div className={`grid ${isReviewer ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3 text-sm`}>
      <div>
        <p className="text-muted-foreground">Nature of Study</p>
        <p className="font-medium">{information.nature_and_type_of_study.level}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Type of Study</p>
        <p className="font-medium">{information.nature_and_type_of_study.type}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Study Site</p>
        <p className="font-medium">
          {information.study_site?.location === "within" 
            ? "Within University" 
            : information.study_site?.outside_specify || "Outside University"}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground">Source of Funding</p>
        <p className="font-medium">
          {information.source_of_funding?.selected === "pharmaceutical_company" 
            ? information.source_of_funding?.pharmaceutical_company_specify 
            : information.source_of_funding?.selected === "others"
            ? information.source_of_funding?.others_specify
            : information.source_of_funding?.selected || ''}
        </p>
      </div>
    </div>
  );

  if (isReviewer) {
    return (
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className="pt-4 border-t">
        <CollapsibleTrigger className="w-full">
          <h3 className="font-semibold text-sm text-[#036635] dark:text-[#FECC07] flex items-center justify-between w-full hover:opacity-80 transition-colors duration-200">
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Study Details
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
        <GraduationCap className="h-4 w-4" />
        Study Details
      </h3>
      {content}
    </div>
  );
}

