"use client";

import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useAuth } from "../../../../hooks/useAuth";
import { useRouter } from "next/navigation";

export const Hero = () => {
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
    <div className="w-full sm:px-6 lg:px-8 mt-[10rem]">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 gap-8 items-center lg:grid-cols-2">
          <div className="flex gap-4 flex-col">
            <div>
              <Badge variant="outline" className="bg-secondary text-primary">
                St. Paul University Philippines Research Ethics Committee
              </Badge>
            </div>
            <div className="flex gap-4 flex-col">
              <h1 className="text-xl sm:text-4xl md:text-3xl lg:text-5xl max-w-full tracking-tighter text-left font-regular">
                Upholding Ethical Integrity in Research
              </h1>
              <p className="text-base sm:text-lg xl:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-full text-left">
                At St. Paul University Philippines, the Research Ethics Committee
                (SPUP REC) serves as a guardian of ethical research conduct.
                Whether you're a student, faculty member, or external
                collaborator, our goal is to ensure your research involving human
                participants adheres to national and international ethical
                standards.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button size="lg" className="gap-4 w-full sm:w-auto" onClick={handleSubmitProposal}>
                Submit a Proposal <MoveRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center p-4">
            <Image
              src="/SPUP-final-logo.png"
              alt="logo"
              width={250}
              height={250}
              className="w-full h-auto max-w-[200px] sm:max-w-[250px] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
