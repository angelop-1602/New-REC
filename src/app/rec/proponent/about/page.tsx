"use client"

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Footer } from '@/components/rec/proponent/landing/footer';
import { About } from '@/components/rec/proponent/landing/about';
import { Members } from '@/components/rec/proponent/landing/members';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full px-4 py-2 sm:px-6 lg:px-8 flex-1">
        <div className="container mx-auto">
          {/* About Content */}
          <About />
          <Members />
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

