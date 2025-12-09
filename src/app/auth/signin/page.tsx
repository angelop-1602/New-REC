import { Suspense } from "react";
import { SigninForm } from "@/components/rec/proponent/auth/signin-form";
import { LoadingSimple } from "@/components/ui/loading";

export default function SigninPage() {
  return (
    <div className="bg-primary flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8 bg-background rounded-lg shadow-md">
              <LoadingSimple size="md" text="Loading sign-in form..." />
            </div>
          }
        >
          <SigninForm />
        </Suspense>
      </div>
    </div>
  );
}
