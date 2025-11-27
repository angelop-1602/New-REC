import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface SubmissionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  formType: string;
}

export default function SubmissionConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isSubmitting = false,
  formType,
}: SubmissionConfirmationDialogProps) {
  const getFormTypeDisplayName = (type: string) => {
    switch (type) {
      case 'protocol-review':
        return 'Protocol Review Assessment';
      case 'informed-consent':
        return 'Informed Consent Assessment';
      case 'exemption-checklist':
        return 'Exemption Checklist';
      case 'iacuc-review':
        return 'IACUC Protocol Review Assessment';
      default:
        return 'Assessment Form';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Confirm Submission
          </DialogTitle>
          <DialogDescription>
            You are about to submit your {getFormTypeDisplayName(formType)}. 
            Please review your responses before proceeding.
            <br /><br />
            <span className="text-sm text-gray-600">
              After successful submission, you will be redirected back to your dashboard.
            </span>
          </DialogDescription>
        </DialogHeader>
      
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/80"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </> 
            ) : (
              'Submit Assessment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
