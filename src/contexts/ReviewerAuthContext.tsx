'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { reviewerAuthService, ReviewerAuthData } from '@/lib/services/reviewers/reviewerAuthService';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';

const db = getFirestore(firebaseApp);

interface ReviewerAuthContextType {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  reviewer: ReviewerAuthData | null;
  assignedProtocols: any[];
  error: string | null;

  // Actions
  authenticate: (code: string) => Promise<boolean>;
  logout: () => void;
  refreshAssignedProtocols: () => Promise<void>;
}

const ReviewerAuthContext = createContext<ReviewerAuthContextType | undefined>(undefined);

export function ReviewerAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewer, setReviewer] = useState<ReviewerAuthData | null>(null);
  const [assignedProtocols, setAssignedProtocols] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load saved authentication state on mount
  useEffect(() => {
    const savedReviewerId = localStorage.getItem('reviewerId');
    if (savedReviewerId) {
      loadReviewerData(savedReviewerId);
    }
  }, []);

  // Load reviewer data and assigned protocols
  const loadReviewerData = useCallback(async (reviewerId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const reviewerData = await reviewerAuthService.getReviewerById(reviewerId);
      
      if (reviewerData && reviewerData.isActive) {
        setReviewer(reviewerData);
        setIsAuthenticated(true);
        
        // Load assigned protocols and reassigned protocols
        const [protocols, reassignedProtocols] = await Promise.all([
          reviewerAuthService.getAssignedProtocols(reviewerId),
          reviewerAuthService.getReassignedProtocols(reviewerId)
        ]);
        
        // Mark reassigned protocols with 'reassigned' status
        const reassignedWithStatus = reassignedProtocols.map((p: any) => ({
          ...p,
          status: 'reassigned'
        }));
        
        // Merge both arrays
        setAssignedProtocols([...protocols, ...reassignedWithStatus]);
      } else {
        // Reviewer not found or inactive, clear saved state
        localStorage.removeItem('reviewerId');
        setIsAuthenticated(false);
        setReviewer(null);
        setAssignedProtocols([]);
      }
    } catch (error) {
      console.error('Error loading reviewer data:', error);
      setError('Failed to load reviewer data');
      setIsAuthenticated(false);
      setReviewer(null);
      setAssignedProtocols([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time listener for assessment form changes
  useEffect(() => {
    if (!reviewer?.id || !isAuthenticated) return;

    const unsubscribeFunctions: (() => void)[] = [];

    // Listen to all protocols where this reviewer is assigned
    const protocolsRef = collection(db, 'submissions');
    
    // Get all protocols first, then set up listeners for each
    getDocs(protocolsRef).then((protocolsSnapshot) => {
      protocolsSnapshot.docs.forEach((protocolDoc) => {
        const protocolId = protocolDoc.id;
        const reviewersRef = collection(db, 'submissions', protocolId, 'reviewers');
        
        // Listen to reviewer assignments
        const unsubscribeReviewers = onSnapshot(reviewersRef, async (reviewersSnapshot) => {
          const reviewerAssignment = reviewersSnapshot.docs.find(
            doc => doc.data().reviewerId === reviewer.id
          );

          if (reviewerAssignment) {
            const assignmentId = reviewerAssignment.id;
            const assessmentFormsRef = collection(
              db, 
              'submissions', 
              protocolId, 
              'reviewers', 
              assignmentId, 
              'assessment_forms'
            );
            
            // Listen to assessment form changes
            const unsubscribeForms = onSnapshot(assessmentFormsRef, async () => {
              // Reload protocols when assessment status changes
              const [protocols, reassignedProtocols] = await Promise.all([
                reviewerAuthService.getAssignedProtocols(reviewer.id),
                reviewerAuthService.getReassignedProtocols(reviewer.id)
              ]);
              
              const reassignedWithStatus = reassignedProtocols.map((p: any) => ({
                ...p,
                status: 'reassigned'
              }));
              
              setAssignedProtocols([...protocols, ...reassignedWithStatus]);
            });
            
            unsubscribeFunctions.push(unsubscribeForms);
          }
        });
        
        unsubscribeFunctions.push(unsubscribeReviewers);
      });
    });

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [reviewer?.id, isAuthenticated]);

  // Authenticate with reviewer code
  const authenticate = useCallback(async (code: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await reviewerAuthService.validateReviewerCode(code);
      
      if (result.success && result.reviewer) {
        setReviewer(result.reviewer);
        setIsAuthenticated(true);
        
        // Save reviewer ID to localStorage for persistence
        localStorage.setItem('reviewerId', result.reviewer.id);
        
        // Load assigned protocols and reassigned protocols
        const [protocols, reassignedProtocols] = await Promise.all([
          reviewerAuthService.getAssignedProtocols(result.reviewer.id),
          reviewerAuthService.getReassignedProtocols(result.reviewer.id)
        ]);
        
        // Mark reassigned protocols with 'reassigned' status
        const reassignedWithStatus = reassignedProtocols.map((p: any) => ({
          ...p,
          status: 'reassigned'
        }));
        
        // Merge both arrays
        setAssignedProtocols([...protocols, ...reassignedWithStatus]);
        
        return true;
      } else {
        setError(result.error || 'Authentication failed');
        return false;
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      setError('Authentication failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout and clear state
  const logout = useCallback(() => {
    localStorage.removeItem('reviewerId');
    setIsAuthenticated(false);
    setReviewer(null);
    setAssignedProtocols([]);
    setError(null);
  }, []);

  // Refresh assigned protocols
  const refreshAssignedProtocols = useCallback(async () => {
    if (!reviewer) return;

    try {
      setIsLoading(true);
      const protocols = await reviewerAuthService.getAssignedProtocols(reviewer.id);
      setAssignedProtocols(protocols);
    } catch (error) {
      console.error('Error refreshing assigned protocols:', error);
      setError('Failed to refresh assigned protocols');
    } finally {
      setIsLoading(false);
    }
  }, [reviewer]);

  const value: ReviewerAuthContextType = {
    isAuthenticated,
    isLoading,
    reviewer,
    assignedProtocols,
    error,
    authenticate,
    logout,
    refreshAssignedProtocols,
  };

  return (
    <ReviewerAuthContext.Provider value={value}>
      {children}
    </ReviewerAuthContext.Provider>
  );
}

export function useReviewerAuthContext() {
  const context = useContext(ReviewerAuthContext);
  if (context === undefined) {
    throw new Error('useReviewerAuthContext must be used within a ReviewerAuthProvider');
  }
  return context;
}
