"use client";
import DashboardCard from "@/components/rec/proponent/application/components/dashboard-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon, FileText, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFirestoreQuery } from "@/hooks/useFirestore";
import { useMemo, useState, useEffect, useCallback } from "react";
import { PageLoading } from "@/components/ui/loading";
import { getDisplayStatus } from "@/lib/utils/statusUtils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUnreadMessageCount } from "@/lib/firebase/firestore";
import { 
  ProponentSubmission, 
  toProponentSubmissions,
  sortByDate,
  getProtocolTitle,
  getProtocolCode,
  toLocaleDateString,
  toDate,
  FirestoreDate
} from '@/types';
  
export default function Page() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Realtime query for single submissions collection
  const submissionsQuery = useFirestoreQuery("submissions", {
    where: [{ field: "submitBy", operator: "==", value: user?.uid || "" }]
  });

  // Process submissions with collection information from status field
  const allSubmissions = useMemo(() => {
    if (!user || !submissionsQuery.data) return [];

    // Convert to typed submissions using new type system
    const typedSubmissions = toProponentSubmissions(submissionsQuery.data);
    
    // Add collection field for backward compatibility
    const processed = typedSubmissions.map((submission) => ({
      ...submission,
      collection: submission.status || "pending",
    }));

    // Sort by creation date (newest first) using typed sorting
    return sortByDate(processed, 'createdAt', 'desc');
  }, [user, submissionsQuery.data]);

  // Filter submissions based on search and status
  const submissions = useMemo(() => {
    let filtered = allSubmissions;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((submission: ProponentSubmission) => {
        if (statusFilter === "pending") {
          return submission.status === "pending" || submission.status === "draft" || submission.status === "submitted";
        }
        if (statusFilter === "under_review") {
          return submission.status === "accepted" || submission.status === "under_review";
        }
        return submission.status === statusFilter;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((submission: ProponentSubmission) => {
        const title = getProtocolTitle(submission).toLowerCase();
        const code = getProtocolCode(submission)?.toLowerCase() || "";
        const appId = (submission.applicationID as string)?.toLowerCase() || "";
        return title.includes(query) || code.includes(query) || appId.includes(query);
      });
    }

    return filtered;
  }, [allSubmissions, statusFilter, searchQuery]);

  // Determine loading and error states
  const loading = submissionsQuery.loading;
  const error = submissionsQuery.error;

  // Format status for display - use centralized utility
  const formatStatusForDisplay = (submission: ProponentSubmission) => {
    return getDisplayStatus(
      submission.status || 'pending',
      submission.decision || submission.decisionDetails?.decision,
      false // hasReviewers - can be enhanced if needed
    );
  };

  // Format date for display - use typed date utility
  const formatDate = (date: unknown) => {
    const dateObj = toDate(date as FirestoreDate);
    return dateObj ? toLocaleDateString(dateObj) : 'N/A';
  };

  // Function to fetch unread message counts (memoized with useCallback)
  const fetchUnreadCounts = useCallback(async () => {
    if (!user || !allSubmissions.length) {
      setUnreadCounts({});
      return;
    }

    try {
      // Fetch unread counts for all submissions in parallel
      const countPromises = allSubmissions.map(async (submission) => {
        try {
          const count = await getUnreadMessageCount(
            String(submission.id),
            'submissions',
            user.uid
          );
          return { submissionId: String(submission.id), count };
        } catch (error) {
          console.error(`Error fetching unread count for ${submission.id}:`, error);
          return { submissionId: String(submission.id), count: 0 };
        }
      });

      const results = await Promise.all(countPromises);
      const countsMap: Record<string, number> = {};
      results.forEach(({ submissionId, count }) => {
        countsMap[submissionId] = count;
      });
      setUnreadCounts(countsMap);
    } catch (error) {
      console.error("Error fetching unread message counts:", error);
      setUnreadCounts({});
    }
  }, [user, allSubmissions]);

  // Fetch unread message counts for all submissions
  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // Refresh unread counts when page regains focus or becomes visible (user returns from viewing messages)
  useEffect(() => {
    const handleFocus = () => {
      fetchUnreadCounts();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCounts();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUnreadCounts]);

  // Refresh unread counts periodically (every 30 seconds) to catch real-time updates
  useEffect(() => {
    if (!user || !allSubmissions.length) return;

    const interval = setInterval(() => {
      fetchUnreadCounts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchUnreadCounts, user, allSubmissions.length]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-muted/20 to-background pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-4 lg:mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Manage your protocol submissions and track their progress
              </p>
            </div>
            <div className="flex gap-2">
              {/* <MockDataInjector /> */}
              <Button 
                onClick={() => router.push("/rec/proponent/application")}
                className="bg-[#036635] hover:bg-[#036635]/90 dark:bg-[#FECC07] dark:hover:bg-[#FECC07]/90 dark:text-[#036635] text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Submit New Protocol
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 border-[#036635]/20 dark:border-[#FECC07]/30 bg-gradient-to-t from-[#036635]/5 to-card dark:from-[#FECC07]/10 dark:to-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#036635] dark:text-[#FECC07]" />
              Search & Filter Protocols
            </CardTitle>
            <CardDescription>
              Find your protocols by title, SPUP code, or application ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title, SPUP code, or application ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Protocols List */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {loading ? (
            <div className="text-center py-16">
              <PageLoading />
            </div>
          ) : error ? (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">
                  Error Loading Submissions
                </CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : allSubmissions.length === 0 ? (
            <Card className="text-center py-16 border-[#036635]/20 dark:border-[#FECC07]/30">
              <CardContent>
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No submissions yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start by submitting your first protocol for ethics review.
                </p>
                <Button 
                  onClick={() => router.push("/rec/proponent/application")}
                  className="bg-[#036635] hover:bg-[#036635]/90 dark:bg-[#FECC07] dark:hover:bg-[#FECC07]/90 dark:text-[#036635] text-white"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Submit New Protocol
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Status Tabs */}
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <TabsList className="inline-flex w-full sm:grid sm:grid-cols-3 lg:grid-cols-5 bg-muted/50 min-w-max sm:min-w-0 gap-1 sm:gap-0">
                    <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 flex-shrink-0">
                      All ({allSubmissions.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 flex-shrink-0">
                    Pending ({allSubmissions.filter((s: ProponentSubmission) => s.status === "pending" || s.status === "draft" || s.status === "submitted").length})
                  </TabsTrigger>
                    <TabsTrigger value="under_review" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 flex-shrink-0">
                      <span className="hidden sm:inline">Under Review</span>
                      <span className="sm:hidden">Review</span> ({allSubmissions.filter((s: ProponentSubmission) => s.status === "accepted" || s.status === "under_review").length})
                  </TabsTrigger>
                    <TabsTrigger value="approved" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 flex-shrink-0">
                    Approved ({allSubmissions.filter((s: ProponentSubmission) => s.status === "approved").length})
                  </TabsTrigger>
                    <TabsTrigger value="archived" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 flex-shrink-0">
                    Archived ({allSubmissions.filter((s: ProponentSubmission) => s.status === "archived").length})
                  </TabsTrigger>
                </TabsList>
                </div>
              </Tabs>

              {/* Protocols Grid */}
              {submissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 auto-rows-fr">
                  {submissions.map((submission, index) => (
                    <div
                      key={submission.id}
                      className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <DashboardCard
                        title={getProtocolTitle(submission)}
                        status={formatStatusForDisplay(submission)}
                        date={formatDate(submission.createdAt)}
                        buttonText="View Details"
                        onViewDetails={() => router.push(`/rec/proponent/dashboard/protocol/${submission.id}`)}
                        unreadCount={unreadCounts[String(submission.id)] || 0}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-8 border-[#036635]/20 dark:border-[#FECC07]/30">
                  <CardContent>
                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No protocols found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search or filter criteria." : "No protocols match the selected status."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
