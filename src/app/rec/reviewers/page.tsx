"use client";

import { useState } from "react";
import { SendHorizonalIcon, LogOut, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReviewerAuthContext } from "@/contexts/ReviewerAuthContext";
import ReviewerTabs from "@/components/rec/reviewer/tabs";
import { LoadingSpinner } from "@/components/ui/loading";
import { useRouter } from "next/navigation";

const Page = () => {
  const heading = "Research Ethics Committee";
  const subheading = "Reviewers Portal";
  const description = "Review the protocols submitted by proponents and provide your feedback.";
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
  } = useReviewerAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    await authenticate(code.trim());
  };

  const handleProtocolAction = (protocolId: string, action: string) => {
    if (action === 'review' || action === 'view' || action === 'edit') {
      // Navigate to the protocol review page (client-side)
      router.push(`/rec/reviewers/protocol/${protocolId}`);
    }
  };
  // While auth state is initializing, show a consistent loading UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Initializing reviewer session..." />
      </div>
    );
  }

  if (isAuthenticated && reviewer) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card shadow-sm border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/SPUP-Logo-with-yellow.png"
                  alt="SPUP Logo"
                  className="h-12 w-auto"
                />
                <div>
                  <h1 className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">{heading}</h1>
                  <p className="text-sm text-muted-foreground">{subheading}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{reviewer.name}</p>
                  <p className="text-xs text-muted-foreground">{reviewer.code} • {reviewer.role}</p>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="border-[#036635] dark:border-[#FECC07] text-[#036635] dark:text-[#FECC07] hover:bg-[#036635] dark:hover:bg-[#FECC07] hover:text-white dark:hover:text-black">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
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
      <section className="py-8">
        <div className="container mx-auto flex flex-col items-center gap-2 lg:px-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/SPUP-Logo-with-yellow.png"
            alt="Reviewers"
            className="w-70"
          />
          <div className="text-center">
            <h2 className=" text-3xl text-[#036635] dark:text-[#FECC07] font-semibold text-pretty md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
              {heading}
              <br />
              <span className="text-3xl text-foreground"> {subheading}</span>
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
                  className="border-[#036635] dark:border-[#FECC07] text-foreground focus-visible:ring-[#036635]/20 dark:focus-visible:ring-[#FECC07]/20 pr-12 bg-background"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="text-[#036635] dark:text-[#FECC07] hover:bg-[#036635] dark:hover:bg-[#FECC07] hover:text-white dark:hover:text-black focus-visible:ring-ring/50 absolute inset-y-0 end-0 rounded-s-none"
                  disabled={isLoading || !code.trim()}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-[#036635] dark:border-[#FECC07] border-t-transparent rounded-full animate-spin" />
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
