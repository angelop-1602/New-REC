"use client"

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { FileText as FileTextIcon, Loader2, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { generateDecisionDocuments } from "@/lib/services/documents/documentGenerator";
import { reviewersManagementService } from "@/lib/services/reviewers/reviewersManagementService";
import { 
  toChairpersonProtocol,
  getProtocolTitle,
  getProtocolCode,
  getPIName
} from '@/types';

interface GenerateDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Record<string, unknown>;
}

type DecisionType = 'approved' | 'approved_minor_revisions' | 'major_revisions_deferred' | 'disapproved';

const TEMPLATE_LABELS: Record<DecisionType, string[]> = {
  approved: [
    "Certificate of Approval",
    "Notice of SPUP REC Decision",
    "Progress Report Form",
    "Final Report Form"
  ],
  approved_minor_revisions: [
    "Notice of SPUP REC Decision",
    "Protocol Resubmission Form"
  ],
  major_revisions_deferred: [
    "Notice of SPUP REC Decision",
    "Protocol Resubmission Form",
    "Compliance Data Form"
  ],
  disapproved: [
    "Notice of SPUP REC Decision"
  ],
};

export function GenerateDocumentsDialog({ open, onOpenChange, submission }: GenerateDocumentsDialogProps) {
  const { user } = useAuth();
  
  // Convert to typed protocol at the top
  const typedSubmission = toChairpersonProtocol(submission);
  
  const [decision, setDecision] = useState<DecisionType>('approved');
  const [timeline, setTimeline] = useState<string>("");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chairpersonName, setChairpersonName] = useState<string>("REC Chairperson");

  useEffect(() => {
    if (!open) return;
    // default-select all templates for the current decision
    const defaults = TEMPLATE_LABELS[decision];
    setSelectedTemplates(defaults);
    
    // Fetch current REC chairperson from reviewers (REC members)
    const fetchChairperson = async () => {
      try {
        const reviewers = await reviewersManagementService.getAllReviewers();
        // Find the reviewer with role 'chairperson' and is active
        const chairperson = reviewers.find(r => r.role === 'chairperson' && r.isActive);
        if (chairperson) {
          setChairpersonName(chairperson.name);
        } else {
          // Fallback to user display name or default
          setChairpersonName(user?.displayName || "REC Chairperson");
        }
      } catch (error) {
        console.error('Error fetching REC chairperson:', error);
        // Fallback to user display name or default
        setChairpersonName(user?.displayName || "REC Chairperson");
      }
    };
    
    fetchChairperson();
  }, [open, decision, user]);

  const replacementPreview = useMemo(() => {
    const pi = typedSubmission.information?.general_information?.principal_investigator;
    const protocolTitle = getProtocolTitle(typedSubmission);
    const spupCode = getProtocolCode(typedSubmission) || 'TBD';
    const today = new Date();
    const initialDate = new Date(today);
    initialDate.setDate(initialDate.getDate() - 5);
    const durationDate = new Date(today);
    durationDate.setFullYear(durationDate.getFullYear() + 1);

    return [
      // Auto-Generated Values
      { key: "<<DATE>>", value: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { key: "<<INITIAL_DATE>>", value: initialDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { key: "<<DURATION_DATE>>", value: durationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      
      // Protocol Information
      { key: "<<SPUP_REC_CODE>>", value: spupCode },
      { key: "<<PROTOCOL_TITLE>>", value: protocolTitle },
      { key: "<<PRINCIPAL_INVESTIGATOR>>", value: getPIName(typedSubmission) || "N/A" },
      { key: "<<INSTITUTION>>", value: pi?.position_institution || "N/A" },
      { key: "<<ADDRESS>>", value: pi?.address || "N/A" },
      { key: "<<CONTACT_NUMBER>>", value: pi?.contact_number || "N/A" },
      { key: "<<E-MAIL>>", value: pi?.email || "N/A" },
      { key: "<<ADVISER>>", value: typedSubmission.information?.general_information?.adviser?.name || "N/A" },
      { key: "<<APPROVED_DATE>>", value: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { key: "<<TYPE_SUBMISSION>>", value: "Initial Review" },
      
      // Input/Reviewer Values
      { key: "<<VERSION>>", value: "1.0" },
      { key: "<<Chairperson>>", value: chairpersonName },
      
      // Decision-specific
      { key: "Decision", value: decision.replaceAll('_', ' ') },
      { key: "Timeline", value: timeline || (decision === 'approved_minor_revisions' ? '3 days' : decision === 'major_revisions_deferred' ? '7 days' : '—') },
    ];
  }, [typedSubmission, decision, timeline, chairpersonName]);

  const toggleTemplate = (label: string) => {
    setSelectedTemplates(curr => curr.includes(label) ? curr.filter(t => t !== label) : [...curr, label]);
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }
    if ((decision === 'approved_minor_revisions' || decision === 'major_revisions_deferred') && !timeline) {
      toast.error("Please set a timeline for revisions");
      return;
    }

    setIsGenerating(true);
    try {
      const docs = await generateDecisionDocuments(decision, typedSubmission as unknown as Record<string, unknown>, chairpersonName, timeline || undefined);

      // Map document templates to labels for filtering. documentGenerator should expose names;
      // we fallback by matching label substrings in fileName.
      const filtered = docs.filter(doc => {
        const name = doc.fileName || "";
        return selectedTemplates.some(label => name.toLowerCase().includes(label.toLowerCase().split(' ').join('_')) || name.toLowerCase().includes(label.toLowerCase()));
      });

      if (filtered.length === 0) {
        toast.warning("No documents selected to generate");
        return;
      }

      filtered.forEach(doc => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(doc.blob);
        link.download = doc.fileName;
        link.click();
        URL.revokeObjectURL(link.href);
      });

      toast.success(`Generated ${filtered.length} document(s)`);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate documents");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-[#036635]/20 dark:border-[#FECC07]/30 animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Generate Documents</DialogTitle>
          <DialogDescription>
            Preview replacements and select which documents to generate
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label>Decision</Label>
              <Select value={decision} onValueChange={(v) => setDecision(v as DecisionType)}>
                <SelectTrigger className="border-[#036635]/20 dark:border-[#FECC07]/30 focus:border-[#036635] dark:focus:border-[#FECC07] focus:ring-[#036635]/20 dark:focus:ring-[#FECC07]/20 transition-all duration-300">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="approved_minor_revisions">Approved with Minor Revisions</SelectItem>
                  <SelectItem value="major_revisions_deferred">Major Revisions / Deferred</SelectItem>
                  <SelectItem value="disapproved">Disapproved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(decision === 'approved_minor_revisions' || decision === 'major_revisions_deferred') && (
              <div>
                <Label>Timeline for Compliance</Label>
                <Select value={timeline} onValueChange={setTimeline}>
                  <SelectTrigger className="border-[#036635]/20 dark:border-[#FECC07]/30 focus:border-[#036635] dark:focus:border-[#FECC07] focus:ring-[#036635]/20 dark:focus:ring-[#FECC07]/20 transition-all duration-300">
                    <SelectValue placeholder={decision === 'approved_minor_revisions' ? 'Default 3 days' : 'Default 7 days'} />
                  </SelectTrigger>
                  <SelectContent>
                    {decision === 'approved_minor_revisions' ? (
                      <>
                        <SelectItem value="3 days">3 days (Default)</SelectItem>
                        <SelectItem value="5 days">5 days</SelectItem>
                        <SelectItem value="7 days">7 days</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="7 days">7 days (Default)</SelectItem>
                        <SelectItem value="14 days">14 days</SelectItem>
                        <SelectItem value="30 days">30 days</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="mb-2 block">Templates</Label>
              <div className="space-y-2">
                {TEMPLATE_LABELS[decision].map(label => (
                  <label key={label} className="flex items-center gap-2 text-sm">
                    <Checkbox 
                      checked={selectedTemplates.includes(label)} 
                      onCheckedChange={() => toggleTemplate(label)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Replacement Preview</span>
            </div>
            <Separator />
            <div className="h-64 rounded border overflow-auto">
              <div className="p-3 space-y-2 text-sm">
                {replacementPreview.map(item => (
                  <div key={item.key} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{item.key}</span>
                    <span className="text-right break-all">{String(item.value || '')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || selectedTemplates.length === 0}
            className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileTextIcon className="mr-2 h-4 w-4" />
                Generate Selected
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
