"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSubmissionWithDocuments, updateSubmission, getUnreadMessageCount, SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading";
import { customToast } from "@/components/ui/custom/toast";
import { SubmissionProvider, useSubmissionContext } from "@/contexts/SubmissionContext";
import { SubmissionInformation } from "@/components/rec/proponent/application/protocol-submission/information";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { InformationType } from "@/types";
import { toProponentSubmission, getProtocolTitle, getProtocolCode, toLocaleDateString } from '@/types';
import CustomBanner from "@/components/rec/proponent/application/components/protocol/banner";
import { reviewerService } from "@/lib/services/reviewers/reviewerService";

export default function EditProtocolPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [initialInformation, setInitialInformation] = useState<InformationType | null>(null);
  const [initialSubmission, setInitialSubmission] = useState<Record<string, unknown> | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [hasReviewers, setHasReviewers] = useState(false);

  const submissionId = params?.id as string;

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        
        const submissionData = await getSubmissionWithDocuments(submissionId);
        
        if (!submissionData) {
          setError("Submission not found");
          return;
        }

        // Check if user owns this submission
        if (submissionData.submitBy !== user.uid) {
          setError("You don't have permission to edit this submission");
          return;
        }

        const submission = toProponentSubmission(submissionData);
        const submissionStatus = submission.status as string;
        
        // Check if editing is allowed (only pending/draft)
        if (submissionStatus !== "pending" && submissionStatus !== "draft") {
          setError("This submission cannot be edited. Only pending or draft submissions can be edited.");
          return;
        }

        setInitialInformation((submission.information || {}) as unknown as InformationType);
        setInitialSubmission(submissionData);
        
        // Check if protocol has reviewers assigned (only for pending/accepted protocols)
        // Use raw status from submissionData to avoid type narrowing issues
        const rawStatus = (submissionData.status as string) || submissionStatus;
        if (rawStatus === 'pending' || rawStatus === 'accepted' || rawStatus === 'under_review') {
          try {
            const reviewers = await reviewerService.getProtocolReviewers(submissionId);
            setHasReviewers(reviewers.length > 0);
          } catch (reviewerError) {
            console.error("Error checking reviewers:", reviewerError);
            setHasReviewers(false);
          }
        } else {
          setHasReviewers(false);
        }
        
        // Fetch unread message count
        if (submission && user) {
          try {
            const unreadCount = await getUnreadMessageCount(String(submission.id), 'submissions', user.uid);
            setUnreadMessageCount(unreadCount);
          } catch (msgError) {
            console.error("Error fetching unread message count:", msgError);
            // Don't show error for message count, just default to 0
          }
        }
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError("Failed to load submission details");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId, user]);



  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-4">
        <LoadingSpinner size="lg" text="Loading protocol details..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => router.push("/rec/proponent/dashboard")}
            variant="default"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!initialInformation || !initialSubmission) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Submission Not Found</h2>
          <p className="text-gray-600 mb-4">The requested protocol could not be found.</p>
          <Button
            onClick={() => router.push("/rec/proponent/dashboard")}
            variant="default"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const submission = toProponentSubmission(initialSubmission);

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-10">
      {/* Protocol Banner */}
      <div className="w-full max-w-7xl mb-6">
        <CustomBanner 
          title={getProtocolTitle(submission)}
          status={submission.status}
          submissionId={String(submission.id)}
          spupCode={getProtocolCode(submission)}
          tempCode={getProtocolCode(submission)}
          dateSubmitted={toLocaleDateString(submission.createdAt)}
          unreadMessageCount={unreadMessageCount}
          hasReviewers={hasReviewers}
        />
      </div>

      {/* Form Content */}
      <div className="w-full max-w-7xl">
        <SubmissionProviderWithData initialInformation={initialInformation}>
          <EditFormContent
            submissionId={submissionId}
            initialInformation={initialInformation}
            saving={saving}
          />
        </SubmissionProviderWithData>
      </div>
    </div>
  );
}

// Wrapper to initialize SubmissionContext with existing data
function SubmissionProviderWithData({ 
  children, 
  initialInformation 
}: { 
  children: React.ReactNode; 
  initialInformation: InformationType;
}) {
  // Save initial data to localStorage before provider mounts
  // This ensures the provider loads the correct data
  useEffect(() => {
    const { saveDraft, clearDraft } = require("@/lib/utils/localStorageManager");
    clearDraft(); // Clear any existing draft
    saveDraft({
      formData: initialInformation,
      documents: [],
      currentStep: 0,
    });
  }, [initialInformation]);

  return <SubmissionProvider>{children}</SubmissionProvider>;
}

// Component that uses SubmissionContext to manage form state
function EditFormContent({
  submissionId,
  initialInformation,
  saving: _saving,
}: {
  submissionId: string;
  initialInformation: InformationType;
  saving: boolean;
}) {
  const { formData } = useSubmissionContext();
  const [isSaving, setIsSaving] = useState(false);

  // Save the form data using the current formData from context
  const handleSaveClick = async () => {
    if (!submissionId || !formData || isSaving) {
      if (isSaving) {
        customToast.error("Error", "Please wait while the changes are being saved.");
      } else {
        customToast.error("Error", "Missing required information");
      }
      return;
    }

    setIsSaving(true);
    try {
      await updateSubmission(submissionId, formData);
      // Clear draft after successful save
      const { clearDraft } = require("@/lib/utils/localStorageManager");
      clearDraft();
      customToast.success("Success", "Protocol information updated successfully");
      // Navigate back
      window.location.href = `/rec/proponent/dashboard/protocol/${submissionId}`;
    } catch (error) {
      console.error("Error updating protocol:", error);
      customToast.error("Error", "Failed to update protocol information. Please try again.");
      setIsSaving(false); // Reset on error so user can try again
    }
  };

  return (
    <>
      <SubmissionInformation />
      <div className="w-full max-w-7xl mt-6 flex justify-end gap-4 pb-10">
        <Button
          variant="outline"
          onClick={() => {
            if (isSaving) return; // Prevent cancel during save
            const { clearDraft } = require("@/lib/utils/localStorageManager");
            clearDraft();
            window.location.href = `/rec/proponent/dashboard/protocol/${submissionId}`;
          }}
          disabled={isSaving}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={handleSaveClick}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </>
  );
}

