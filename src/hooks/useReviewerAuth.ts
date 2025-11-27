import { useState, useEffect, useCallback } from 'react';
import { reviewerAuthService, ReviewerAuthData } from '@/lib/services/reviewers/reviewerAuthService';

interface UseReviewerAuthReturn {
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

export function useReviewerAuth(): UseReviewerAuthReturn {
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
        
        // Load assigned protocols
        const protocols = await reviewerAuthService.getAssignedProtocols(reviewerId);
        setAssignedProtocols(protocols);
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
        
        // Load assigned protocols
        const protocols = await reviewerAuthService.getAssignedProtocols(result.reviewer.id);
        setAssignedProtocols(protocols);
        
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

  return {
    isAuthenticated,
    isLoading,
    reviewer,
    assignedProtocols,
    error,
    authenticate,
    logout,
    refreshAssignedProtocols
  };
}
