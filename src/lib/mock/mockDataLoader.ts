/**
 * Mock Data Loader Utility
 * 
 * This utility helps load mock data into the application for testing purposes.
 * Use this to visualize all possible states without breaking existing functionality.
 */

import { allMockSubmissions, mockByStatus, mockByResearchType, mockByDecision } from './mockSubmissions';
import { Timestamp } from 'firebase/firestore';

/**
 * Convert mock submission to Firestore-compatible format
 * This ensures all timestamps are properly formatted
 */
export const formatMockSubmissionForFirestore = (mockSubmission: any) => {
  return {
    ...mockSubmission,
    createdAt: mockSubmission.createdAt || Timestamp.now(),
    updatedAt: mockSubmission.updatedAt || Timestamp.now(),
    acceptedAt: mockSubmission.acceptedAt ? Timestamp.fromDate(mockSubmission.acceptedAt.toDate()) : undefined,
    approvedAt: mockSubmission.approvedAt ? Timestamp.fromDate(mockSubmission.approvedAt.toDate()) : undefined,
    archivedAt: mockSubmission.archivedAt ? Timestamp.fromDate(mockSubmission.archivedAt.toDate()) : undefined,
    decisionDate: mockSubmission.decisionDate ? Timestamp.fromDate(mockSubmission.decisionDate.toDate()) : undefined,
    assignedAt: mockSubmission.assignedAt ? Timestamp.fromDate(mockSubmission.assignedAt.toDate()) : undefined,
    reviewers: mockSubmission.reviewers?.map((reviewer: any) => ({
      ...reviewer,
      assignedAt: reviewer.assignedAt ? Timestamp.fromDate(reviewer.assignedAt.toDate()) : Timestamp.now(),
      deadline: reviewer.deadline ? Timestamp.fromDate(reviewer.deadline.toDate()) : Timestamp.now()
    }))
  };
};

/**
 * Get mock submissions by status
 */
export const getMockSubmissionsByStatus = (status: string) => {
  return mockByStatus[status as keyof typeof mockByStatus] || [];
};

/**
 * Get mock submissions by research type
 */
export const getMockSubmissionsByResearchType = (researchType: string) => {
  return mockByResearchType[researchType as keyof typeof mockByResearchType] 
    ? [mockByResearchType[researchType as keyof typeof mockByResearchType]]
    : [];
};

/**
 * Get mock submissions by decision type
 */
export const getMockSubmissionsByDecision = (decision: string) => {
  return mockByDecision[decision as keyof typeof mockByDecision]
    ? [mockByDecision[decision as keyof typeof mockByDecision]]
    : [];
};

/**
 * Get all mock submissions formatted for Firestore
 */
export const getAllFormattedMockSubmissions = () => {
  return allMockSubmissions.map(formatMockSubmissionForFirestore);
};

/**
 * Get a specific mock submission by ID
 */
export const getMockSubmissionById = (id: string) => {
  return allMockSubmissions.find(sub => sub.id === id || sub.applicationID === id);
};

/**
 * Get mock submissions for a specific user (for proponent dashboard)
 */
export const getMockSubmissionsForUser = (userId: string) => {
  return allMockSubmissions
    .filter(sub => sub.submitBy === userId)
    .map(formatMockSubmissionForFirestore);
};

/**
 * Get mock submissions summary (counts by status)
 */
export const getMockSubmissionsSummary = () => {
  return {
    total: allMockSubmissions.length,
    byStatus: {
      pending: mockByStatus.pending.length,
      accepted: mockByStatus.accepted.length,
      approved: mockByStatus.approved.length,
      archived: mockByStatus.archived.length,
      draft: mockByStatus.draft.length
    },
    byResearchType: {
      SR: 1,
      PR: 1,
      HO: 1,
      BS: 1,
      EX: 1
    },
    byDecision: {
      approved: 1,
      approved_minor_revisions: 1,
      major_revisions_deferred: 1,
      disapproved: 1,
      deferred: 1
    }
  };
};

