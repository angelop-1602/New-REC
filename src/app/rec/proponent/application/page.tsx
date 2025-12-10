"use client";

import { useEffect, useState } from "react";
import { SubmissionInformation } from "@/components/rec/proponent/application/protocol-submission/information";
import SubmissionDocuments from "@/components/rec/proponent/application/protocol-submission/documents";
import SubmissionConfirmation from "@/components/rec/proponent/application/protocol-submission/confirmation";
import Steps from "@/components/ui/custom/steps";
import { Button } from "@/components/ui/button";
import GlobalBackButton from "@/components/ui/global-back-button";
import { LoadingSpinner } from "@/components/ui/loading";
import { SubmissionProvider, useSubmissionContext } from "@/contexts/SubmissionContext";

const STEPS = [
  { label: "Protocol Information", href: "/rec/proponent/application" },
  { label: "Protocol Documents", href: "/rec/proponent/application" },
  { label: "Review & Confirm", href: "/rec/proponent/application" },
];

// Main Application Component with Context
function ApplicationContent() {
  const {
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    canProceed,
    canGoBack,
    submitApplication,
    isSubmitting,
  } = useSubmissionContext();

  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Check confirmation state for step 2 (confirmation step)
  useEffect(() => {
    if (currentStep === 2) {
      const checkConfirmationState = () => {
        try {
          const confirmationState = sessionStorage.getItem('confirmationState');
          if (confirmationState) {
            const state = JSON.parse(confirmationState);
            setCanSubmit(state.canSubmit || false);
          } else {
            setCanSubmit(false);
          }
        } catch {
          setCanSubmit(false);
        }
      };

      // Check immediately
      checkConfirmationState();

      // Set up interval to check for changes
      const interval = setInterval(checkConfirmationState, 100);
      
      return () => clearInterval(interval);
    } else {
      setCanSubmit(true); // Allow submission for other steps
    }
  }, [currentStep]);

  const handleNext = () => {
    nextStep(); // This now includes validation internally
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleSubmit = () => {
    // Submit application directly
    submitApplication();
  };



  return (
    <div className="min-h-screen w-full flex flex-col items-center px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-10">

<div className="w-full max-w-7xl mx-auto mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-4">
  <div className="flex items-center justify-between gap-2 sm:gap-4">
    <div className="flex-shrink-0">
      <GlobalBackButton />
    </div>

    <div className="flex-1 text-center min-w-0 px-2">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground break-words">
        Protocol Review Application
      </h1>
      <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
        Submit your research protocol for ethics review
      </p>
    </div>

    {/* Empty spacer to balance layout */}
    <div className="w-[40px] sm:w-[60px] md:w-[80px] flex-shrink-0"></div>
  </div>
</div>


      
      {/* Progress Steps */}
      <div className="w-full max-w-4xl flex justify-center mb-4 sm:mb-6 lg:mb-8 px-2">
        <Steps
          steps={STEPS}
          current={currentStep}
          onStepChange={() => {}} // Disable direct step clicking for controlled navigation
        />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl">
        {/* Form Content */}
        {currentStep === 0 && <SubmissionInformation />}
        {currentStep === 1 && <SubmissionDocuments />}
        {currentStep === 2 && <SubmissionConfirmation />}
        
        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 lg:mb-8">
          <div className="flex-1 sm:flex-none">
            {canGoBack && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {currentStep < totalSteps - 1 ? (
              <Button
                onClick={handleNext}
                className="flex-1 sm:flex-none"
                disabled={!canProceed}
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/80"
                disabled={isSubmitting || (currentStep === 2 && !canSubmit)}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" showText={false} />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground mt-4">
          {currentStep < totalSteps - 1 ? (
            <p>Complete all required fields to proceed to the next step.</p>
          ) : (
            <p>
              {currentStep === 2 && !canSubmit 
                ? "Please check the confirmation checkbox and type 'CONFIRM' to enable submission."
                : "Review your submission and click 'Submit Application' when ready."
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Main exported component with Provider wrapper
export default function ApplicationPage() {
  return (
    <SubmissionProvider
      onComplete={(submissionId: string) => {
        // Redirect to success page or dashboard
        window.location.href = `/rec/proponent/dashboard?submitted=${submissionId}`;
      }}
      onError={(error: string) => {
        console.error("Submission error:", error);
        // Error handling is done in the context with toasts
      }}
    >
      <ApplicationContent />
    </SubmissionProvider>
  );
}
