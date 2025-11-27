import { Suspense } from "react";
import { SigninForm } from "@/components/rec/proponent/auth/signin-form";

export default function SigninPage() {
  return (
    <div className="bg-primary flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        }>
          <SigninForm />
        </Suspense>
      </div>
    </div>
  );
}
