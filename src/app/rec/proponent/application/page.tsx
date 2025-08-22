"use client";

import { useEffect } from "react";
import { SubmissionInformation } from "@/components/rec/proponent/application/protocol-submission/information";
import SubmissionDocuments from "@/components/rec/proponent/application/protocol-submission/documents";
import Steps from "@/components/ui/custom/steps";
import CustomBreadcrumbs from "@/components/ui/custom/breadcrum";
import { Button } from "@/components/ui/button";
import Footer from "@/components/rec/proponent/application/footer";
import { SubmissionProvider, useSubmissionContext } from "@/contexts/SubmissionContext";

const STEPS = [
  { label: "Protocol Information", href: "/rec/proponent/application" },
  { label: "Protocol Documents", href: "/rec/proponent/application" },
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
    forceValidateAllFields,
    showSubmissionDialog,
  } = useSubmissionContext();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const handleNext = () => {
    nextStep(); // This now includes validation internally
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleSubmit = () => {
    // Show confirmation dialog instead of direct submission
    showSubmissionDialog();
  };



  return (
    <div className="min-h-screen pt-16 lg:pt-20 w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-10">
      {/* Breadcrumbs */}
      <div className="w-full max-w-7xl mb-4">
        <CustomBreadcrumbs />
      </div>
      
      {/* Page Header */}
      <div className="w-full max-w-7xl mb-6 lg:mb-8 text-center">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Protocol Review Application
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Submit your research protocol for ethics review
        </p>
      </div>
      
      {/* Progress Steps */}
      <div className="w-full max-w-4xl flex justify-center mb-6 lg:mb-8">
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
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
              >
                Submit Application
              </Button>
            )}
          </div>
        </div>
        
        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground mt-4">
          {currentStep < totalSteps - 1 ? (
            <p>Complete all required fields to proceed to the next step.</p>
          ) : (
            <p>Review your submission and click "Submit Application" when ready.</p>
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
