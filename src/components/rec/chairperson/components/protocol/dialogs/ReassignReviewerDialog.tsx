"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { UserX, Check, ChevronsUpDown, AlertTriangle, Loader2 } from "lucide-react";
import { reviewerService, Reviewer } from "@/lib/services/reviewerService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ReassignReviewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any; // The overdue assignment to reassign
  protocolId: string;
  onReassignmentSuccess: () => void;
}

export function ReassignReviewerDialog({ 
  open, 
  onOpenChange, 
  assignment,
  protocolId,
  onReassignmentSuccess
}: ReassignReviewerDialogProps) {
  const { user } = useAuth();
  
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>("");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingReviewers, setIsLoadingReviewers] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Predefined reasons for reassignment
  const reassignmentReasons = [
    "Missed deadline - No response",
    "Missed deadline - Unable to complete on time",
    "Conflict of interest discovered",
    "Reviewer requested to be removed",
    "Reviewer unavailable due to personal reasons",
    "Reviewer expertise not aligned with protocol",
    "Workload too high for reviewer",
    "Other (specify below)"
  ];

  // Load reviewers when dialog opens
  useEffect(() => {
    const loadReviewers = async () => {
      if (!open) return;

      setIsLoadingReviewers(true);
      try {
        const activeReviewers = await reviewerService.getAllReviewers();
        // Filter out the current reviewer being replaced
        const availableReviewers = activeReviewers.filter(r => r.id !== assignment?.reviewerId);
        setReviewers(availableReviewers);
      } catch (error) {
        console.error("Error loading reviewers:", error);
        toast.error("Failed to load reviewers");
      } finally {
        setIsLoadingReviewers(false);
      }
    };
    
    loadReviewers();
  }, [open, assignment]);

  const handleReassign = async () => {
    if (!selectedReviewerId) {
      toast.error("Please select a new reviewer");
      return;
    }
    
    if (!selectedReason) {
      toast.error("Please select a reason for reassignment");
      return;
    }
    
    // If "Other" is selected, require custom reason
    if (selectedReason === "Other (specify below)" && !customReason.trim()) {
      toast.error("Please specify the reason for reassignment");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to reassign reviewers");
      return;
    }
    
    // Use custom reason if "Other" is selected, otherwise use selected reason
    const finalReason = selectedReason === "Other (specify below)" 
      ? customReason.trim() 
      : selectedReason;
    
    setIsReassigning(true);
    try {
      const success = await reviewerService.reassignReviewer(
        protocolId,
        assignment.id,
        selectedReviewerId,
        finalReason,
        user.email || user.id || 'Unknown Chairperson'
      );
      
      if (success) {
        const newReviewer = reviewers.find(r => r.id === selectedReviewerId);
        toast.success(`Successfully reassigned to ${newReviewer?.name}`);
        onReassignmentSuccess();
        handleClose();
      } else {
        toast.error("Failed to reassign reviewer. Please try again.");
      }
    } catch (error) {
      console.error("Error reassigning reviewer:", error);
      toast.error("Failed to reassign reviewer. Please try again.");
    } finally {
      setIsReassigning(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedReviewerId("");
    setSelectedReason("");
    setCustomReason("");
    setSearchTerm("");
    setPopoverOpen(false);
  };

  const selectedReviewer = reviewers.find(r => r.id === selectedReviewerId);

  // Calculate days overdue
  const deadline = assignment?.deadline?.toDate?.() || new Date(assignment?.deadline);
  const now = new Date();
  const daysOverdue = Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Reassign Overdue Reviewer
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Reassign this overdue reviewer assignment to a new reviewer. The old reviewer will lose access to this protocol.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Assignment Info */}
          <div className="rounded-lg p-4 border border-destructive/30 bg-destructive/5">
            <Label className="text-sm font-medium mb-2 block text-destructive">
              Current Overdue Assignment:
            </Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{assignment?.reviewerName}</span>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {assignment?.assessmentType?.includes("Protocol Review Assessment") ? "PRA" :
                   assignment?.assessmentType?.includes("Informed Consent Assessment") ? "ICA" :
                   assignment?.assessmentType?.includes("IACUC Protocol Review Assessment") ? "IACUC-PRA" :
                   assignment?.assessmentType?.includes("Checklist for Exemption Form Review") ? "CFEFR" : "Assessment"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Original Deadline:</span>
                <span className="text-xs">{deadline.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {daysOverdue} days overdue
                </Badge>
              </div>
            </div>
          </div>

          {/* New Reviewer Selection */}
          <div className="space-y-2">
            <Label htmlFor="newReviewer" className="text-sm font-medium text-primary">
              Select New Reviewer *
            </Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between border-primary/30 hover:bg-primary/10"
                  disabled={isLoadingReviewers}
                >
                  {selectedReviewer ? selectedReviewer.name : "Select new reviewer"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[400px] p-0 z-[70] pointer-events-auto border-primary/30" 
                align="start"
                side="bottom"
              >
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search reviewer..." 
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
                        .map((r) => (
                          <CommandItem
                            key={r.id}
                            value={r.id}
                            onSelect={(val) => {
                              setSelectedReviewerId(val);
                              setPopoverOpen(false);
                              setSearchTerm("");
                            }}
                            className="cursor-pointer hover:bg-primary/10"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${selectedReviewerId === r.id ? "opacity-100" : "opacity-0"}`}
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

          {/* Reason for Reassignment */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium text-primary">
              Reason for Reassignment *
            </Label>
            <Select
              value={selectedReason}
              onValueChange={setSelectedReason}
              disabled={isReassigning}
            >
              <SelectTrigger className="w-full border-primary/30">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {reassignmentReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Show custom reason textarea if "Other" is selected */}
            {selectedReason === "Other (specify below)" && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="customReason" className="text-sm font-medium text-primary">
                  Please specify the reason *
                </Label>
                <Textarea
                  id="customReason"
                  placeholder="Enter the specific reason for reassignment..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="min-h-[80px] border-primary/30 focus-visible:ring-primary/20"
                  disabled={isReassigning}
                />
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              This reason will be visible to the removed reviewer in their "Reassigned" tab.
            </p>
          </div>

          {/* Important Notice */}
          <div className="rounded-lg p-4 border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-amber-900 dark:text-amber-200">Important:</p>
                <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 space-y-1">
                  <li>The old reviewer will lose access to this protocol</li>
                  <li>Any partial assessment data will be deleted</li>
                  <li>The new reviewer will get a fresh 2-week deadline</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isReassigning}
            className="border-primary/30 hover:bg-primary/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReassign}
            disabled={
              isReassigning || 
              !selectedReviewerId || 
              !selectedReason ||
              (selectedReason === "Other (specify below)" && !customReason.trim())
            }
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isReassigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reassigning...
              </>
            ) : (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Reassign Reviewer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

