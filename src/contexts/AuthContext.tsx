"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  User as FirebaseUser,
  AuthError
} from "firebase/auth";
import { customToast } from "@/components/ui/custom/toast";
import firebaseApp from "@/lib/firebaseConfig";
import { AuthContextType, User, convertFirebaseUser } from "@/types/auth.types";

const auth = getAuth(firebaseApp);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>("");
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<'pending' | 'verified'>('pending');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const user = convertFirebaseUser(firebaseUser);
        setUser(user);
        
        // Handle post-authentication redirect for verified users
        if (user.emailVerified) {
          const redirectUrl = localStorage.getItem('auth-redirect');
          if (redirectUrl) {
            localStorage.removeItem('auth-redirect');
            // Only redirect if we're currently on the auth page
            if (window.location.pathname.includes('/auth/signin')) {
              window.location.href = redirectUrl;
            }
          }
        }
      } else {
        setUser(null);
        // Don't redirect on sign out - let the signOut function handle it
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthError = (error: AuthError) => {
    let title = "Authentication Error";
    let description = "";
    
    switch (error.code) {
      case "auth/invalid-credential":
        title = "Invalid Credentials";
        description = "Invalid email or password. Please check your credentials and try again.";
        break;
      case "auth/user-not-found":
        title = "User Not Found";
        description = "No account found with this email address.";
        break;
      case "auth/wrong-password":
        title = "Incorrect Password";
        description = "The password you entered is incorrect.";
        break;
      case "auth/invalid-email":
        title = "Invalid Email";
        description = "Please enter a valid email address.";
        break;
      case "auth/user-disabled":
        title = "Account Disabled";
        description = "This account has been disabled.";
        break;
      case "auth/too-many-requests":
        title = "Too Many Attempts";
        description = "Too many failed attempts. Please try again later.";
        break;
      case "auth/email-already-in-use":
        title = "Email Already in Use";
        description = "An account with this email already exists.";
        break;
      case "auth/weak-password":
        title = "Weak Password";
        description = "Password should be at least 6 characters.";
        break;
      case "auth/operation-not-allowed":
        title = "Operation Not Allowed";
        description = "This sign-in method is not enabled.";
        break;
      case "auth/popup-closed-by-user":
        title = "Sign-in Cancelled";
        description = "Sign-in popup was closed before completion.";
        break;
      case "auth/cancelled-popup-request":
        title = "Sign-in Cancelled";
        description = "Sign-in request was cancelled.";
        break;
      case "auth/network-request-failed":
        title = "Network Error";
        description = "Please check your internet connection and try again.";
        break;
      case "auth/internal-error":
        title = "Internal Error";
        description = "An internal error occurred. Please try again later.";
        break;
      default:
        title = "Authentication Error";
        description = error.message;
    }
    
    customToast.error(title, description);
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      customToast.success("Sign In Successful", "Welcome back! You have been signed in successfully.");
      
      // Redirect after successful sign-in
      setTimeout(() => {
        const redirectUrl = localStorage.getItem('auth-redirect') || '/rec/proponent/dashboard';
        if (redirectUrl !== '/rec/proponent/dashboard') {
          localStorage.removeItem('auth-redirect');
        }
        window.location.href = redirectUrl;
      }, 1000);
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new OAuthProvider("microsoft.com");
      await signInWithPopup(auth, provider);
      customToast.success("Sign In Successful", "Welcome back! You have been signed in successfully.");
      
      // Redirect after successful sign-in
      setTimeout(() => {
        const redirectUrl = localStorage.getItem('auth-redirect') || '/rec/proponent/dashboard';
        if (redirectUrl !== '/rec/proponent/dashboardt') {
          localStorage.removeItem('auth-redirect');
        }
        window.location.href = redirectUrl;
      }, 1000);
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmailAndPassword = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified for email/password sign-in
      if (userCredential.user.emailVerified) {
        customToast.success("Sign In Successful", "Welcome back! You have been signed in successfully.");
        
        // Redirect after successful sign-in
        setTimeout(() => {
          const redirectUrl = localStorage.getItem('auth-redirect') || '/dashboard/proponent';
          if (redirectUrl !== '/dashboard/proponent') {
            localStorage.removeItem('auth-redirect');
          }
          window.location.href = redirectUrl;
        }, 1000);
      } else {
        // Show email verification dialog for unverified users
        setVerificationEmail(email);
        setEmailVerificationStatus('pending');
        setShowEmailVerificationDialog(true);
      }
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmailAndPassword = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await firebaseSendEmailVerification(userCredential.user);
      
      // Show email verification dialog instead of redirecting
      setVerificationEmail(email);
      setEmailVerificationStatus('pending');
      setShowEmailVerificationDialog(true);
      
      // Don't show toast - dialog will handle the messaging
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    try {
      if (auth.currentUser) {
        // Reload user data from Firebase
        await auth.currentUser.reload();
        
        // Get the updated user
        const updatedUser = auth.currentUser;
        
        if (updatedUser.emailVerified) {
          setEmailVerificationStatus('verified');
          setUser(convertFirebaseUser(updatedUser));
          
          // Don't show toast - dialog will handle the success messaging
          
          // Auto-close dialog and redirect after a short delay
          setTimeout(() => {
            setShowEmailVerificationDialog(false);
            const redirectUrl = localStorage.getItem('auth-redirect') || '/rec/proponent/dashboard';
            if (redirectUrl !== '/rec/proponent/dashboard') {
              localStorage.removeItem('auth-redirect');
            }
            window.location.href = redirectUrl;
          }, 2000);
          
          return true;
        } else {
          // Don't show toast - let the dialog handle the error messaging
          return false;
        }
      }
      return false;
    } catch (error) {
      handleAuthError(error as AuthError);
      return false;
    }
  };

  
  const signOut = async () => {
    // Show confirmation toast with action buttons
    customToast.confirm(
      "Sign Out Confirmation",
      "Are you sure you want to sign out?",
      async () => {
        // User confirmed - proceed with sign out
        try {
          setLoading(true);
          setError(null);
          await firebaseSignOut(auth);
          window.location.href = '/rec/proponent';
        } catch (error) {
          handleAuthError(error as AuthError);
        } finally {
          setLoading(false);
        }
      },
      () => {
        // User cancelled - do nothing
        console.log("Sign out cancelled");
      },
      "Yes, Sign Out"
    );
  };

  const sendEmailVerification = async () => {
    try {
      if (auth.currentUser) {
        setError(null);
        await firebaseSendEmailVerification(auth.currentUser);
        // Only show toast when not in dialog flow (for standalone resend requests)
        if (!showEmailVerificationDialog) {
          customToast.success("Verification Email Sent", "A new verification email has been sent to your inbox.");
        }
      }
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      setError(null);
      await firebaseSendPasswordResetEmail(auth, email);
      customToast.success("Password Reset Email Sent", "Please check your email for password reset instructions.");
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const closeEmailVerificationDialog = () => {
    setShowEmailVerificationDialog(false);
    setEmailVerificationStatus('pending');
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    clearError,
    // Email verification dialog state
    showEmailVerificationDialog,
    verificationEmail,
    emailVerificationStatus,
    checkEmailVerification,
    closeEmailVerificationDialog,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
