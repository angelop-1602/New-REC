"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Process } from "@/components/rec/proponent/landing/process";

interface SubmissionProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmissionProcessDialog({
  open,
  onOpenChange,
}: SubmissionProcessDialogProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleStartSubmission = () => {
    onOpenChange(false);
    // Check if user is authenticated and verified
    if (user && user.emailVerified) {
      router.push("/rec/proponent/application");
    } else {
      // Redirect to signin with redirect to application
      router.push("/auth/signin?redirect=/rec/proponent/application");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[50%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
            Protocol Submission Process
          </DialogTitle>
          <DialogDescription className="text-base">
            Follow these steps to submit your research protocol for ethics review
          </DialogDescription>
        </DialogHeader>

        {/* Use the Process component */}
        <div>
          <Process />
        </div>

        {/* Action Buttons */}
        <div className=" flex flex-col justify-center items-center sm:flex-row gap-3 mt-6  sticky bottom-0 bg-background py-6  border-y">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 max-w-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartSubmission}
            className="flex-1 bg-[#036635] max-w-xs hover:bg-[#036635]/90 dark:bg-[#FECC07] dark:hover:bg-[#FECC07]/90 dark:text-[#036635] text-white"
          >
            Start Submission
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

