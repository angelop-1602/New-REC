"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Mail } from "lucide-react";
import { PageLoading } from "@/components/ui/loading";

export default function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, sendEmailVerification } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to signin if user is not authenticated
      router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  // Show loading state while checking auth
  if (loading) {
    return <PageLoading />;
  }

  // If user is not authenticated, show nothing (redirect will happen)
  if (!user) {
    return null;
  }

  // If user is authenticated but email is not verified, show verification message
  if (!user.emailVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">Email Verification Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Please verify your email address to access the REC Proponent Application.
            </p>
            <p className="text-sm text-muted-foreground">
              We sent a verification email to: <br />
              <span className="font-medium">{user.email}</span>
            </p>
            <div className="space-y-2">
              <Button
                onClick={sendEmailVerification}
                className="w-full"
                variant="outline"
              >
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </Button>
              <Button
                onClick={() => router.push("/auth/signin")}
                variant="ghost"
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is authenticated and email is verified, show the application content
  return <>{children}</>;
} 