"use client";

import { useFirestoreQuery, useFirestoreDoc } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { firestoreTimestampToLocaleDateString } from "@/lib/utils/firestoreUtils";

/**
 * Example component demonstrating realtime Firestore integration
 * This component shows how to use the new realtime hooks
 */
export default function RealtimeExample() {
  const { user } = useAuth();

  // Example 1: Realtime collection query (no orderBy to avoid index requirements)
  const submissionsQuery = useFirestoreQuery("submissions_pending", {
    where: [{ field: "submitBy", operator: "==", value: user?.uid || "" }],
    limit: 5
  });

  // Example 2: Realtime document query (fixed path)
  const userDocQuery = useFirestoreDoc(user?.uid ? `users/${user.uid}` : "");

  // Example 3: Realtime subcollection query (no orderBy to avoid index requirements)
  const reviewersQuery = useFirestoreQuery("reviewers", {
    where: [{ field: "isActive", operator: "==", value: true }]
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Realtime Firestore Integration Example</h1>
      
      {/* Example 1: User Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Submissions (Realtime)</CardTitle>
        </CardHeader>
        <CardContent>
          {submissionsQuery.loading ? (
            <LoadingSpinner text="Loading submissions..." />
          ) : submissionsQuery.error ? (
            <div className="text-red-600">Error: {submissionsQuery.error}</div>
          ) : submissionsQuery.data ? (
            <div className="space-y-2">
              {submissionsQuery.data.length === 0 ? (
                <p className="text-muted-foreground">No submissions found</p>
              ) : (
                // Sort by creation date in JavaScript (newest first)
                submissionsQuery.data
                  .sort((a: any, b: any) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .slice(0, 5) // Limit to 5 most recent
                  .map((submission: any) => (
                    <div key={submission.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{submission.information?.general_information?.protocol_title || "Untitled"}</p>
                        <p className="text-sm text-muted-foreground">
                          {firestoreTimestampToLocaleDateString(submission.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">{submission.status}</Badge>
                    </div>
                  ))
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Example 2: User Document */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile (Realtime)</CardTitle>
        </CardHeader>
        <CardContent>
          {userDocQuery.loading ? (
            <LoadingSpinner text="Loading user profile..." />
          ) : userDocQuery.error ? (
            <div className="text-red-600">Error: {userDocQuery.error}</div>
          ) : userDocQuery.data ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {userDocQuery.data.email}</p>
              <p><strong>Name:</strong> {userDocQuery.data.displayName || "Not set"}</p>
              <p><strong>Last Login:</strong> {firestoreTimestampToLocaleDateString(userDocQuery.data.lastLoginAt)}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No user profile found</p>
          )}
        </CardContent>
      </Card>

      {/* Example 3: Active Reviewers */}
      <Card>
        <CardHeader>
          <CardTitle>Active Reviewers (Realtime)</CardTitle>
        </CardHeader>
        <CardContent>
          {reviewersQuery.loading ? (
            <LoadingSpinner text="Loading reviewers..." />
          ) : reviewersQuery.error ? (
            <div className="text-red-600">Error: {reviewersQuery.error}</div>
          ) : reviewersQuery.data ? (
            <div className="space-y-2">
              {reviewersQuery.data.length === 0 ? (
                <p className="text-muted-foreground">No active reviewers found</p>
              ) : (
                // Sort by name in JavaScript (alphabetical)
                reviewersQuery.data
                  .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""))
                  .map((reviewer: any) => (
                    <div key={reviewer.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{reviewer.name}</p>
                        <p className="text-sm text-muted-foreground">{reviewer.email}</p>
                      </div>
                      <Badge variant="secondary">{reviewer.code}</Badge>
                    </div>
                  ))
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Realtime Hooks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">1. Collection Query:</h4>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`const { data, loading, error } = useFirestoreQuery("collectionName", {
  where: [{ field: "userId", operator: "==", value: user?.uid }],
  limit: 10
});

// Sort in JavaScript to avoid index requirements
const sortedData = data?.sort((a, b) => 
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium">2. Document Query:</h4>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`const { data, loading, error } = useFirestoreDoc("collectionName/documentId");`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium">3. Subcollection Query:</h4>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`const { data, loading, error } = useFirestoreSubcollection(
  "parentCollection/parentDocId", 
  "subcollectionName",
  { where: [{ field: "status", operator: "==", value: "active" }] }
);

// Sort in JavaScript to avoid index requirements
const sortedData = data?.sort((a, b) => 
  (a.name || "").localeCompare(b.name || "")
);`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
