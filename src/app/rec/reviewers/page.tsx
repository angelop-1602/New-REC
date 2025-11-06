"use client";

import { useState } from "react";
import { ArrowRight, SendHorizonalIcon, LogOut, User, Calendar, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReviewerAuthContext } from "@/contexts/ReviewerAuthContext";
import ReviewerTabs from "@/components/rec/reviewer/tabs";
import { LoadingSpinner } from "@/components/ui/loading";
import { useRouter } from "next/navigation";

interface Props {
  heading: string;
  subheading: string;
  description: string;
}

const Page = ({
  heading = "Research Ethics Committee",
  subheading = "Reviewers Portal",
  description = "Review the protocols submitted by proponents and provide your feedback.",
}: Props) => {
  const [code, setCode] = useState("");
  const router = useRouter();
  const { 
    isAuthenticated, 
    isLoading, 
    reviewer, 
    assignedProtocols, 
    error, 
    authenticate, 
    logout,
    refreshAssignedProtocols 
  } = useReviewerAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    await authenticate(code.trim());
  };

  const handleProtocolAction = (protocolId: string, action: string) => {
    console.log(`Protocol action: ${action} for protocol: ${protocolId}`);
    
    if (action === 'review' || action === 'view' || action === 'edit') {
      // Navigate to the protocol review page (client-side)
      router.push(`/rec/reviewers/protocol/${protocolId}`);
    }
  };
  // While auth state is initializing, show a consistent loading UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Initializing reviewer session..." />
      </div>
    );
  }

  if (isAuthenticated && reviewer) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src="/SPUP-Logo-with-yellow.png"
                  alt="SPUP Logo"
                  className="h-12 w-auto"
                />
                <div>
                  <h1 className="text-2xl font-bold text-primary">{heading}</h1>
                  <p className="text-sm text-muted-foreground">{subheading}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{reviewer.name}</p>
                  <p className="text-xs text-muted-foreground">{reviewer.code} • {reviewer.role}</p>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Protocol Tabs */}
          <ReviewerTabs 
            assignedProtocols={assignedProtocols}
            onProtocolAction={handleProtocolAction}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="py-12">
        <div className="container mx-auto flex flex-col items-center gap-2 lg:px-16">
          <img
            src="/SPUP-Logo-with-yellow.png"
            alt="Reviewers"
            className="w-70"
          />
          <div className="text-center">
            <h2 className=" text-3xl text-primary font-semibold text-pretty md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
              {heading}
              <br />
              <span className="text-3xl text-black"> {subheading}</span>
            </h2>
            <p className="mb-8 text-muted-foreground md:text-base lg:max-w-2xl lg:text-lg">
              {description}
            </p>
            
            {/* Error Display */}
            {error && (
              <Alert className="mb-6 max-w-md mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-2 mb-10">
              <div className="relative max-w-md mx-auto">
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter your reviewer code (e.g., XXXXX-000)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border-primary text-primary focus-visible:ring-primary/20 pr-12"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="text-primary focus-visible:ring-ring/50 absolute inset-y-0 end-0 rounded-s-none hover:bg-transparent"
                  disabled={isLoading || !code.trim()}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <SendHorizonalIcon />
                  )}
                  <span className="sr-only">Submit</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Page;
