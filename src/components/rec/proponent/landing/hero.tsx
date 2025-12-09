"use client";

import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useAuth } from "../../../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const Hero = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: true });

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
    <section className="relative w-full min-h-screen overflow-hidden -mt-16 lg:h-screen lg:mt-0">
      {/* Main Container - Full viewport height */}
      <div className="h-full w-full relative">
        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 h-full">
          {/* Left: Green Section with Text */}
          <div className="relative bg-[#036635] flex items-center px-12 xl:px-16">
            {/* Gradient fade on right edge */}
            <div className="absolute right-0 top-0 bottom-0 w-full bg-gradient-to-l from-[#036635] to-transparent z-10" />
            
            <div 
              ref={heroRef}
              className={`flex flex-col gap-4 text-white relative z-20 max-w-5xl w-full px-12 xl:px-16 transition-all duration-1000 ${
                heroVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <div className={`transition-all duration-700 delay-100 ${
                heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <Badge variant="outline" className="bg-[#FECC07]/20 text-white border-white/30 backdrop-blur-sm">
                  St. Paul University Philippines Research Ethics Committee
                </Badge>
              </div>
              <div className={`flex flex-col gap-4 transition-all duration-700 delay-200 ${
                heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <h1 className="text-5xl sm:text-4xl md:text-3xl lg:text-5xl max-w-full tracking-tighter font-regular text-white">
                  Upholding Ethical Integrity in Research
                </h1>
                <p className="text-xl sm:text-lg xl:text-xl leading-relaxed tracking-tight text-white/90 max-w-full">
                  At St. Paul University Philippines, the Research Ethics Committee
                  (SPUP REC) serves as a guardian of ethical research conduct.
                  Whether you&apos;re a student, faculty member, or external
                  collaborator, our goal is to ensure your research involving human
                  participants adheres to national and international ethical
                  standards.
                </p>
              </div>
              <div className={`flex flex-row gap-4 mt-3 transition-all duration-700 delay-300 ${
                heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <Button 
                  size="lg" 
                  className="gap-4 bg-[#FECC07] hover:bg-[#FECC07]/90 text-[#036635] font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                  onClick={handleSubmitProposal}
                >
                  Submit a Proposal <MoveRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right: Image Section */}
          <div className="relative overflow-hidden">
            {/* Gradient fade on left edge */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#036635] to-transparent z-10" />
            
            <Image
              src="/heroimage.jpeg"
              alt="SPUP Campus"
              fill
              priority
              sizes="(max-width: 1024px) 0vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Mobile: Stacked Layout */}
        <div className="lg:hidden min-h-[calc(100vh-4rem)] flex flex-col">
          {/* Image Section - Top */}
          <div className="relative h-[55vh] overflow-hidden flex-shrink-0">
            {/* Gradient overlay on bottom edge */}
            <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-[#036635] to-transparent z-10" />
            
            <Image
              src="/heroimage.jpeg"
              alt="SPUP Campus"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          
          {/* Green Section - Bottom with Text - Extends to fill remaining space */}
          <div className="relative bg-[#036635] flex-1 flex items-center px-4 sm:px-6 min-h-[53vh]">
            <div className="flex flex-col gap-4 text-white w-full items-center text-center py-8">
              <div className="transition-all duration-700 delay-100 opacity-100 translate-y-0">
                <Badge variant="outline" className="bg-[#FECC07]/20 text-white border-white/30 backdrop-blur-sm">
                  St. Paul University Philippines Research Ethics Committee
                </Badge>
              </div>
              <div className="flex flex-col gap-4 transition-all duration-700 delay-200 opacity-100 translate-y-0">
                <h1 className="text-xl sm:text-4xl md:text-3xl max-w-full tracking-tighter font-regular text-white">
                  Upholding Ethical Integrity in Research
                </h1>
                <p className="text-base sm:text-lg leading-relaxed tracking-tight text-white/90 max-w-full">
                  At St. Paul University Philippines, the Research Ethics Committee
                  (SPUP REC) serves as a guardian of ethical research conduct.
                  Whether you&apos;re a student, faculty member, or external
                  collaborator, our goal is to ensure your research involving human
                  participants adheres to national and international ethical
                  standards.
                </p>
              </div>
              <div className="flex flex-col gap-4 mt-3 w-full transition-all duration-700 delay-300 opacity-100 translate-y-0">
                <Button 
                  size="lg" 
                  className="gap-4 w-full bg-[#FECC07] hover:bg-[#FECC07]/90 text-[#036635] font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                  onClick={handleSubmitProposal}
                >
                  Submit a Proposal <MoveRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
