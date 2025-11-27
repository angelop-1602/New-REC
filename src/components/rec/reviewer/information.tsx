import { ChevronDown, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { InformationType } from "@/types";

interface ProtocolInformationProps {
  information?: InformationType;
}

export default function ProtocolInformation({ information }: ProtocolInformationProps) {
  // Map the information data to display format
  const info = information ? {
    principalInvestigator: information.general_information?.principal_investigator?.name || "-",
    courseProgram: information.general_information?.principal_investigator?.course_program || "-",
    adviser: information.general_information?.adviser?.name || "-",
    email: information.general_information?.principal_investigator?.email || "-",
    // Handle both combined position_institution and separate position/institution fields
    positionInstitution: information.general_information?.principal_investigator?.position_institution || 
                        ((information.general_information?.principal_investigator && 
                          'position' in information.general_information.principal_investigator &&
                          'institution' in information.general_information.principal_investigator) ? 
                         `${(information.general_information.principal_investigator as { position?: string; institution?: string }).position} at ${(information.general_information.principal_investigator as { position?: string; institution?: string }).institution}` : 
                         "-"),
    address: information.general_information?.principal_investigator?.address || "-",
    contactNumber: information.general_information?.principal_investigator?.contact_number || "-",
    coResearchers: information.general_information?.co_researchers?.map(r => r.name).filter(Boolean) || [],
    // Set type of review based on research type (study type)
    typeOfReview: (() => {
      const studyType = information.nature_and_type_of_study?.type;
      if (studyType?.includes('Social') || studyType?.includes('Behavioral')) return 'Social/Behavioral Research (SR)';
      if (studyType?.includes('Public Health')) return 'Public Health Research (PR)';
      if (studyType?.includes('Health Operations')) return 'Health Operations (HO)';
      if (studyType?.includes('Biomedical')) return 'Biomedical Research (BS)';
      if (studyType?.includes('Exempted') || studyType?.includes('Exemption')) return 'Exempted from Review (EX)';
      return studyType || "-";
    })(),
    studySite: information.study_site?.location === 'within' ? 'Within University' : 
               information.study_site?.location === 'outside' ? (information.study_site?.outside_specify || 'Outside University') : "-",
    studyLevel: information.nature_and_type_of_study?.level || "-",
    studyType: information.nature_and_type_of_study?.type || "-",
    startDate: information.duration_of_study?.start_date || "-",
    endDate: information.duration_of_study?.end_date || "-",
    participantCount: information.participants?.number_of_participants || 0,
    participantDescription: information.participants?.type_and_description || "-",
    briefDescription: information.brief_description_of_study || "-",
    fundingDetails: {
      selfFunded: information.source_of_funding?.selected === "self_funded" || false,
      others: information.source_of_funding?.others_specify || ""
    }
  } : {
    principalInvestigator: "-",
    courseProgram: "-",
    adviser: "-",
    email: "-",
    positionInstitution: "-",
    address: "-",
    contactNumber: "-",
    coResearchers: [],
    typeOfReview: "-",
    studySite: "-",
    studyLevel: "-",
    studyType: "-",
    startDate: "-",
    endDate: "-",
    participantCount: 0,
    participantDescription: "-",
    briefDescription: "-",
    fundingDetails: {
      selfFunded: false,
      others: ""
    }
  };

  return (
    <Card className="w-full mx-auto shadow-sm border border-muted-foreground/10 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-[#036635] dark:text-[#FECC07]">
          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#036635]/80 dark:text-[#FECC07]/80 flex-shrink-0" />
          Protocol Information
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 max-h-[400px] sm:max-h-[450px] lg:max-h-[500px] overflow-y-auto">
        {/* Basic Info */}
        <div className="space-y-3">
          <InfoGrid>
            <InfoField label="Principal Investigator" value={info.principalInvestigator} />
            <InfoField label="Course/Program" value={info.courseProgram} />
            <InfoField label="Adviser" value={info.adviser} />
            <InfoField label="Email" value={info.email} />
            <InfoField label="Position & Institution" value={info.positionInstitution} span={2} />
            <InfoField label="Address" value={info.address} />
            <InfoField label="Contact Number" value={info.contactNumber} />
            <InfoField 
              label="Co-Researchers" 
              value={info.coResearchers?.length ? info.coResearchers.join(", ") : "-"} 
              span={2} 
            />
          </InfoGrid>
        </div>

        <Separator className="my-4" />

        <Collapsible>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">More Details</span>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 transition-transform data-[state=open]:rotate-180"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="pt-4">
            <div className="space-y-4">
              <InfoGrid>
                <InfoField label="Type of Review" value={info.typeOfReview} />
                <InfoField label="Study Site" value={info.studySite} />
                <InfoField label="Study Level" value={info.studyLevel} />
                <InfoField label="Study Type" value={info.studyType} />
                <InfoField label="Start Date" value={info.startDate} />
                <InfoField label="End Date" value={info.endDate} />
                <InfoField label="Participants" value={info.participantCount?.toString() || "0"} span={1} />
                <InfoField label="Participant Description" value={info.participantDescription} span={2} />
                <InfoField label="Brief Description" value={info.briefDescription} span={2} />
              </InfoGrid>
              
              {/* Nested collapsible for funding */}
              <Collapsible>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">Funding Details</span>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 transition-transform data-[state=open]:rotate-180"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent className="pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <FundingItem 
                      label={info.fundingDetails.selfFunded ? "Self-Funded" : "Others"}
                    />    
                    {info.fundingDetails.others && (
                      <FundingItem 
                        label="Others" 
                        value={info.fundingDetails.others} 
                        span={3}
                      />
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

// --- Helper Components ---

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-3">
      {children}
    </div>
  );
}

function InfoField({ 
  label, 
  value, 
  span 
}: { 
  label: string; 
  value: string; 
  span?: number; 
}) {
  return (
    <div className={`space-y-1 ${span === 2 ? "sm:col-span-2" : span === 3 ? "xl:col-span-3" : ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="text-sm text-foreground break-words">{value}</div>
    </div>
  );
}

function FundingItem({ 
  label, 
  value,
  span,
}: { 
  label: string; 
  value?: string;
  span?: number;
}) {
  return (
    <div className={`${span ? `sm:col-span-${span}` : ""}`}>
      <span>{label}</span>
      {value && <span className="ml-2">: {value}</span>}
    </div>
  );
}
