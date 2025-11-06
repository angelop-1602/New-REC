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

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: any;
  onStatusUpdate: (status: string) => void;
}

export function RejectDialog({ 
  open, 
  onOpenChange, 
  submission, 
  onStatusUpdate 
}: RejectDialogProps) {
  const { user } = useAuth();
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
      await rejectSubmission(submission.id, rejectionReason, user.uid);
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
      <DialogContent className="bg-black text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Reject Protocol</DialogTitle>
          <DialogDescription className="text-gray-300">
            Provide a reason for rejecting this protocol
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rejection-reason" className="text-white">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter the reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
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
            className="border-gray-600 text-white hover:bg-gray-700"
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
