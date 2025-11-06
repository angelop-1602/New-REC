"use client";
import DashboardCard from "@/components/rec/proponent/application/components/dashboard-card";
import Footer from "@/components/rec/proponent/application/footer";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFirestoreQuery } from "@/hooks/use-firestore";
import { useMemo } from "react";
import { LoadingSpinner } from "@/components/ui/loading";
import { firestoreTimestampToLocaleDateString } from "@/lib/utils/firestoreUtils";
import { MockDataInjector } from "@/components/rec/proponent/application/components/mock-data-injector";
import { getDisplayStatus } from "@/lib/utils/statusUtils";
  
export default function Page() {
  const router = useRouter();
  const { user } = useAuth();

  // Realtime query for single submissions collection
  const submissionsQuery = useFirestoreQuery("submissions", {
    where: [{ field: "submitBy", operator: "==", value: user?.uid || "" }]
  });

  // Process submissions with collection information from status field
  const submissions = useMemo(() => {
    if (!user || !submissionsQuery.data) return [];

    const allSubmissions = submissionsQuery.data.map((submission: any) => ({
      ...submission,
      collection: submission.status || "pending", // Use status field as collection for backward compatibility
    }));

    // Sort by creation date (newest first)
    return allSubmissions.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [user, submissionsQuery.data]);

  // Determine loading and error states
  const loading = submissionsQuery.loading;
  const error = submissionsQuery.error;

  // Format status for display - use centralized utility
  const formatStatusForDisplay = (submission: any) => {
    return getDisplayStatus(
      submission.status,
      submission.decision || submission.decisionDetails?.decision,
      false // hasReviewers - can be enhanced if needed
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return firestoreTimestampToLocaleDateString(dateString);
  };

  return (
    <div className="lg:pt-30 w-full flex flex-col items-center sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex justify-between items-center w-full max-w-7xl">
      <div className="w-full max-w-7xl mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Manage your protocol submissions and track their progress
        </p>
      </div>
      <div className="flex gap-2 justify-end">
        <MockDataInjector />
        <Button onClick={() => router.push("/rec/proponent/application")}>
          <PlusIcon className="w-4 h-4" />
          Submit New Protocol
        </Button>
      </div>
      </div>
   

      {/* Dashboard Content */}
      <div className="w-full max-w-7xl">
        {loading ? (
          <div className="text-center py-16">
            <LoadingSpinner size="lg" text="Loading submissions..." />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-medium text-red-600 mb-2">
                Error Loading Submissions
              </h3>
              <p className="text-muted-foreground mb-6">
                {error}
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        ) : submissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {submissions.map((submission) => (
              <DashboardCard
                key={submission.id}
                title={submission.information?.general_information?.protocol_title || "Untitled Protocol"}
                status={formatStatusForDisplay(submission)}
                date={formatDate(submission.createdAt)}
                buttonText="View Details"
                onViewDetails={() => router.push(`/rec/proponent/dashboard/protocol/${submission.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-medium text-foreground mb-2">
                No submissions yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start by submitting your first protocol for ethics review.
              </p>
              <Button onClick={() => router.push("/rec/proponent/application")}>
                Submit New Protocol
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
