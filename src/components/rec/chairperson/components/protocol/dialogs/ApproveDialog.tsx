"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { useSpupCodeGenerator } from "@/hooks/useSpupCodeGenerator";
import { acceptSubmission } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  toChairpersonProtocol,
  getPIName
} from '@/types';
import { InlineLoading } from "@/components/ui/loading";

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Record<string, unknown>;
  onStatusUpdate: (status: string) => void;
}

export function ApproveDialog({ 
  open, 
  onOpenChange, 
  submission, 
  onStatusUpdate 
}: ApproveDialogProps) {
  const { user } = useAuth();
  const { generateSpupCode } = useSpupCodeGenerator();
  
  // Convert to typed protocol at the top
  const typedSubmission = toChairpersonProtocol(submission);
  
  const [spupCode, setSpupCode] = useState("");
  const [reviewType, setReviewType] = useState<'SR' | 'EX'>('SR');
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate SPUP code when dialog opens
  useEffect(() => {
    const generateCode = async () => {
      if (open && typedSubmission) {
        const piName = getPIName(typedSubmission);
        const principalInvestigator = piName ? { name: piName } : null;
        const code = await generateSpupCode(principalInvestigator, reviewType);
        setSpupCode(code);
      }
    };
    
    generateCode();
  }, [open, typedSubmission, reviewType, generateSpupCode]);

  const handleApprove = async () => {
    if (!spupCode) {
      toast.error("Please enter or confirm the SPUP Code");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to approve submissions");
      return;
    }
    
    setIsProcessing(true);
    try {
      await acceptSubmission(String(typedSubmission.id), spupCode, user.uid, reviewType);
      const researchTypeNames = {
        'SR': 'Social/Behavioral Research',
        'EX': 'Exempted from Review'
      } as const;
      toast.success(`Protocol accepted with SPUP Code: ${spupCode} (${researchTypeNames[reviewType]})`);
      onStatusUpdate("accepted");
      onOpenChange(false);
    } catch (error) {
      console.error("Error accepting submission:", error);
      toast.error("Failed to accept submission. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[#036635]/20 dark:border-[#FECC07]/30 animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Accept Protocol</DialogTitle>
          <DialogDescription>
            Review and confirm the SPUP Code for this protocol
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Research Type Selection */}
          <div>
            <Label className="mb-2">Research Type</Label>
            <RadioGroup value={reviewType} onValueChange={(value) => setReviewType(value as 'SR' | 'EX')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SR" id="sr" />
                <Label htmlFor="sr" className="font-normal cursor-pointer">
                  Social/Behavioral Research (SR)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EX" id="ex" />
                <Label htmlFor="ex" className="font-normal cursor-pointer">
                  Exempted from Review (EX)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Generated SPUP Code */}
          <div>
            <Label htmlFor="spup-code" className="mb-2">Generated SPUP Code</Label>
            <Input
              id="spup-code"
              value={spupCode}
              onChange={(e) => setSpupCode(e.target.value)}
              className="font-mono border-[#036635]/20 dark:border-[#FECC07]/30 focus:border-[#036635] dark:focus:border-[#FECC07] focus:ring-[#036635]/20 dark:focus:ring-[#FECC07]/20 transition-all duration-300"
            />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="text-xs">You can manually edit the code if needed</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              setSpupCode("");
              setReviewType('SR');
            }}
            disabled={isProcessing}
            className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
            disabled={isProcessing || !spupCode}
          >
            {isProcessing ? (
              <>
                <InlineLoading size="sm" />
                <span className="ml-2">Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept Protocol
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
