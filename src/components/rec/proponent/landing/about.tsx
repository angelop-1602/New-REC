"use client"

import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const About = () => {
  const router = useRouter();
  const { ref: aboutRef, isVisible: aboutVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: true });

  return (
  <div className="w-full px-4 py-2 sm:px-6 lg:px-8 bg-background">
    <div className="container mx-auto">
      <div 
        ref={aboutRef}
        className={`flex gap-4 py-8 lg:py-12 flex-col items-start transition-all duration-1000 ${
          aboutVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        <div className={`flex gap-2 flex-col transition-all duration-700 delay-100 ${
          aboutVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
        }`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tighter lg:max-w-xl font-regular text-foreground">
            About SPUP Research Ethics Committee
          </h2>
          <p className="text-base sm:text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-muted-foreground">
            Committed to upholding the highest standards of research ethics.
          </p>
        </div>
        <div className={`flex gap-4 pt-2 flex-col w-full transition-all duration-700 delay-200 ${
          aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <p className="text-foreground leading-relaxed">
            Established in 2021, the St. Paul University Philippines Research
            Ethics Committee (SPUP REC) is committed to upholding the highest
            standards of research ethics. We ensure that all research involving
            human participants conducted within our institution adheres to
            international ethical principles and national guidelines. Our
            committee operates under the fundamental ethical principles of
            respect for persons, beneficence, and justice, ensuring that
            research participants&apos; rights, safety, and well-being are always
            protected. We provide comprehensive support to researchers, faculty,
            and students, ensuring that all research proposals are reviewed and
            approved in accordance with relevant ethical guidelines and
            institutional policies.
          </p>
        </div>
        <div className={`pt-4 transition-all duration-700 delay-300 ${
          aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <Button
            variant="outline"
            onClick={() => router.push('/rec/proponent/about')}
            className="gap-2 px-6 py-4 text-base hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 border-primary text-primary hover:shadow-lg"
          >
            Want to know more about the SPUP REC?
            <MoveRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  </div>
  );
};
