"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  getAuth, 
  signInWithPopup,
  getRedirectResult,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  User as FirebaseUser,
  AuthError
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { customToast } from "@/components/ui/custom/toast";
import firebaseApp from "@/lib/firebaseConfig";
import { AuthContextType, User, convertFirebaseUser } from "@/types";

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

  const handleAuthError = (error: AuthError, isOAuth: boolean = false) => {
    // Log full error for debugging
    console.error("Authentication Error:", {
      code: error.code,
      message: error.message,
      isOAuth,
      fullError: error
    });
    
    let title = "Authentication Error";
    let description = "";
    
    switch (error.code) {
      case "auth/invalid-credential":
        if (isOAuth) {
          title = "OAuth Authentication Failed";
          description = "OAuth sign-in failed. Please try again or use a different sign-in method.";
        } else {
          title = "Invalid Credentials";
          description = "Invalid email or password. Please check your credentials and try again.";
        }
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
        title = "OAuth Sign-in Not Enabled";
        description = "OAuth sign-in is not enabled. Please contact the administrator or check Firebase console settings.";
        break;
      case "auth/popup-closed-by-user":
        title = "Sign-in Cancelled";
        description = "Sign-in popup was closed before completion.";
        break;
      case "auth/cancelled-popup-request":
        title = "Sign-in Cancelled";
        description = "Sign-in request was cancelled.";
        break;
      case "auth/popup-blocked":
        title = "Popup Blocked";
        description = "Please allow popups for this site and try again.";
        break;
      case "auth/network-request-failed":
        title = "Network Error";
        description = "Please check your internet connection and try again.";
        break;
      case "auth/internal-error":
        title = "Internal Error";
        description = "An internal error occurred. Please try again later.";
        break;
      case "auth/account-exists-with-different-credential":
        title = "Account Exists with Different Provider";
        description = "An account with this email already exists using a different sign-in method. Please use the original sign-in method.";
        break;
      case "auth/unauthorized-domain":
        title = "Unauthorized Domain";
        description = "This domain is not authorized for authentication. Please contact the administrator.";
        break;
      case "auth/configuration-not-found":
        title = "OAuth Configuration Error";
        description = "OAuth authentication is not properly configured. Please check Firebase console settings.";
        break;
      default:
        title = "Authentication Error";
        description = error.message || "An unexpected error occurred. Please try again.";
    }
    
    setError(description);
    customToast.error(title, description);
  };

  useEffect(() => {
    let isRedirectHandled = false;
    
    // Handle OAuth redirect result (for Google redirect flow)
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        
        if (result) {
          isRedirectHandled = true;
          setLoading(false);
          
          // User signed in via redirect
          const user = convertFirebaseUser(result.user);
          setUser(user);
          
          // Check if this is a new user (sign-up) or existing user (sign-in)
          const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
          
          if (isNewUser) {
            customToast.success(
              "Account Created Successfully", 
              "Your account has been created! Welcome to REC Proponent."
            );
          } else {
            customToast.success(
              "Sign In Successful", 
              "Welcome back! You have been signed in successfully."
            );
          }
          
          // Redirect after successful sign-in
          setTimeout(() => {
            const redirectUrl = localStorage.getItem('auth-redirect') || '/rec/proponent/dashboard';
            if (redirectUrl !== '/rec/proponent/dashboard') {
              localStorage.removeItem('auth-redirect');
            }
            window.location.href = redirectUrl;
          }, 1000);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Redirect result error:", error);
        isRedirectHandled = true;
        setLoading(false);
        const authError = error as AuthError;
        handleAuthError(authError, true);
      }
    };

    // Handle redirect result first
    handleRedirectResult();

    // Then set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const user = convertFirebaseUser(firebaseUser);
        
        // Only update user state if we haven't already handled a redirect
        // This prevents race conditions between redirect result and auth state change
        if (!isRedirectHandled) {
          setUser(user);
        }
        
        // Handle post-authentication redirect for verified users (only if not from redirect flow)
        if (!isRedirectHandled && user.emailVerified) {
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
      
      // Only set loading to false if we're not handling a redirect
      if (!isRedirectHandled) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      // Check if this is a new user (sign-up) or existing user (sign-in)
      const isNewUser = !auth.currentUser?.metadata?.creationTime || 
        (auth.currentUser?.metadata?.lastSignInTime && 
         auth.currentUser.metadata.creationTime === auth.currentUser.metadata.lastSignInTime);
      
      if (isNewUser) {
        customToast.success(
          "Account Created Successfully", 
          "Your account has been created with Google! Welcome to REC Proponent."
        );
      } else {
        customToast.success(
          "Sign In Successful", 
          "Welcome back! You have been signed in successfully with Google."
        );
      }
      
      // Redirect after successful sign-in
      setTimeout(() => {
        const redirectUrl = localStorage.getItem('auth-redirect') || '/rec/proponent/dashboard';
        if (redirectUrl !== '/rec/proponent/dashboard') {
          localStorage.removeItem('auth-redirect');
        }
        window.location.href = redirectUrl;
      }, 1000);
    } catch (error) {
      handleAuthError(error as AuthError, true); // true = OAuth error
    } finally {
      setLoading(false);
    }
  };


  const signInWithEmailAndPassword = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const authRole = localStorage.getItem('auth-role');
      const isChairperson = email === 'rec@spup.edu.ph' || authRole === 'chairperson';
      
      let userCredential;
      
      try {
        // Try to sign in
        userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
      } catch (signInError: any) {
        // If account doesn't exist and it's the chairperson, create it
        if ((signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') && isChairperson && email === 'rec@spup.edu.ph') {
          try {
            // Create the chairperson account
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Send email verification (optional, but good practice)
            try {
              await firebaseSendEmailVerification(userCredential.user);
            } catch (verifyError) {
              console.warn('⚠️ Could not send verification email:', verifyError);
            }
            
            // Sign in with the newly created account
            userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
          } catch (createError: any) {
            console.error('❌ Failed to create chairperson account:', createError);
            handleAuthError(createError as AuthError);
            return;
          }
        } else {
          // For other errors, throw to be handled by catch block
          throw signInError;
        }
      }
      
      // Check if email is verified for email/password sign-in
      // Chairperson can sign in even if email is not verified (system account)
      if (userCredential.user.emailVerified || isChairperson) {
        // Create chairperson settings document if it doesn't exist
        if (isChairperson && userCredential.user.email === 'rec@spup.edu.ph') {
          try {
            const db = getFirestore(firebaseApp);
            const userId = userCredential.user.uid;
            const recSettingsRef = doc(db, 'rec_settings', userId);
            const recSettingsDoc = await getDoc(recSettingsRef);
            
            if (!recSettingsDoc.exists()) {
              await setDoc(recSettingsRef, {
                initialized: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          } catch (error) {
            console.warn('⚠️ Could not create chairperson settings document:', error);
            // Don't block sign-in if this fails
          }
        }
        
        customToast.success(
          "Sign In Successful", 
          "Welcome back! You have been signed in successfully."
        );
        
        // Redirect after successful sign-in
        setTimeout(async () => {
          const redirectUrl = localStorage.getItem('auth-redirect') || '/rec/proponent/dashboard';
          const authRole = localStorage.getItem('auth-role');
          
          // If chairperson role, verify email matches before redirecting
          if (authRole === 'chairperson' && userCredential.user.email !== 'rec@spup.edu.ph') {
            customToast.error(
              "Access Denied",
              "This account is not authorized to access the chairperson portal."
            );
            await firebaseSignOut(auth);
            // Clear redirect and role from localStorage
            localStorage.removeItem('auth-redirect');
            localStorage.removeItem('auth-role');
            return;
          }
          
          // Clear redirect and role from localStorage
          localStorage.removeItem('auth-redirect');
          localStorage.removeItem('auth-role');
          
          window.location.href = redirectUrl;
        }, 1000);
      } else {
        // Show error message for unverified email (only for non-chairperson)
        customToast.error(
          "Email Not Verified", 
          "Please verify your email address before signing in. Check your inbox for the verification link."
        );
        
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
      
      // Show success message for account creation
      customToast.success(
        "Account Created Successfully", 
        "Your account has been created! Please verify your email to continue."
      );
      
      // Show email verification dialog
      setVerificationEmail(email);
      setEmailVerificationStatus('pending');
      setShowEmailVerificationDialog(true);
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
          
          // Show success message for email verification
          customToast.success(
            "Email Verified Successfully", 
            "Your email has been verified! Redirecting to your dashboard..."
          );
          
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
          // Email not verified yet - show error message
          customToast.error(
            "Email Not Verified", 
            "Your email has not been verified yet. Please check your inbox and click the verification link."
          );
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
