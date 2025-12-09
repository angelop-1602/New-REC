"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomDialog } from "@/components/ui/custom/dialog";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "../../../../hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { LoadingSimple } from "@/components/ui/loading";

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendEmailStatus, setResendEmailStatus] = useState<string | null>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const { 
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    signInWithGoogle,
    sendPasswordResetEmail,
    loading,
    error,
    clearError,
    // Email verification dialog state
    showEmailVerificationDialog,
    verificationEmail,
    emailVerificationStatus,
    checkEmailVerification,
    closeEmailVerificationDialog,
    sendEmailVerification
  } = useAuth();
  
  const searchParams = useSearchParams();
  const role = searchParams.get("role"); // Check if it's for chairperson
  const redirectParam = searchParams.get("redirect");
  
  // Determine redirect URL based on role
  const redirectTo = redirectParam || (role === "chairperson" ? "/rec/chairperson" : "/rec/proponent/dashboard");

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Store redirect URL in localStorage for post-auth redirect
  useEffect(() => {
    if (redirectTo) {
      localStorage.setItem('auth-redirect', redirectTo);
      // Also store role if specified
      if (role) {
        localStorage.setItem('auth-role', role);
      }
    }
  }, [redirectTo, role]);



  const clearFormError = () => {
    setFormError(null);
  };

  const handleCheckEmailVerification = async () => {
    setIsCheckingVerification(true);
    await checkEmailVerification();
    setIsCheckingVerification(false);
  };

  const handleResendVerification = async () => {
    try {
      setResendEmailStatus("Sending...");
      await sendEmailVerification();
      setResendEmailStatus("Email sent! Check your inbox.");
      // Clear the status after 3 seconds
      setTimeout(() => {
        setResendEmailStatus(null);
      }, 3000);
    } catch {
      setResendEmailStatus("Failed to send email. Please try again.");
      setTimeout(() => {
        setResendEmailStatus(null);
      }, 3000);
    }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    clearFormError();
    
    // Basic validation
    if (!email.trim()) {
      setFormError("Please enter your email address.");
      return;
    }
    
    if (!password.trim()) {
      setFormError("Please enter your password.");
      return;
    }
    
    if (isSignUp) {
      if (password.length < 6) {
        setFormError("Password must be at least 6 characters long.");
        return;
      }
      
      if (password !== confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
      
      await signUpWithEmailAndPassword(email, password);
    } else {
      await signInWithEmailAndPassword(email, password);
    }
    
    // Redirect will be handled by the auth state change
  };

  const handleGoogleSignIn = async () => {
    clearError();
    await signInWithGoogle();
  };


  const handlePasswordReset = async () => {
    if (!email) {
      return;
    }
    clearError();
    await sendPasswordResetEmail(email);
    setResetEmailSent(true);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleEmailPasswordSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <Image 
                  src={mounted && theme === "dark" ? "/SPUP-REC-logo-light.png" : "/SPUP-REC-logo-dark.png"} 
                  alt="SPUP REC Logo" 
                  width={200} 
                  height={200} 
                  className="mb-4"
                  priority
                />
                <h1 className="text-2xl font-bold">
                  {isSignUp ? "Create Account" : "Welcome back"}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {isSignUp 
                    ? "Sign up for your REC Proponent account" 
                    : "Sign in to your REC Proponent account"
                  }
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                    {error.includes("invalid-credential") && (
                      <div className="mt-2 text-sm">
                        <p><strong>Troubleshooting tips:</strong></p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Double-check your email and password</li>
                          <li>Make sure you have an account - try signing up if this is your first time</li>
                          <li>If you signed up with Google, use that button instead</li>
                          <li>Try resetting your password if you forgot it</li>
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              {resetEmailSent && (
                <Alert>
                  <AlertDescription>
                    Password reset email sent! Check your inbox.
                  </AlertDescription>
                </Alert>
              )}
              
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFormError();
                  }}
                  required
                />
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="ml-auto text-sm underline-offset-2 hover:underline"
                      disabled={!email || loading}
                    >
                      Forgot your password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFormError();
                    }}
                    required 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {isSignUp && (
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearFormError();
                      }}
                      required 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
              </Button>
              
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="20"
                    height="20"
                    viewBox="0 0 48 48"
                    className="mr-2"
                  >
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                  </svg>
                  {isSignUp ? "Sign up with Google" : "Sign in with Google"}
                </Button>
              </div>
              
              <div className="text-center text-sm">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </div>
            </div>
          </form>

          <div className="relative hidden md:block">
            <div className="bg-primary absolute inset-0 h-full w-full"></div>
            <Image
              src="/heroimage.jpeg"
              alt="SPUP Campus"
              fill
              priority
              sizes="(max-width: 768px) 0vw, 50vw"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Verification Dialog */}
      <CustomDialog
  title={
    emailVerificationStatus === "pending"
      ? "Verify Your Email"
      : "Email Verified Successfully"
  }
  description={
    emailVerificationStatus === "pending"
      ? "Please verify your email to continue"
      : "Your account is now verified"
  }
  trigger={<div style={{ display: "none" }} />}
  open={showEmailVerificationDialog}
  onOpenChange={(open) => {
    if (!open) {
      closeEmailVerificationDialog();
      setResendEmailStatus(null);
    }
  }}
>
  <div className="space-y-5 p-4">
    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold">
        {emailVerificationStatus === "pending"
          ? "Check Your Email"
          : "You're All Set!"}
      </h3>

      <p className="text-sm text-muted-foreground">
        {emailVerificationStatus === "pending" ? (
          <>
            We’ve sent a verification link to:
            <br />
            <span className="font-medium text-primary">{verificationEmail}</span>
            <br />
            Please open the email and click the link to activate your account.
          </>
        ) : (
          "Your email has been successfully verified. You’ll be redirected to your dashboard shortly."
        )}
      </p>
    </div>

    {emailVerificationStatus === "pending" && (
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleCheckEmailVerification}
          disabled={isCheckingVerification}
          className="w-full"
        >
          {isCheckingVerification ? "Checking..." : "I've Verified My Email"}
        </Button>

        <Button
          variant="outline"
          onClick={handleResendVerification}
          className="w-full"
          disabled={resendEmailStatus === "Sending..."}
        >
          {resendEmailStatus === "Sending..."
            ? "Resending..."
            : "Resend Verification Email"}
        </Button>

        {resendEmailStatus && (
          <p
            className={`text-center text-sm ${
              resendEmailStatus.includes("Failed")
                ? "text-destructive"
                : "text-green-600"
            }`}
          >
            {resendEmailStatus}
          </p>
        )}

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p className="font-medium">Trouble finding the email?</p>
          <p>• Check your spam or junk folder</p>
          <p>• It may take a few minutes to arrive</p>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            closeEmailVerificationDialog();
            setResendEmailStatus(null);
          }}
          className="w-full mt-1"
        >
          Close
        </Button>
      </div>
    )}

    {emailVerificationStatus === "verified" && (
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          ✨ Redirecting to your dashboard...
        </p>
        <div className="flex justify-center">
          <LoadingSimple size="md" showText={false} />
        </div>
      </div>
    )}
  </div>
</CustomDialog>

      
      <div className="text-neutral-300 *:[a]:hover:text-secondary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link>{" "}
        and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </div>
    </div>
  );
}
