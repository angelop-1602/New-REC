"use client";
import DashboardCard from "@/components/rec/proponent/application/components/dashboard-card";
import CustomBreadcrumbs from "@/components/ui/custom/breadcrum";
import Footer from "@/components/rec/proponent/application/footer";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAllUserSubmissions } from "@/lib/firebase/firestore";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading";
  
export default function Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userSubmissions = await getAllUserSubmissions(user.uid);
        setSubmissions(userSubmissions);
        setError(null);
      } catch (err) {
        console.error("Error fetching submissions:", err);
        setError("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user]);

  // Format status for display
  const getStatusDisplay = (status: string, collection: string) => {
    if (collection === "pending") return "Under Review";
    if (collection === "accepted") return "Accepted";
    if (collection === "approved") return "Approved";
    if (collection === "archived") return "Archived";
    return status;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className="lg:pt-20 w-full flex flex-col items-center sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <div className="w-full max-w-7xl mb-4">
        <CustomBreadcrumbs />
      </div>

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
      <div className="flex justify-end">
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
                status={getStatusDisplay(submission.status, submission.collection)}
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
