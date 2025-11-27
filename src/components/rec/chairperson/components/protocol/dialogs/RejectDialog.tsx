"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { XCircle, Loader2 } from "lucide-react";
import { rejectSubmission } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  toChairpersonProtocol
} from '@/types';

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Record<string, unknown>;
  onStatusUpdate: (status: string) => void;
}

export function RejectDialog({ 
  open, 
  onOpenChange, 
  submission, 
  onStatusUpdate 
}: RejectDialogProps) {
  const { user } = useAuth();
  
  // Convert to typed protocol at the top
  const typedSubmission = toChairpersonProtocol(submission);
  
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to reject submissions");
      return;
    }
    
    setIsProcessing(true);
    try {
      await rejectSubmission(String(typedSubmission.id), rejectionReason, user.uid);
      toast.success("Protocol rejected");
      onStatusUpdate("rejected");
      onOpenChange(false);
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast.error("Failed to reject submission. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#036635]/20 dark:border-[#FECC07]/30 animate-in fade-in zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Reject Protocol</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting this protocol
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter the reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="border-[#036635]/20 dark:border-[#FECC07]/30 focus:border-[#036635] dark:focus:border-[#FECC07] focus:ring-[#036635]/20 dark:focus:ring-[#FECC07]/20 transition-all duration-300"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              setRejectionReason("");
            }}
            disabled={isProcessing}
            className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={isProcessing || !rejectionReason}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Protocol
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
