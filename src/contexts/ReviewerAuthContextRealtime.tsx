'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { reviewerAuthService, ReviewerAuthData } from '@/lib/services/reviewers/reviewerAuthService';
import { useFirestoreQuery } from '@/hooks/useFirestore';

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
  const [error, setError] = useState<string | null>(null);

  // Realtime query for reviewer assignments
  const reviewerAssignmentsQuery = useFirestoreQuery("reviewer_assignments", {
    where: [{ field: "reviewerId", operator: "==", value: reviewer?.id || "" }]
  });

  // Realtime query for accepted protocols (where reviewers are assigned)
  const acceptedProtocolsQuery = useFirestoreQuery("submissions", {
    where: [{ field: "reviewerId", operator: "==", value: reviewer?.id || "" }]
  });

  // Realtime query for approved protocols
  const approvedProtocolsQuery = useFirestoreQuery("submissions_approved", {
    where: [{ field: "reviewerId", operator: "==", value: reviewer?.id || "" }]
  });

  // Combine all assigned protocols with realtime updates
  const assignedProtocols = useMemo(() => {
    if (!reviewer) return [];

    const allProtocols: any[] = [];

    // Add protocols from reviewer assignments
    if (reviewerAssignmentsQuery.data) {
      reviewerAssignmentsQuery.data.forEach((assignment) => {
        allProtocols.push({
          ...assignment,
          status: assignment.reviewStatus || 'pending',
          collection: 'assigned',
          createdAt: assignment.assignedAt && typeof assignment.assignedAt === 'object' && 'toDate' in assignment.assignedAt && typeof assignment.assignedAt.toDate === 'function' ? assignment.assignedAt.toDate().toISOString() : assignment.assignedAt,
          updatedAt: assignment.updatedAt && typeof assignment.updatedAt === 'object' && 'toDate' in assignment.updatedAt && typeof assignment.updatedAt.toDate === 'function' ? assignment.updatedAt.toDate().toISOString() : assignment.updatedAt,
        });
      });
    }

    // Add accepted protocols
    if (acceptedProtocolsQuery.data) {
      acceptedProtocolsQuery.data.forEach((protocol) => {
        allProtocols.push({
          ...protocol,
          status: 'accepted',
          collection: 'accepted',
          createdAt: protocol.createdAt && typeof protocol.createdAt === 'object' && 'toDate' in protocol.createdAt && typeof protocol.createdAt.toDate === 'function' ? protocol.createdAt.toDate().toISOString() : protocol.createdAt,
          updatedAt: protocol.updatedAt && typeof protocol.updatedAt === 'object' && 'toDate' in protocol.updatedAt && typeof protocol.updatedAt.toDate === 'function' ? protocol.updatedAt.toDate().toISOString() : protocol.updatedAt,
        });
      });
    }

    // Add approved protocols
    if (approvedProtocolsQuery.data) {
      approvedProtocolsQuery.data.forEach((protocol) => {
        allProtocols.push({
          ...protocol,
          status: 'approved',
          collection: 'approved',
          createdAt: protocol.createdAt && typeof protocol.createdAt === 'object' && 'toDate' in protocol.createdAt && typeof protocol.createdAt.toDate === 'function' ? protocol.createdAt.toDate().toISOString() : protocol.createdAt,
          updatedAt: protocol.updatedAt && typeof protocol.updatedAt === 'object' && 'toDate' in protocol.updatedAt && typeof protocol.updatedAt.toDate === 'function' ? protocol.updatedAt.toDate().toISOString() : protocol.updatedAt,
        });
      });
    }

    // Sort by creation date (newest first)
    return allProtocols.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [reviewer, reviewerAssignmentsQuery.data, acceptedProtocolsQuery.data, approvedProtocolsQuery.data]);

  // Load saved authentication state on mount
  useEffect(() => {
    const savedReviewerId = localStorage.getItem('reviewerId');
    if (savedReviewerId) {
      loadReviewerData(savedReviewerId);
    }
  }, []);

  // Load reviewer data
  const loadReviewerData = useCallback(async (reviewerId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const reviewerData = await reviewerAuthService.getReviewerById(reviewerId);
      
      if (reviewerData && reviewerData.isActive) {
        setReviewer(reviewerData);
        setIsAuthenticated(true);
      } else {
        // Reviewer not found or inactive, clear saved state
        localStorage.removeItem('reviewerId');
        setIsAuthenticated(false);
        setReviewer(null);
      }
    } catch (error) {
      console.error('Error loading reviewer data:', error);
      setError('Failed to load reviewer data');
      setIsAuthenticated(false);
      setReviewer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    setError(null);
  }, []);

  // Refresh assigned protocols (now handled by realtime queries)
  const refreshAssignedProtocols = useCallback(async () => {
    // No-op since we're using realtime queries
    // The data will automatically update when Firestore changes
  }, []);

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
