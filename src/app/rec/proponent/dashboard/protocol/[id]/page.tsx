"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CustomBreadcrumbs from "@/components/ui/custom/breadcrum";
import CustomBanner from "@/components/rec/proponent/application/components/protocol/banner";
import ProtocolInformation from "@/components/rec/proponent/application/components/protocol/information";
import ProtocolDocument from "@/components/rec/proponent/application/components/protocol/document";
import ProtocolDecision from "@/components/rec/proponent/application/components/protocol/decision";
import { ProtocolReports } from "@/components/rec/proponent/application/components/protocol/report";
import Footer from "@/components/rec/proponent/application/footer";
import { getSubmissionWithDocuments, getUnreadMessageCount } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

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
          setError("You don't have permission to view this submission");
          return;
        }

        setSubmission(submissionData);
        
        // Fetch unread message count
        if (submissionData && user) {
          try {
            const collectionMap = {
              pending: "submissions_pending",
              accepted: "submissions_accepted", 
              approved: "submissions_approved",
              archived: "submissions_archived",
            };
            const collectionName = collectionMap[submissionData.status as keyof typeof collectionMap];
            if (collectionName) {
              const unreadCount = await getUnreadMessageCount(submissionData.id, collectionName, user.uid);
              setUnreadMessageCount(unreadCount);
            }
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
      <div className="min-h-screen pt-16 lg:pt-20 w-full flex flex-col items-center justify-center px-4">
        <LoadingSpinner size="lg" text="Loading protocol details..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen pt-16 lg:pt-20 w-full flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/rec/proponent/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No submission found
  if (!submission) {
    return (
      <div className="min-h-screen pt-16 lg:pt-20 w-full flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Submission Not Found</h2>
          <p className="text-gray-600 mb-4">The requested protocol could not be found.</p>
          <button
            onClick={() => router.push("/rec/proponent/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Conditional rendering logic
  const shouldShowDecision = submission.decision && submission.decisionDate; // Only show if decision was actually made
  const shouldShowReports = submission.status === "approved" || submission.status === "archived";

  // Mock data for reports (will be replaced with real data later)
  const progressReports = [
    {
      reportDate: new Date(),
      formUrl: "/downloads/progress-report-1.pdf",
      status: "pending" as const,
    },
  ];
  const finalReport = {
    submittedDate: new Date(),
    formUrl: "/downloads/final-report.pdf", 
    status: "pending" as const,
  };
  const archiving = {
    date: new Date(),
    notificationUrl: "/downloads/archiving-notification.pdf",
  };
  const isApproved = submission.status === "approved" || submission.status === "archived";
  const isCompleted = submission.status === "archived";

  return (
    <div className="min-h-screen pt-16 lg:pt-20 w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-10">
      {/* Breadcrumbs */}
      <div className="w-full max-w-7xl mb-4">
        <CustomBreadcrumbs />
      </div>

      {/* Protocol Banner */}
      <div className="w-full max-w-7xl mb-6">
        <CustomBanner 
          title={submission.information?.general_information?.protocol_title}
          status={submission.status}
          submissionId={submission.id}
          spupCode={submission.spupCode}
          tempCode={submission.tempProtocolCode}
          dateSubmitted={submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : undefined}
          unreadMessageCount={unreadMessageCount}
        />
      </div>

      {/* Decision Alert (only show if not pending) */}
      {shouldShowDecision && (
        <div className="w-full max-w-7xl mb-6">
          <ProtocolDecision />
        </div>
      )}

      {/* Protocol Reports (only show if approved or archived) */}
      {shouldShowReports && (
        <div className="w-full max-w-7xl mb-6">
          <ProtocolReports
            progressReports={progressReports}
            finalReport={finalReport}
            archiving={archiving}
            onSubmitProgressReport={() => {}}
            onSubmitFinalReport={() => {}}
            isApproved={isApproved}
            isCompleted={isCompleted}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="w-full max-w-7xl space-y-6">
        {/* Information and Documents - Two Column Layout on Large Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ProtocolInformation information={submission.information} />
          </div>
          <div className="space-y-6">
            <ProtocolDocument documents={submission.documents} />
          </div>
        </div>
      </div>
    </div>
  );
}
