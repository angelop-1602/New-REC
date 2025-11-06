"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getSubmissionById, getSubmissionWithDocuments, SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import CustomBanner from "@/components/rec/proponent/application/components/protocol/banner";
import { reviewerService } from "@/lib/services/reviewerService";
import { ChairpersonActions } from "@/components/rec/chairperson/components/protocol/chairperson-actions";
import ProtocolOverview from "@/components/rec/shared/protocol-overview";
import { ChairpersonDecisionCard } from "@/components/rec/chairperson/components/protocol/decision-card";
import { getUnreadMessageCount } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useFirestoreDoc } from "@/hooks/use-firestore";
import { firestoreTimestampToLocaleDateString } from "@/lib/utils/firestoreUtils";
import { useRealtimeProtocol } from "@/hooks/useRealtimeProtocol";

export default function ChairpersonProtocolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [initialSubmission, setInitialSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasReviewers, setHasReviewers] = useState(false);

  const submissionId = params.id as string;

  // ⚡ Use real-time protocol hook for auto-updates
  const { protocol: realtimeProtocol, loading: protocolLoading, error: protocolError } = useRealtimeProtocol({
    protocolId: submissionId,
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: !!submissionId,
  });

  // Use realtime protocol if available, fallback to initial submission
  const submission = realtimeProtocol || initialSubmission;

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
          setInitialSubmission(withDocs || data);
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
  }, [submissionId]);

  useEffect(() => {
    if (submission && user) {
      fetchUnreadMessages();
    }
  }, [submission, user]);

  // Check reviewers when submission changes
  useEffect(() => {
    if (submission && (submission.status === 'pending' || submission.status === 'accepted')) {
      checkReviewers();
    } else {
      setHasReviewers(false);
    }
  }, [submission]);

  const checkReviewers = async () => {
    try {
      const reviewers = await reviewerService.getProtocolReviewers(submissionId);
      setHasReviewers(reviewers.length > 0);
    } catch (reviewerError) {
      console.error("Error checking reviewers:", reviewerError);
      setHasReviewers(false);
    }
  };

  const fetchUnreadMessages = async () => {
    if (!user) return;
    
    try {
      // Use single submissions collection
      const count = await getUnreadMessageCount(submissionId, 'submissions', user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    // TODO: Implement status update logic
    console.log("Update status to:", newStatus);
    // No longer needed - realtime updates handle this automatically
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => router.push("/rec/chairperson/submitted-protocols")}>
          Back to Protocols
        </Button>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-muted-foreground mb-4">Protocol not found</p>
        <Button onClick={() => router.push("/rec/chairperson/submitted-protocols")}>
          Back to Protocols
        </Button>
      </div>
    );
  }

  const isApproved = submission.status === "approved" || submission.status === "archived";
  const hasDecision = submission.decision || submission.status === "approved";

  return (
    <div className="container mx-auto py-6 space-y-6">

      {/* Banner */}
      <CustomBanner
        title={submission.information?.general_information?.protocol_title || submission.title || "Untitled Protocol"}
        status={submission.status}
        submissionId={submission.id}
        spupCode={submission.spupCode}
        tempCode={submission.tempProtocolCode}
        dateSubmitted={firestoreTimestampToLocaleDateString(submission.createdAt)}
        unreadMessageCount={unreadCount}
        hasReviewers={hasReviewers}
      />
      {/* Decision Card - Show if there's a decision or if approved */}
      {hasDecision && (
        <ChairpersonDecisionCard 
          protocolId={submission.id}
          collection={isApproved ? 'approved' : 'accepted'}
          onDecisionUpdate={() => {}} // No longer needed - realtime updates
        />
      )}
      {/* Chairperson Actions Card */}
      <ChairpersonActions
        submission={submission}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Protocol Overview - Information and Documents */}
      <ProtocolOverview 
        information={submission.information}
        documents={submission.documents || []}
        userType="chairperson"
        showDocuments={true}
        protocolId={submission.id}
        submissionId={submissionId}
        onDocumentStatusUpdate={() => {}} // No longer needed - realtime updates
      />


    </div>
  );
}
