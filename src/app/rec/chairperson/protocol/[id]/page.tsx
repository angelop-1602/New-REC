"use client"

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getSubmissionWithDocuments, getUnreadMessageCount } from "@/lib/firebase/firestore";
import { Loader2 } from "lucide-react";
import CustomBanner from "@/components/rec/proponent/application/components/protocol/banner";
import ProtocolInformation from "@/components/rec/proponent/application/components/protocol/information";
import ProtocolDocument from "@/components/rec/proponent/application/components/protocol/document";
import ProtocolMessage from "@/components/rec/proponent/application/components/protocol/message";
import ProtocolDecision from "@/components/rec/proponent/application/components/protocol/decision";
import { ProtocolReports } from "@/components/rec/proponent/application/components/protocol/report";
import { useAuth } from "@/hooks/useAuth";
import { ChairpersonActions } from "@/components/rec/chairperson/components/protocol/chairperson-actions";

export default function ChairpersonProtocolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const submissionId = params.id as string;

  useEffect(() => {
    if (submissionId) {
      fetchSubmissionDetails();
      fetchUnreadMessages();
    }
  }, [submissionId]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      const data = await getSubmissionWithDocuments(submissionId);
      
      if (!data) {
        setError("Protocol not found");
        return;
      }
      
      setSubmission(data);
    } catch (err) {
      console.error("Error fetching submission:", err);
      setError("Failed to load protocol details");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadMessages = async () => {
    if (!user) return;
    
    try {
      // Detect collection based on submission status
      const submission = await getSubmissionWithDocuments(submissionId);
      if (!submission) return;
      
      const collectionMap: Record<string, string> = {
        pending: "submissions_pending",
        accepted: "submissions_accepted", 
        approved: "submissions_approved",
        archived: "submissions_archived",
      };
      
      const collectionName = collectionMap[submission.status];
      if (collectionName) {
        const count = await getUnreadMessageCount(submissionId, collectionName, user.uid);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    // TODO: Implement status update logic
    console.log("Update status to:", newStatus);
    // After update, refresh the submission
    await fetchSubmissionDetails();
  };

  const handleAssignReviewer = async (reviewerId: string) => {
    // TODO: Implement reviewer assignment logic
    console.log("Assign reviewer:", reviewerId);
    // After assignment, refresh the submission
    await fetchSubmissionDetails();
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

  const isAccepted = submission.status === "accepted";
  const isApproved = submission.status === "approved" || submission.status === "archived";

  return (
    <div className="container mx-auto py-6 space-y-6">

      {/* Banner */}
      <CustomBanner
        title={submission.information?.general_information?.protocol_title || submission.title || "Untitled Protocol"}
        status={submission.status}
        submissionId={submission.id}
        spupCode={submission.spupCode || submission.tempProtocolCode}
        dateSubmitted={submission.createdAt}
        unreadMessageCount={unreadCount}
      />

      {/* Chairperson Actions Card */}
      <ChairpersonActions
        submission={submission}
        onStatusUpdate={handleStatusUpdate}
        onAssignReviewer={handleAssignReviewer}
      />

      {/* Information */}
      <ProtocolInformation
        information={submission.information}
        isReadOnly={true}
      />

      {/* Documents */}
      <ProtocolDocument documents={submission.documents || []} />

      {/* Messages */}
      <Card>
        <ProtocolMessage
          submissionId={submission.id}
          unreadCount={unreadCount}
          onMessageSent={() => setUnreadCount(0)}
        />
      </Card>

      {/* Decision (only show if accepted or beyond) */}
      {(isAccepted || isApproved) && (
        <ProtocolDecision />
      )}

      {/* Reports (only show if approved or archived) */}
      {isApproved && (
        <ProtocolReports 
          progressReports={[]}
          onSubmitProgressReport={() => {}}
          onSubmitFinalReport={() => {}}
          isApproved={true}
          isCompleted={submission.status === "archived"}
        />
      )}
    </div>
  );
}
