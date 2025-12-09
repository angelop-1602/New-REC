"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LoadingSkeleton } from "@/components/ui/loading";
import { getSubmissionById, getSubmissionWithDocuments, SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import CustomBanner from "@/components/rec/proponent/application/components/protocol/banner";
import { reviewerService } from "@/lib/services/reviewers/reviewerService";
import { ChairpersonActions } from "@/components/rec/chairperson/components/protocol/chairperson-actions";
import ProtocolOverview from "@/components/rec/shared/protocol-overview";
import { ChairpersonDecisionCard } from "@/components/rec/chairperson/components/protocol/decision-card";
import { getUnreadMessageCount } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeProtocol } from "@/hooks/useRealtimeProtocol";
import { checkArchivingConditions, archiveProtocol, updateProtocolActivity } from "@/lib/services/core/archivingService";
import { 
  ChairpersonProtocol, 
  toChairpersonProtocol,
  getProtocolTitle,
  toLocaleDateString,
  InformationType,
  DocumentsType
} from '@/types';

export default function ChairpersonProtocolDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [initialSubmission, setInitialSubmission] = useState<ChairpersonProtocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasReviewers, setHasReviewers] = useState(false);

  const submissionId = params.id as string;

  // ⚡ Use real-time protocol hook for auto-updates
  const { protocol: realtimeProtocol } = useRealtimeProtocol({
    protocolId: submissionId,
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: !!submissionId,
  });

  // Use realtime protocol if available, fallback to initial submission
  // Convert realtime protocol to typed if needed
  const submission: ChairpersonProtocol | null = realtimeProtocol 
    ? toChairpersonProtocol(realtimeProtocol) 
    : initialSubmission;

  // Fetch initial submission from any collection (pending, accepted, approved, archived)
  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // getSubmissionById automatically searches all collections
        const data = await getSubmissionById(submissionId);
        
        if (data) {
          // Try to get documents if available
          const withDocs = await getSubmissionWithDocuments(submissionId);
          const rawData = withDocs || data;
          // Convert to typed protocol
          const typedProtocol = toChairpersonProtocol(rawData);
          setInitialSubmission(typedProtocol);
          
          // Check archiving conditions for non-archived protocols
          if (data.status !== "archived") {
            const archivingCheck = await checkArchivingConditions(submissionId);
            if (archivingCheck.shouldArchive && archivingCheck.reason) {
              // Automatically archive if conditions are met
              try {
                await archiveProtocol(
                  submissionId,
                  archivingCheck.reason,
                  archivingCheck.details,
                  user?.uid || "system"
                );
                // Refresh the submission after archiving
                const updatedData = await getSubmissionById(submissionId);
                const updatedWithDocs = await getSubmissionWithDocuments(submissionId);
                const rawUpdated = updatedWithDocs || updatedData;
                const typedUpdated = toChairpersonProtocol(rawUpdated);
                setInitialSubmission(typedUpdated);
              } catch (archiveError) {
                console.error("Error archiving protocol:", archiveError);
              }
            }
          }
          
          // Update activity timestamp
          await updateProtocolActivity(submissionId);
        } else {
          setError("Protocol not found");
        }
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError("Failed to load protocol");
      } finally {
        setLoading(false);
      }
    };
    
    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId, user]);

  // Fetch unread messages when submission changes
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!user || !submission) return;
      
      try {
        // Use single submissions collection
        const count = await getUnreadMessageCount(submissionId, 'submissions', user.uid);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };

    if (submission && user) {
      fetchUnreadMessages();
    }
  }, [submission, user, submissionId]);

  // Check reviewers when submission changes
  useEffect(() => {
    const checkReviewers = async () => {
      if (!submission || (submission.status !== 'pending' && submission.status !== 'accepted')) {
        setHasReviewers(false);
        return;
      }

      try {
        const reviewers = await reviewerService.getProtocolReviewers(submissionId);
        setHasReviewers(reviewers.length > 0);
      } catch (reviewerError) {
        console.error("Error checking reviewers:", reviewerError);
        setHasReviewers(false);
      }
    };

    if (submission && (submission.status === 'pending' || submission.status === 'accepted')) {
      checkReviewers();
    } else {
      setHasReviewers(false);
    }
  }, [submission, submissionId]);

  const handleStatusUpdate = async (newStatus: string) => {
    // TODO: Implement status update logic
    console.log("Update status to:", newStatus);
    // No longer needed - realtime updates handle this automatically
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6 space-y-6 animate-in fade-in duration-500">
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <LoadingSkeleton className="h-10 w-64 rounded-md mb-2" />
          <LoadingSkeleton className="h-4 w-40 rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <LoadingSkeleton className="h-40 w-full rounded-xl" />
            <LoadingSkeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <LoadingSkeleton className="h-40 w-full rounded-xl" />
            <LoadingSkeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen animate-in fade-in duration-500">
        <p className="text-destructive mb-4">{error}</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center h-screen animate-in fade-in duration-500">
        <p className="text-muted-foreground mb-4">Protocol not found</p>
      </div>
    );
  }

  const isApproved = submission.status === "approved" || submission.status === "archived";
  const hasDecision = submission.decision || submission.decisionDetails || submission.status === "approved";

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-6 animate-in fade-in duration-500">

      {/* Banner */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
      <CustomBanner
        title={getProtocolTitle(submission)}
        status={submission.status}
        submissionId={submission.id}
        spupCode={submission.spupCode}
        tempCode={submission.tempProtocolCode}
        dateSubmitted={toLocaleDateString(submission.createdAt)}
        unreadMessageCount={unreadCount}
        hasReviewers={hasReviewers}
      />
      </div>
      {/* Decision Card - Show if there's a decision or if approved */}
      {hasDecision && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <ChairpersonDecisionCard 
          protocolId={submission.id}
          collection={isApproved ? 'approved' : 'accepted'}
          onDecisionUpdate={() => {}} // No longer needed - realtime updates
        />
        </div>
      )}
      {/* Chairperson Actions Card */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <ChairpersonActions
        submission={submission as unknown as Record<string, unknown>}
        onStatusUpdate={handleStatusUpdate}
      />
      </div>

      {/* Protocol Overview - Information and Documents */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-450">
      <ProtocolOverview 
        information={submission.information as unknown as InformationType}
        documents={((submission as unknown as { documents?: DocumentsType[] }).documents || []) as DocumentsType[]}
        userType="chairperson"
        showDocuments={true}
        protocolId={submission.id}
        submissionId={submissionId}
        onDocumentStatusUpdate={() => {}} // No longer needed - realtime updates
      />
      </div>


    </div>
  );
}
