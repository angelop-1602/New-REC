"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CustomBanner from "@/components/rec/proponent/application/components/protocol/banner";
import ProtocolOverview from "@/components/rec/shared/protocol-overview";
import ProtocolDecision from "@/components/rec/proponent/application/components/protocol/decision";
import { ProtocolReports } from "@/components/rec/proponent/application/components/protocol/report";
import { getSubmissionWithDocuments, getUnreadMessageCount, SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { reviewerService } from "@/lib/services/reviewers/reviewerService";
import { LoadingSpinner } from "@/components/ui/loading";
import GlobalBackButton from "@/components/ui/global-back-button";
import { useRealtimeProtocol } from "@/hooks/useRealtimeProtocol";
import { documentGenerator } from "@/lib/services/documents/documentGenerator";
import { getCurrentChairName } from "@/lib/services/core/recSettingsService";
import { extractTemplateData } from "@/lib/services/documents/templateDataMapper";
import { 
  toProponentSubmission,
  getProtocolTitle,
  getProtocolCode,
  toLocaleDateString,
  InformationType
} from '@/types';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [initialSubmission, setInitialSubmission] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [hasReviewers, setHasReviewers] = useState(false);

  const submissionId = params?.id as string;

  // ⚡ Use real-time protocol hook for auto-updates
  const { protocol: realtimeProtocol } = useRealtimeProtocol({
    protocolId: submissionId,
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: !!submissionId && !!user,
  });

  // Use realtime protocol if available, fallback to initial submission
  const rawSubmission = realtimeProtocol || initialSubmission;
  const submission = rawSubmission ? toProponentSubmission(rawSubmission) : null;

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

        setInitialSubmission(submissionData);
        
        // Check if protocol has reviewers assigned (only for accepted/pending protocols)
        const typedSubmission = toProponentSubmission(submissionData);
        if (typedSubmission.status === 'pending' || typedSubmission.status === 'accepted') {
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
        if (typedSubmission && user) {
          try {
            // Use single submissions collection
            const unreadCount = await getUnreadMessageCount(String(typedSubmission.id), 'submissions', user.uid);
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
  const hasDecision = submission.decision || submission.status === "approved";
  const shouldShowReports = submission.status === "approved" || submission.status === "archived";

  // Real data for reports (empty arrays for now - will be populated from database)
  const progressReports: Array<{
    reportDate: Date;
    formUrl: string;
    status: 'pending' | 'approved' | 'rejected';
  }> = [];
  
  const finalReport = undefined; // No final report submitted yet
  
  const archiving = undefined; // Not archived yet
  
  const isApproved = submission.status === "approved" || submission.status === "archived";
  const isCompleted = submission.status === "archived";

  return (
    <div className="min-h-screen pt-16 lg:pt-20 w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-10">
      {/* Global Back Button */}
      <div className="w-full max-w-7xl mb-4">
        <GlobalBackButton />
      </div>

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

      {/* Decision Alert (only show if there's a decision or if approved) */}
      {hasDecision && (
        <div className="w-full max-w-7xl mb-6">
          <ProtocolDecision 
            protocolId={String(submission.id)}
            collection={isApproved ? 'approved' : 'accepted'}
          />
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
            onDownloadProgressForm={async () => {
              try {
                const chairName = await getCurrentChairName();
                const data = extractTemplateData(submission as unknown as Record<string, unknown>, chairName);
                const code = getProtocolCode(submission) || 'SPUP_REC';
                const blob = await documentGenerator.generateDocument('progress_report', data);
                const fileName = `${code}_Progress_Report_Form_${new Date().toISOString().split('T')[0]}.docx`;
                documentGenerator.downloadDocument(blob, fileName);
              } catch (e) {
                console.error('Failed to download progress report form:', e);
              }
            }}
            onDownloadFinalForm={async () => {
              try {
                const chairName = await getCurrentChairName();
                const data = extractTemplateData(submission as unknown as Record<string, unknown>, chairName);
                const code = getProtocolCode(submission) || 'SPUP_REC';
                const blob = await documentGenerator.generateDocument('final_report', data);
                const fileName = `${code}_Final_Report_Form_${new Date().toISOString().split('T')[0]}.docx`;
                documentGenerator.downloadDocument(blob, fileName);
              } catch (e) {
                console.error('Failed to download final report form:', e);
              }
            }}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="w-full max-w-7xl space-y-6">
        {/* Protocol Overview - Unified Information and Documents */}
        <ProtocolOverview
          information={(submission.information || {}) as unknown as InformationType}
          documents={submission.documents}
          userType="proponent"
          showDocuments={true}
          protocolId={String(submission.id)}
          submissionId={submissionId}
          onDocumentEdit={(documentId: string) => {
            // TODO: Implement document editing
            // Could navigate to a document edit page or open an edit dialog
          }}
        />
      </div>
    </div>
  );
}
