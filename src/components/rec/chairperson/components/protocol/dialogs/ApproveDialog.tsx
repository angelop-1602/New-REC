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
import { CheckCircle, Loader2, Info } from "lucide-react";
import { useSpupCodeGenerator } from "@/hooks/useSpupCodeGenerator";
import { acceptSubmission } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: any;
  onStatusUpdate: (status: string) => void;
}

export function ApproveDialog({ 
  open, 
  onOpenChange, 
  submission, 
  onStatusUpdate 
}: ApproveDialogProps) {
  const { user } = useAuth();
  const { generateSpupCode, generateInitials, loading: codeLoading } = useSpupCodeGenerator();
  
  const [spupCode, setSpupCode] = useState("");
  const [reviewType, setReviewType] = useState<'SR' | 'PR' | 'HO' | 'BS' | 'EX'>('SR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [piInitials, setPiInitials] = useState("");

  // Generate SPUP code when dialog opens
  useEffect(() => {
    const generateCode = async () => {
      if (open && submission) {
        const pi = submission.information?.general_information?.principal_investigator;
        const code = await generateSpupCode(pi, reviewType);
        setGeneratedCode(code);
        setSpupCode(code);
        
        // Extract initials from PI name
        if (pi?.name) {
          const nameParts = pi.name.trim().split(' ');
          if (nameParts.length >= 2) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            setPiInitials(generateInitials(firstName, lastName));
          }
        }
      }
    };
    
    generateCode();
  }, [open, submission, reviewType, generateSpupCode, generateInitials]);

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
      await acceptSubmission(submission.id, spupCode, user.uid, reviewType);
      const researchTypeNames = {
        'SR': 'Social/Behavioral Research',
        'PR': 'Public Health Research', 
        'HO': 'Health Operations',
        'BS': 'Biomedical Research',
        'EX': 'Exempted from Review'
      };
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Accept Protocol</DialogTitle>
          <DialogDescription>
            Review and confirm the SPUP Code for this protocol
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Research Type Selection */}
          <div>
            <Label className="mb-2">Research Type</Label>
            <RadioGroup value={reviewType} onValueChange={(value) => setReviewType(value as 'SR' | 'PR' | 'HO' | 'BS' | 'EX')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SR" id="sr" />
                <Label htmlFor="sr" className="font-normal cursor-pointer">
                  Social/Behavioral Research (SR)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PR" id="pr" />
                <Label htmlFor="pr" className="font-normal cursor-pointer">
                  Public Health Research (PR)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="HO" id="ho" />
                <Label htmlFor="ho" className="font-normal cursor-pointer">
                  Health Operations (HO)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BS" id="bs" />
                <Label htmlFor="bs" className="font-normal cursor-pointer">
                  Biomedical Research (BS)
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
              className="font-mono"
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
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            className="bg-primary hover:bg-primary/90"
            disabled={isProcessing || !spupCode}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
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
