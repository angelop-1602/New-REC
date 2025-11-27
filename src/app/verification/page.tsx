"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAuth, applyActionCode } from "firebase/auth";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

// Separate component that uses useSearchParams
function VerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [mounted, setMounted] = useState(false);

  const oobCode = searchParams.get("oobCode");

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!oobCode) {
        setStatus("error");
        return;
      }

      try {
        const auth = getAuth();
        await applyActionCode(auth, oobCode);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };

    verifyEmail();
  }, [oobCode]);

  const handleClick = () => {
    router.push("/http://localhost:3000/rec/proponent/dashboard/");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0 min-h-svh">
        <CardContent className="grid p-0 md:grid-cols-2">
            <div  className="p-6 md:p-8">
            <Image
                src={mounted && theme === "dark" ? "/SPUP-REC-logo-light.png" : "/SPUP-REC-logo-dark.png"}
                alt="SPUP REC Logo"
                width={200}
                height={200}
                className="mb-4"
              />
              {status === "verifying" && <p>Verifying your email...</p>}
              {status === "success" && (
                <>
                  <h1>Email Verified 🎉</h1>
                  <p>Your email has been successfully verified.</p>
                  <Button onClick={handleClick}>Go to Home</Button>
                </>
              )}
              {status === "error" && (
                <>
                  <h1>Verification Failed</h1>
                  <p>This link may have expired or already been used.</p>
                </>
              )}
            </div>

          <div className="relative hidden md:block">
            <div className="bg-primary absolute inset-0 h-full w-full"></div>
            <Image
              src="/images/our-lady-of-chartres.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale opacity-50"
              width={1000}
              height={1000}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main page component with Suspense boundary
export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden p-0 min-h-svh">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <p>Loading verification...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerificationContent />
    </Suspense>
  );
}
