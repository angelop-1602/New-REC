"use client";

import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { InformationType } from "@/types";

interface GeneralInformationSectionProps {
  information: InformationType;
  isReviewer?: boolean;
}

export function GeneralInformationSection({
  information,
  isReviewer = false,
}: GeneralInformationSectionProps) {
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
            <p className="font-medium">{information.general_information.principal_investigator.course_program}</p>
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

