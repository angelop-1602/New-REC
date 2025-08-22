"use client";

import { MoveRight, PhoneCall, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../../../hooks/useAuth";
import { useRouter } from "next/navigation";

export const CTA = () => {
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmitProposal = () => {
    if (user && user.emailVerified) {
      // User is authenticated and verified, go to application page
      router.push("/rec/proponent/application");
    } else {
      // User is not authenticated or not verified, redirect to signin
      router.push("/auth/signin?redirect=/rec/proponent/application");
    }
  };

  return (
    <div className="w-full py-20 lg:py-40 bg-muted px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex flex-col text-center py-14 gap-4 items-center">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tighter max-w-2xl font-regular mb-4">
              Start Your Ethical Research Journey
            </h3>
            <p className="text-base sm:text-lg leading-relaxed tracking-tight text-muted-foreground max-w-2xl">
              Become part of a dedicated community that values integrity,
              transparency, and responsibility in research. By submitting your
              proposal for ethical review, you take a vital step toward ensuring
              that your study respects the rights, dignity, and well-being of all
              participants. Join us in promoting a culture of ethical excellence
              and help shape a future grounded in trustworthy, impactful research.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto max-w-md sm:max-w-none">
            <Button className="gap-4 w-full sm:w-auto" variant="outline">
             <PhoneCall className="w-4 h-4" /> Get in touch <MoveRight className="w-4 h-4" />
            </Button>
            <Button className="gap-4 w-full sm:w-auto" onClick={handleSubmitProposal}>
              <FilePlus className="w-4 h-4" /> Submit a proposal <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
