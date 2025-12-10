"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Users, Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { reviewerService, Reviewer, REVIEWER_REQUIREMENTS } from "@/lib/services/reviewers/reviewerService";
import { useAuth } from "@/hooks/useAuth";
import { customToast } from "@/components/ui/custom/toast";
import { 
  ChairpersonReviewerAssignment,
  toChairpersonProtocol, 
  toChairpersonReviewerAssignments,
  toDate,
  getString
} from "@/types";
import { InlineLoading } from "@/components/ui/loading";

interface AssignReviewersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Record<string, unknown>;
  onAssignmentsUpdate: () => void;
}

export function AssignReviewersDialog({ 
  open, 
  onOpenChange, 
  submission: rawSubmission,
  onAssignmentsUpdate
}: AssignReviewersDialogProps) {
  const { user } = useAuth();
  const chairId = user?.uid || "system";
  const chairName = user?.displayName || "REC Chairperson";
  
  // 🎯 Convert to typed protocol immediately - using our type system!
  const submission = toChairpersonProtocol(rawSubmission);
  
  // Reviewer assignment states
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssigningReviewers, setIsAssigningReviewers] = useState(false);
  const [isLoadingReviewers, setIsLoadingReviewers] = useState(false);
  const [openPopovers, setOpenPopovers] = useState<boolean[]>([]);
  const [assignedReviewers, setAssignedReviewers] = useState<ChairpersonReviewerAssignment[]>([]);
  const [exemptionSubType, setExemptionSubType] = useState<'experimental' | 'documentary'>('experimental');

  // Dynamic dialog width (auto-adjust based on required reviewer slots)
  const [dialogWidth, setDialogWidth] = useState<number>(640);

  const getResearchType = (): string => {
    // First check if researchType is directly stored (from Accept Protocol dialog)
    if (submission.researchType) {
      return getString(submission.researchType);
    }
    
    // Fallback to checking submissionType or nature_and_type_of_study
    const submissionType = getString(submission.information?.submissionType);
    const studyType = submission.information?.nature_and_type_of_study as { type?: string } | undefined;
    
    // Check study type first (more reliable)
    const studyTypeStr = studyType?.type?.toLowerCase();
    if (studyTypeStr?.includes("social") || studyTypeStr?.includes("behavioral")) return "SR";
    if (studyTypeStr?.includes("public health")) return "PR";
    if (studyTypeStr?.includes("health operations")) return "HO";
    if (studyTypeStr?.includes("biomedical")) return "BS";
    if (studyTypeStr?.includes("exempted") || studyTypeStr?.includes("exemption")) return "EX";
    
    // Fallback to submission type check
    const submissionTypeLower = submissionType?.toLowerCase();
    if (submissionTypeLower?.includes("social")) return "SR";
    if (submissionTypeLower?.includes("experimental")) return "experimental";
    if (submissionTypeLower?.includes("exemption")) return "EX";
    
    return "SR"; // default to Social/Behavioral Research
  };

  // Load reviewers when assign reviewers dialog opens
  useEffect(() => {
    const loadReviewers = async () => {
      if (!open) return;

      // compute width immediately when opening
      computeDialogWidth();

      setIsLoadingReviewers(true);
      try {
        const activeReviewers = await reviewerService.getAllReviewers();
        setReviewers(activeReviewers);
        
        // Load existing assignments if any - using type system!
        const rawAssignments = await reviewerService.getProtocolReviewers(submission.id);
        const typedAssignments = toChairpersonReviewerAssignments(rawAssignments);
        setAssignedReviewers(typedAssignments);
        
        if (typedAssignments.length > 0) {
          const reviewerIds = typedAssignments.map(a => a.reviewerId);
          setSelectedReviewers(reviewerIds);
        } else {
          setSelectedReviewers([]);
        }
        
        // Initialize popover states
        const requirements = REVIEWER_REQUIREMENTS[getResearchType() as keyof typeof REVIEWER_REQUIREMENTS];
        setOpenPopovers(new Array(requirements.count).fill(false));
      } catch (error) {
        console.error("Error loading reviewers:", error);
        customToast.error(
          "Load Failed",
          "Failed to load reviewers. Please try again."
        );
      } finally {
        setIsLoadingReviewers(false);
      }
    };
    
    loadReviewers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submission.id]);

  // Recompute dialog width on resize or when research type changes
  useEffect(() => {
    if (!open) return;
    const onResize = () => computeDialogWidth();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedReviewers]);

  const computeDialogWidth = () => {
    // columns roughly equal to required reviewers, clamped 1-3 for layout comfort
    const cols = Math.max(1, Math.min(REVIEWER_REQUIREMENTS[getResearchType() as keyof typeof REVIEWER_REQUIREMENTS].count, 3));
    const colWidth = 320;     // px per column target
    const padding = 96;       // px for internal padding/buttons
    const desired = cols * colWidth + padding;
    const viewportMax = typeof window !== "undefined" ? window.innerWidth - 32 : 1200;
    const hardMax = 1100;     // cap to avoid ultra-wide
    const width = Math.max(420, Math.min(desired, viewportMax, hardMax));
    setDialogWidth(width);
  };

  const handleAssignReviewers = async () => {
    const researchType = getResearchType();
    let requirements: any = REVIEWER_REQUIREMENTS[researchType as keyof typeof REVIEWER_REQUIREMENTS];
    
    // Handle EX subtype requirements
    if (researchType === 'EX' && requirements.hasSubTypes && requirements.subTypes) {
      const subTypeConfig = requirements.subTypes[exemptionSubType];
      if (subTypeConfig) {
        requirements = {
          ...requirements,
          assessmentTypes: subTypeConfig.assessmentTypes,
          label: `${requirements.label} - ${subTypeConfig.label}`
        };
      }
    }
    
    const validReviewers = selectedReviewers.filter(id => id && id.trim() !== "");
    if (validReviewers.length !== requirements.count) {
      customToast.error(
        "Incomplete Selection",
        `Please select all ${requirements.count} reviewers for ${requirements.label}.`
      );
      return;
    }
    
    if (!user) {
      customToast.error(
        "Not Authenticated",
        "You must be logged in to assign reviewers."
      );
      return;
    }
    
    const invalidReviewers = validReviewers.filter(reviewerId => {
      const reviewer = reviewers.find(r => r.id === reviewerId);
      return !reviewer || !reviewer.name;
    });
    
    if (invalidReviewers.length > 0) {
      customToast.error(
        "Invalid Reviewers",
        "Some selected reviewers have missing information. Please select different reviewers."
      );
      return;
    }
    
    setIsAssigningReviewers(true);
    try {
      // submission.id is already typed as string from toChairpersonProtocol()!
      await reviewerService.checkOverdueReviewers(submission.id);
      await reviewerService.removeOverdueReviewers(submission.id);
      
      const success = await reviewerService.assignReviewers(
        submission.id,
        validReviewers,
        researchType as any,
        researchType === 'EX' ? exemptionSubType : undefined,
        chairId,
        chairName
      );
      
      if (success) {
        customToast.success(
          "Reviewers Assigned",
          `Successfully assigned ${requirements.count} reviewers with appropriate deadlines.`
        );
        onOpenChange(false);
        setSelectedReviewers([]);
        setSearchTerm("");
        setOpenPopovers([]);
        onAssignmentsUpdate();
      } else {
        customToast.error(
          "Assign Failed",
          "Failed to assign reviewers. Please try again."
        );
      }
    } catch (error) {
      console.error("Error assigning reviewers:", error);
      customToast.error(
        "Assign Failed",
        "Failed to assign reviewers. Please try again."
      );
    } finally {
      setIsAssigningReviewers(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedReviewers([]);
    setSearchTerm("");
    setOpenPopovers([]);
  };

  const researchType = getResearchType();
  let requirements: any = REVIEWER_REQUIREMENTS[researchType as keyof typeof REVIEWER_REQUIREMENTS];
  
  // Handle EX subtype requirements for UI display
  if (researchType === 'EX' && requirements.hasSubTypes && requirements.subTypes) {
    const subTypeConfig = requirements.subTypes[exemptionSubType];
    if (subTypeConfig) {
      requirements = {
        ...requirements,
        assessmentTypes: subTypeConfig.assessmentTypes,
        label: `${requirements.label} - ${subTypeConfig.label}`
      };
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
    >
      <DialogContent
        // auto-sizing: width driven by state, safe-capped to viewport
        style={{ width: dialogWidth, maxWidth: "calc(100vw - 2rem)" }}
        className="p-6 border-[#036635]/20 dark:border-[#FECC07]/30 animate-in fade-in zoom-in-95 duration-300"
      >
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
            Assign Reviewers
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select reviewers for this protocol based on research type
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* EX Research Type Subtype Selection */}
          {researchType === 'EX' && (
            <div className="rounded-lg p-4 border border-primary/20 bg-primary/5">
              <Label className="text-sm font-medium mb-3 block text-primary">
                Exempted Research Type:
              </Label>
              <RadioGroup 
                value={exemptionSubType} 
                onValueChange={(value) => {
                  setExemptionSubType(value as 'experimental' | 'documentary');
                  // Reset selected reviewers when subtype changes
                  setSelectedReviewers([]);
                }}
                className="space-y-2"
              >
                <div className="flex items-center">
                  <RadioGroupItem value="experimental" id="experimental" />
                  <Label htmlFor="experimental" className="font-normal cursor-pointer">
                    Experimental Research
                  </Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="documentary" id="documentary" />
                  <Label htmlFor="documentary" className="font-normal cursor-pointer">
                    Documentary/Textual Analysis
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Current Assignments and Overdue Status */}
          {assignedReviewers.length > 0 && (
            <div className="rounded-lg p-4 border border-primary/20 bg-primary/5">
              <Label className="text-sm font-medium mb-2 block text-primary">Current Assignments:</Label>
              <div className="space-y-2">
                {assignedReviewers.map((assignment) => {
                  // 🎯 Using type system - toDate() handles all Timestamp conversions!
                  const deadline = toDate(assignment.deadline);
                  const now = new Date();
                  const isOverdue = deadline < now && assignment.reviewStatus === "pending";
                  const daysOverdue = isOverdue ? Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  
                  return (
                    <div key={assignment.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{assignment.reviewerName}</span>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                          {assignment.assessmentType.includes("Protocol Review Assessment") ? "PRA" :
                           assignment.assessmentType.includes("Informed Consent Assessment") ? "ICA" :
                           assignment.assessmentType.includes("IACUC Protocol Review Assessment") ? "IACUC-PRA" :
                           assignment.assessmentType.includes("Checklist for Exemption Form Review") ? "CFEFR" : "Assessment"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Due: {deadline.toLocaleDateString()}
                        </span>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {daysOverdue} days overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Individual Reviewer Selection with Search */}
          <div
            className="grid grid-cols-1 gap-4"
            style={{
              // auto set columns up to 3 for readability
              gridTemplateColumns: `repeat(${Math.min(requirements.count, 3)}, minmax(0, 1fr))`
            }}
          >
            {requirements.assessmentTypes.map((assessmentType: string, index: number) => {
              const reviewerId = selectedReviewers[index] || "";
              const selectedReviewer = reviewers.find(r => r.id === reviewerId);
              
              let abbreviation = "";
              if (assessmentType.includes("Protocol Review Assessment")) {
                abbreviation = "PRA";
              } else if (assessmentType.includes("Informed Consent Assessment")) {
                abbreviation = "ICA";
              } else if (assessmentType.includes("IACUC Protocol Review Assessment")) {
                abbreviation = "IACUC-PRA";
              } else if (assessmentType.includes("Checklist for Exemption Form Review")) {
                abbreviation = "CFEFR";
              } else {
                abbreviation = "Assessment";
              }
              
              return (
                <div key={index} className="space-y-2">
                  <Label className="text-sm font-medium text-primary">
                    Reviewer {index + 1} - {abbreviation}
                  </Label>
                  <Popover 
                    open={openPopovers[index]} 
                    onOpenChange={(open) => {
                      const newOpenPopovers = [...openPopovers];
                      newOpenPopovers[index] = open;
                      setOpenPopovers(newOpenPopovers);
                    }}
                    modal={false}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPopovers[index]}
                        className="w-full justify-between border-primary/30 hover:bg-primary/10"
                      >
                        {selectedReviewer ? selectedReviewer.name : `Select reviewer for ${abbreviation}`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-0 z-[70] pointer-events-auto border-primary/30"
                      align="start"
                      side="bottom"
                    >
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder={`Search reviewer for ${abbreviation}...`} 
                          value={searchTerm} 
                          onValueChange={setSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty className="text-muted-foreground">No reviewer found.</CommandEmpty>
                          <CommandGroup>
                            {reviewers
                              .filter(r => {
                                const term = searchTerm.toLowerCase().trim();
                                if (!term) return true;
                                return (r.name || "").toLowerCase().includes(term);
                              })
                              .filter(r => 
                                !selectedReviewers.includes(r.id) || selectedReviewers[index] === r.id
                              )
                              .map((r) => (
                                <CommandItem
                                  key={r.id}
                                  value={r.id}
                                  onSelect={(val) => {
                                    const newSelected = [...selectedReviewers];
                                    newSelected[index] = val;
                                    setSelectedReviewers(newSelected);

                                    const newOpen = [...openPopovers];
                                    newOpen[index] = false;
                                    setOpenPopovers(newOpen);

                                    setSearchTerm("");
                                    // adjust width in case count changed view needs breathing space
                                    computeDialogWidth();
                                  }}
                                  className="cursor-pointer hover:bg-primary/10"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${reviewerId === r.id ? "opacity-100" : "opacity-0"}`}
                                  />
                                  {r.name || "Unknown Name"}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isAssigningReviewers}
            className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssignReviewers}
            disabled={
              isAssigningReviewers ||
              selectedReviewers.filter(id => id && id.trim() !== "").length !== requirements.count
            }
            className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
          >
            {isAssigningReviewers ? (
              <>
                <InlineLoading size="sm" />
                <span className="ml-2">Assigning...</span>
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Assign Reviewers
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
