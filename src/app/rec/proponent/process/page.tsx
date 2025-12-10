"use client"

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Footer } from '@/components/rec/proponent/landing/footer';
import { Process } from '@/components/rec/proponent/landing/process';

export default function ProcessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full px-4 py-2 sm:px-6 lg:px-8 flex-1">
        <div className="container mx-auto">
          {/* Back Button */}
          <div className="pt-2 pb-2 sm:pt-4 sm:pb-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/rec/proponent')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>

          {/* Process Content */}
          <Process />
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

