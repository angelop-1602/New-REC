/**
 * Analytics Service
 * Core analytics calculations and data aggregation
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { SUBMISSIONS_COLLECTION } from '@/lib/firebase/firestore';
import {
  AnalyticsData,
  ProtocolMetrics,
  ProtocolTrend,
  ReviewerMetrics,
  ReviewerPerformance,
  ReviewProcessMetrics,
  SystemHealthMetrics,
  DateRange,
  AnalyticsFilters,
  ErrorTrend
} from '@/types/analytics.types';
import { 
  getErrorTrends, 
  getAnalyticsUsageStats, 
  getPerformanceMetrics 
} from './firebaseAnalyticsService';

/**
 * Get total reviewers count
 */
async function getTotalReviewersCount(): Promise<number> {
  try {
    const reviewersRef = collection(db, 'reviewers');
    const snapshot = await getDocs(reviewersRef);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting reviewers count:', error);
    return 0;
  }
}

/**
 * Get total users count
 */
async function getTotalUsersCount(): Promise<number> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting users count:', error);
    return 0;
  }
}

/**
 * Get error breakdown by type
 */
async function getErrorBreakdown(dateRange: DateRange): Promise<Record<string, number>> {
  try {
    const errorsRef = collection(db, 'analytics_errors');
    // Query all errors and filter by date in memory to avoid index requirement
    const q = query(errorsRef);
    
    const snapshot = await getDocs(q);
    const allErrors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Filter by date range in memory
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();
    const errors = allErrors.filter((error: any) => {
      const errorTime = error.timestamp?.toDate?.() || new Date(error.timestamp || 0);
      const errorTimeMs = errorTime.getTime();
      return errorTimeMs >= startTime && errorTimeMs <= endTime;
    });
    
    const breakdown: Record<string, number> = {};
    
    errors.forEach((error: any) => {
      const errorType = error.errorType || 'unknown';
      breakdown[errorType] = (breakdown[errorType] || 0) + 1;
    });
    
    return breakdown;
  } catch (error) {
    console.error('Error getting error breakdown:', error);
    return {};
  }
}
import { ChairpersonProtocol, toChairpersonProtocols, toDate } from '@/types';

const db = getFirestore(firebaseApp);

/**
 * Calculate protocol metrics
 */
export async function calculateProtocolMetrics(
  dateRange: DateRange,
  filters?: AnalyticsFilters
): Promise<ProtocolMetrics> {
  try {
    const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
    let q = query(submissionsRef);
    
    // Apply date filter
    if (dateRange.start) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(dateRange.start)));
    }
    if (dateRange.end) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(dateRange.end)));
    }
    
    const snapshot = await getDocs(q);
    const protocols = toChairpersonProtocols(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    // Apply filters
    let filteredProtocols = protocols;
    if (filters?.status && filters.status.length > 0) {
      filteredProtocols = filteredProtocols.filter(p => filters.status!.includes(p.status));
    }
    if (filters?.researchType && filters.researchType.length > 0) {
      filteredProtocols = filteredProtocols.filter(p => {
        const researchType = p.information?.researchType;
        return typeof researchType === 'string' && filters.researchType!.includes(researchType);
      });
    }
    
    const total = filteredProtocols.length;
    const byStatus = {
      pending: filteredProtocols.filter(p => p.status === 'pending').length,
      accepted: filteredProtocols.filter(p => p.status === 'accepted').length,
      approved: filteredProtocols.filter(p => p.status === 'approved').length,
      archived: filteredProtocols.filter(p => p.status === 'archived').length,
      rejected: filteredProtocols.filter(p => p.status === 'disapproved').length,
    };
    
    const byResearchType = {
      SR: filteredProtocols.filter(p => p.information?.researchType === 'SR').length,
      PR: filteredProtocols.filter(p => p.information?.researchType === 'PR').length,
      HO: filteredProtocols.filter(p => p.information?.researchType === 'HO').length,
      BS: filteredProtocols.filter(p => p.information?.researchType === 'BS').length,
      EX: filteredProtocols.filter(p => p.information?.researchType === 'EX').length,
    };
    
    // Calculate submission rate (per month)
    const daysDiff = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const monthsDiff = daysDiff / 30;
    const submissionRate = monthsDiff > 0 ? total / monthsDiff : total;
    
    // Calculate average times
    const submittedProtocols = filteredProtocols.filter(p => 
      p.status !== 'draft' && p.createdAt
    );
    
    let totalDaysToSubmission = 0;
    let totalDaysToApproval = 0;
    let approvedCount = 0;
    
    submittedProtocols.forEach(p => {
      // For submission time, use createdAt as baseline (protocols are created when submitted)
      if (p.createdAt) {
        const created = toDate(p.createdAt);
        // If there's an updatedAt that's different, use that as submission time
        const submitted = p.updatedAt ? toDate(p.updatedAt) : created;
        const days = (submitted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        totalDaysToSubmission += days;
      }
      
      if (p.status === 'approved' && p.createdAt && p.approvedAt) {
        const created = toDate(p.createdAt);
        const approved = toDate(p.approvedAt);
        const days = (approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        totalDaysToApproval += days;
        approvedCount++;
      }
    });
    
    const averageTimeToSubmission = submittedProtocols.length > 0 
      ? Math.round(totalDaysToSubmission / submittedProtocols.length) 
      : 0;
    
    const averageTimeToApproval = approvedCount > 0 
      ? Math.round(totalDaysToApproval / approvedCount) 
      : 0;
    
    // Completion rate (drafts that became submissions)
    const drafts = filteredProtocols.filter(p => p.status === 'draft').length;
    const completionRate = drafts + submittedProtocols.length > 0
      ? Math.round((submittedProtocols.length / (drafts + submittedProtocols.length)) * 100)
      : 0;
    
    return {
      total,
      byStatus,
      byResearchType,
      submissionRate: Math.round(submissionRate * 10) / 10,
      averageTimeToSubmission,
      averageTimeToApproval,
      completionRate,
    };
  } catch (error) {
    console.error('Error calculating protocol metrics:', error);
    throw error;
  }
}

/**
 * Calculate protocol trends over time
 */
export async function calculateProtocolTrends(
  dateRange: DateRange,
  filters?: AnalyticsFilters
): Promise<ProtocolTrend[]> {
  try {
    const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
    let q = query(submissionsRef);
    
    // Apply date filter
    if (dateRange.start) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(dateRange.start)));
    }
    if (dateRange.end) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(dateRange.end)));
    }
    
    const snapshot = await getDocs(q);
    const protocols = toChairpersonProtocols(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    // Apply filters
    let filteredProtocols = protocols;
    if (filters?.status && filters.status.length > 0) {
      filteredProtocols = filteredProtocols.filter(p => filters.status!.includes(p.status));
    }
    if (filters?.researchType && filters.researchType.length > 0) {
      filteredProtocols = filteredProtocols.filter(p => {
        const researchType = p.information?.researchType;
        return typeof researchType === 'string' && filters.researchType!.includes(researchType);
      });
    }
    
    // Group by month
    const trendsMap = new Map<string, { submissions: number; approvals: number; rejections: number }>();
    
    filteredProtocols.forEach(protocol => {
      if (!protocol.createdAt) return;
      
      const createdDate = toDate(protocol.createdAt);
      
      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!trendsMap.has(monthKey)) {
        trendsMap.set(monthKey, { submissions: 0, approvals: 0, rejections: 0 });
      }
      
      const trend = trendsMap.get(monthKey)!;
      trend.submissions++;
      
      if (protocol.status === 'approved') {
        trend.approvals++;
      } else if (protocol.status === 'disapproved') {
        trend.rejections++;
      }
    });
    
    // Convert to array and sort
    const trends: ProtocolTrend[] = Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date: `${date}-01`, // Add day for consistency
        submissions: data.submissions,
        approvals: data.approvals,
        rejections: data.rejections,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return trends;
  } catch (error) {
    console.error('Error calculating protocol trends:', error);
    return [];
  }
}

/**
 * Calculate reviewer metrics
 */
export async function calculateReviewerMetrics(
  dateRange: DateRange,
  filters?: AnalyticsFilters
): Promise<ReviewerMetrics> {
  try {
    // Get all reviewers
    const reviewersRef = collection(db, 'reviewers');
    const reviewersSnapshot = await getDocs(reviewersRef);
    
    const allReviewers = reviewersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; isActive?: boolean }>;
    
    const totalReviewers = allReviewers.length;
    const activeReviewers = allReviewers.filter(r => r.isActive !== false).length;
    
    // Get all protocol assignments
    const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
    const submissionsSnapshot = await getDocs(submissionsRef);
    
    const now = new Date();
    let totalAssignments = 0;
    let completedAssignments = 0;
    let pendingAssignments = 0;
    let overdueAssignments = 0;
    let totalCompletionTime = 0;
    let completionCount = 0;
    
    const reviewerAssignmentCounts: Record<string, number> = {};
    const reviewerCompletionTimes: Record<string, number[]> = {};
    
    // Iterate through all protocols to get reviewer assignments
    for (const protocolDoc of submissionsSnapshot.docs) {
      const protocolId = protocolDoc.id;
      const protocolData = protocolDoc.data();
      
      // Check if protocol is in date range
      const protocolDate = protocolData.createdAt?.toDate 
        ? protocolData.createdAt.toDate() 
        : new Date(protocolData.createdAt);
      
      if (protocolDate < dateRange.start || protocolDate > dateRange.end) {
        continue;
      }
      
      // Get reviewer assignments for this protocol
      try {
        const reviewersRef = collection(db, SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
        const assignmentsSnapshot = await getDocs(reviewersRef);
        
        assignmentsSnapshot.docs.forEach(assignmentDoc => {
          const assignment = assignmentDoc.data();
          const reviewerId = assignment.reviewerId;
          
          if (!reviewerId) return;
          
          // Apply reviewer filter if specified
          if (filters?.reviewerId && filters.reviewerId.length > 0) {
            if (!filters.reviewerId.includes(reviewerId)) return;
          }
          
          totalAssignments++;
          
          // Track assignments per reviewer
          reviewerAssignmentCounts[reviewerId] = (reviewerAssignmentCounts[reviewerId] || 0) + 1;
          
          // Check assignment status
          const reviewStatus = assignment.reviewStatus || assignment.status || 'pending';
          const isCompleted = ['completed', 'submitted'].includes(reviewStatus);
          const isPending = ['pending', 'assigned', 'in-progress'].includes(reviewStatus);
          
          if (isCompleted) {
            completedAssignments++;
            
            // Calculate completion time
            if (assignment.assignedAt && assignment.completedAt) {
              const assignedDate = assignment.assignedAt.toDate 
                ? assignment.assignedAt.toDate() 
                : new Date(assignment.assignedAt);
              const completedDate = assignment.completedAt.toDate 
                ? assignment.completedAt.toDate() 
                : new Date(assignment.completedAt);
              
              const days = (completedDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
              totalCompletionTime += days;
              completionCount++;
              
              if (!reviewerCompletionTimes[reviewerId]) {
                reviewerCompletionTimes[reviewerId] = [];
              }
              reviewerCompletionTimes[reviewerId].push(days);
            }
          } else if (isPending) {
            pendingAssignments++;
            
            // Check if overdue
            if (assignment.deadline) {
              const deadline = assignment.deadline.toDate 
                ? assignment.deadline.toDate() 
                : new Date(assignment.deadline);
              
              if (deadline < now) {
                overdueAssignments++;
              }
            }
          }
        });
      } catch (error) {
        // Skip protocols without reviewer subcollection
        continue;
      }
    }
    
    // Calculate averages
    const averageCompletionTime = completionCount > 0 
      ? Math.round(totalCompletionTime / completionCount) 
      : 0;
    
    const completionRate = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100) 
      : 0;
    
    // Calculate average workload
    const reviewerIds = Object.keys(reviewerAssignmentCounts);
    const totalWorkload = reviewerIds.reduce((sum, id) => sum + reviewerAssignmentCounts[id], 0);
    const averageWorkload = activeReviewers > 0 
      ? Math.round(totalWorkload / activeReviewers) 
      : 0;
    
    // Calculate workload balance (standard deviation)
    let workloadBalance = 0;
    if (reviewerIds.length > 0 && averageWorkload > 0) {
      const variances = reviewerIds.map(id => {
        const workload = reviewerAssignmentCounts[id];
        return Math.pow(workload - averageWorkload, 2);
      });
      const variance = variances.reduce((sum, v) => sum + v, 0) / reviewerIds.length;
      workloadBalance = Math.round(Math.sqrt(variance));
    }
    
    return {
      totalReviewers,
      activeReviewers,
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      overdueAssignments,
      averageCompletionTime,
      completionRate,
      averageWorkload,
      workloadBalance,
    };
  } catch (error) {
    console.error('Error calculating reviewer metrics:', error);
    // Return default values if there's an error
    return {
      totalReviewers: 0,
      activeReviewers: 0,
      totalAssignments: 0,
      completedAssignments: 0,
      pendingAssignments: 0,
      overdueAssignments: 0,
      averageCompletionTime: 0,
      completionRate: 0,
      averageWorkload: 0,
      workloadBalance: 0,
    };
  }
}

/**
 * Calculate reviewer performance
 */
export async function calculateReviewerPerformance(
  dateRange: DateRange,
  filters?: AnalyticsFilters
): Promise<ReviewerPerformance[]> {
  try {
    // Get all reviewers
    const reviewersRef = collection(db, 'reviewers');
    const reviewersSnapshot = await getDocs(reviewersRef);
    
    const reviewers = reviewersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Unknown Reviewer',
      ...doc.data()
    }));
    
    // Get all protocol assignments
    const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
    const submissionsSnapshot = await getDocs(submissionsRef);
    
    const now = new Date();
    const reviewerStats: Record<string, {
      totalAssignments: number;
      completedAssignments: number;
      overdueAssignments: number;
      completionTimes: number[];
    }> = {};
    
    // Initialize stats for all reviewers
    reviewers.forEach(reviewer => {
      reviewerStats[reviewer.id] = {
        totalAssignments: 0,
        completedAssignments: 0,
        overdueAssignments: 0,
        completionTimes: [],
      };
    });
    
    // Iterate through all protocols to get reviewer assignments
    for (const protocolDoc of submissionsSnapshot.docs) {
      const protocolId = protocolDoc.id;
      const protocolData = protocolDoc.data();
      
      // Check if protocol is in date range
      const protocolDate = protocolData.createdAt?.toDate 
        ? protocolData.createdAt.toDate() 
        : new Date(protocolData.createdAt);
      
      if (protocolDate < dateRange.start || protocolDate > dateRange.end) {
        continue;
      }
      
      // Get reviewer assignments for this protocol
      try {
        const reviewersRef = collection(db, SUBMISSIONS_COLLECTION, protocolId, 'reviewers');
        const assignmentsSnapshot = await getDocs(reviewersRef);
        
        assignmentsSnapshot.docs.forEach(assignmentDoc => {
          const assignment = assignmentDoc.data();
          const reviewerId = assignment.reviewerId;
          
          if (!reviewerId || !reviewerStats[reviewerId]) return;
          
          // Apply reviewer filter if specified
          if (filters?.reviewerId && filters.reviewerId.length > 0) {
            if (!filters.reviewerId.includes(reviewerId)) return;
          }
          
          reviewerStats[reviewerId].totalAssignments++;
          
          // Check assignment status
          const reviewStatus = assignment.reviewStatus || assignment.status || 'pending';
          const isCompleted = ['completed', 'submitted'].includes(reviewStatus);
          const isPending = ['pending', 'assigned', 'in-progress'].includes(reviewStatus);
          
          if (isCompleted) {
            reviewerStats[reviewerId].completedAssignments++;
            
            // Calculate completion time
            if (assignment.assignedAt && assignment.completedAt) {
              const assignedDate = assignment.assignedAt.toDate 
                ? assignment.assignedAt.toDate() 
                : new Date(assignment.assignedAt);
              const completedDate = assignment.completedAt.toDate 
                ? assignment.completedAt.toDate() 
                : new Date(assignment.completedAt);
              
              const days = (completedDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
              reviewerStats[reviewerId].completionTimes.push(days);
            }
          } else if (isPending) {
            // Check if overdue
            if (assignment.deadline) {
              const deadline = assignment.deadline.toDate 
                ? assignment.deadline.toDate() 
                : new Date(assignment.deadline);
              
              if (deadline < now) {
                reviewerStats[reviewerId].overdueAssignments++;
              }
            }
          }
        });
      } catch (error) {
        // Skip protocols without reviewer subcollection
        continue;
      }
    }
    
    // Build reviewer performance array
    const performance: ReviewerPerformance[] = reviewers
      .filter(reviewer => reviewerStats[reviewer.id].totalAssignments > 0)
      .map(reviewer => {
        const stats = reviewerStats[reviewer.id];
        const avgCompletionTime = stats.completionTimes.length > 0
          ? Math.round(stats.completionTimes.reduce((sum, time) => sum + time, 0) / stats.completionTimes.length)
          : 0;
        
        const completionRate = stats.totalAssignments > 0
          ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
          : 0;
        
        return {
          reviewerId: reviewer.id,
          reviewerName: reviewer.name,
          totalAssignments: stats.totalAssignments,
          completedAssignments: stats.completedAssignments,
          overdueAssignments: stats.overdueAssignments,
          averageCompletionTime: avgCompletionTime,
          completionRate,
        };
      })
      .sort((a, b) => b.totalAssignments - a.totalAssignments); // Sort by total assignments
    
    return performance;
  } catch (error) {
    console.error('Error calculating reviewer performance:', error);
    return [];
  }
}

/**
 * Calculate review process metrics
 */
export async function calculateReviewProcessMetrics(
  dateRange: DateRange,
  filters?: AnalyticsFilters
): Promise<ReviewProcessMetrics> {
  try {
    const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
    let q = query(submissionsRef);
    
    // Apply date filter
    if (dateRange.start) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(dateRange.start)));
    }
    if (dateRange.end) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(dateRange.end)));
    }
    
    const snapshot = await getDocs(q);
    const protocols = toChairpersonProtocols(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    // Apply filters
    let filteredProtocols = protocols;
    if (filters?.status && filters.status.length > 0) {
      filteredProtocols = filteredProtocols.filter(p => filters.status!.includes(p.status));
    }
    if (filters?.researchType && filters.researchType.length > 0) {
      filteredProtocols = filteredProtocols.filter(p => {
        const researchType = p.information?.researchType;
        return typeof researchType === 'string' && filters.researchType!.includes(researchType);
      });
    }
    
    // Count submitted protocols (exclude drafts)
    const submittedProtocols = filteredProtocols.filter(p => p.status !== 'draft');
    const submittedCount = submittedProtocols.length;
    
    // Count approved protocols
    const approvedProtocols = filteredProtocols.filter(p => p.status === 'approved');
    const approvedCount = approvedProtocols.length;
    
    // Count rejected protocols
    const rejectedProtocols = filteredProtocols.filter(p => p.status === 'disapproved');
    const rejectedCount = rejectedProtocols.length;
    
    // Count conditionally approved protocols
    const conditionalApprovedProtocols = filteredProtocols.filter(p => 
      p.status === 'approved_minor_revisions' || p.status === 'major_revisions_deferred'
    );
    const conditionalApprovedCount = conditionalApprovedProtocols.length;
    
    // Calculate approval rate: (Approved / Submitted) × 100
    const approvalRate = submittedCount > 0 
      ? Math.round((approvedCount / submittedCount) * 100) 
      : 0;
    
    // Calculate rejection rate
    const rejectionRate = submittedCount > 0 
      ? Math.round((rejectedCount / submittedCount) * 100) 
      : 0;
    
    // Calculate conditional approval rate
    const conditionalApprovalRate = submittedCount > 0 
      ? Math.round((conditionalApprovedCount / submittedCount) * 100) 
      : 0;
    
    // Calculate average review cycle time (from submission to decision)
    let totalCycleTime = 0;
    let cycleTimeCount = 0;
    
    const decidedProtocols = filteredProtocols.filter(p => 
      ['approved', 'disapproved', 'approved_minor_revisions', 'major_revisions_deferred'].includes(p.status)
    );
    
    decidedProtocols.forEach(p => {
      if (p.createdAt && p.approvedAt) {
        const created = toDate(p.createdAt);
        const decided = toDate(p.approvedAt);
        const days = (decided.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        totalCycleTime += days;
        cycleTimeCount++;
      }
    });
    
    const averageReviewCycleTime = cycleTimeCount > 0 
      ? Math.round(totalCycleTime / cycleTimeCount) 
      : 0;
    
    // Calculate average review cycle time by research type
    const cycleTimeByType: Record<string, { total: number; count: number }> = {
      SR: { total: 0, count: 0 },
      PR: { total: 0, count: 0 },
      HO: { total: 0, count: 0 },
      BS: { total: 0, count: 0 },
      EX: { total: 0, count: 0 },
    };
    
    decidedProtocols.forEach(p => {
      const researchType = p.information?.researchType;
      if (typeof researchType === 'string' && researchType in cycleTimeByType && p.createdAt && p.approvedAt) {
        const created = toDate(p.createdAt);
        const decided = toDate(p.approvedAt);
        const days = (decided.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        cycleTimeByType[researchType].total += days;
        cycleTimeByType[researchType].count++;
      }
    });
    
    const averageReviewCycleTimeByType = {
      SR: cycleTimeByType.SR.count > 0 ? Math.round(cycleTimeByType.SR.total / cycleTimeByType.SR.count) : 0,
      PR: cycleTimeByType.PR.count > 0 ? Math.round(cycleTimeByType.PR.total / cycleTimeByType.PR.count) : 0,
      HO: cycleTimeByType.HO.count > 0 ? Math.round(cycleTimeByType.HO.total / cycleTimeByType.HO.count) : 0,
      BS: cycleTimeByType.BS.count > 0 ? Math.round(cycleTimeByType.BS.total / cycleTimeByType.BS.count) : 0,
      EX: cycleTimeByType.EX.count > 0 ? Math.round(cycleTimeByType.EX.total / cycleTimeByType.EX.count) : 0,
    };
    
    // Average time to decision (same as review cycle time for now)
    const averageTimeToDecision = averageReviewCycleTime;
    
    // Assessment completion rate (simplified - would need to query assessment forms)
    const assessmentCompletionRate = 0; // TODO: Implement when assessment data is available
    
    return {
      averageReviewCycleTime,
      averageReviewCycleTimeByType,
      approvalRate,
      rejectionRate,
      conditionalApprovalRate,
      averageTimeToDecision,
      assessmentCompletionRate,
    };
  } catch (error) {
    console.error('Error calculating review process metrics:', error);
    throw error;
  }
}

/**
 * Validate protocol data and count missing fields
 */
function validateProtocolData(protocol: any): {
  isValid: boolean;
  missingFields: string[];
  validationErrors: string[];
} {
  const missingFields: string[] = [];
  const validationErrors: string[] = [];
  
  // Required fields for a valid protocol
  const requiredFields = [
    { key: 'title', path: 'title' },
    { key: 'status', path: 'status' },
    { key: 'createdAt', path: 'createdAt' },
    { key: 'submitBy', path: 'submitBy' },
  ];
  
  // Check required fields
  requiredFields.forEach(field => {
    const value = protocol[field.key];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field.path);
    }
  });
  
  // Check information object
  if (!protocol.information) {
    missingFields.push('information');
  } else {
    const info = protocol.information;
    const requiredInfoFields = [
      { key: 'principalInvestigator', path: 'information.principalInvestigator' },
      { key: 'researchType', path: 'information.researchType' },
    ];
    
    requiredInfoFields.forEach(field => {
      if (!info[field.key]) {
        missingFields.push(field.path);
      }
    });
    
    // Validate principalInvestigator structure
    if (info.principalInvestigator) {
      const pi = info.principalInvestigator;
      if (!pi.name) missingFields.push('information.principalInvestigator.name');
      if (!pi.email) missingFields.push('information.principalInvestigator.email');
    }
  }
  
  // Check for approved protocols - should have decision data
  if (protocol.status === 'approved' || protocol.status === 'rejected') {
    if (!protocol.approvedAt) {
      missingFields.push('approvedAt');
    }
    if (!protocol.decision) {
      missingFields.push('decision');
    }
  }
  
  // Check for accepted protocols - should have reviewers assigned
  if (protocol.status === 'accepted' || protocol.status === 'under_review') {
    // This will be checked separately when we query reviewer assignments
    // For now, we'll note it as a potential issue
  }
  
  // Validate status value
  const validStatuses = [
    'draft', 'pending', 'submitted', 'accepted', 'under_review',
    'approved', 'rejected', 'disapproved', 'archived',
    'approved_minor_revisions', 'major_revisions_deferred'
  ];
  if (protocol.status && !validStatuses.includes(protocol.status)) {
    validationErrors.push(`Invalid status: ${protocol.status}`);
  }
  
  // Validate dates
  if (protocol.createdAt) {
    const createdDate = protocol.createdAt.toDate 
      ? protocol.createdAt.toDate() 
      : new Date(protocol.createdAt);
    if (isNaN(createdDate.getTime())) {
      validationErrors.push('Invalid createdAt date');
    }
  }
  
  if (protocol.updatedAt) {
    const updatedDate = protocol.updatedAt.toDate 
      ? protocol.updatedAt.toDate() 
      : new Date(protocol.updatedAt);
    if (isNaN(updatedDate.getTime())) {
      validationErrors.push('Invalid updatedAt date');
    }
  }
  
  const isValid = missingFields.length === 0 && validationErrors.length === 0;
  
  return { isValid, missingFields, validationErrors };
}

/**
 * Calculate system health metrics
 */
export async function calculateSystemHealthMetrics(
  dateRange?: DateRange
): Promise<SystemHealthMetrics> {
  try {
    const startTime = Date.now();
    
    // Get all protocols for validation
    const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
    const submissionsSnapshot = await getDocs(submissionsRef);
    
    const protocols = toChairpersonProtocols(submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    const totalProtocols = protocols.length;
    let totalFields = 0;
    let missingFields = 0;
    let totalValidationErrors = 0;
    const allMissingFields: Record<string, number> = {};
    
    // Validate each protocol
    protocols.forEach(protocol => {
      const validation = validateProtocolData(protocol);
      
      // Count fields (assuming average of 20 fields per protocol)
      const estimatedFieldsPerProtocol = 20;
      totalFields += estimatedFieldsPerProtocol;
      
      // Count missing fields
      missingFields += validation.missingFields.length;
      validation.missingFields.forEach(field => {
        allMissingFields[field] = (allMissingFields[field] || 0) + 1;
      });
      
      // Count validation errors
      totalValidationErrors += validation.validationErrors.length;
    });
    
    // Calculate data completeness
    const filledFields = totalFields - missingFields;
    const dataCompleteness = totalFields > 0 
      ? Math.round((filledFields / totalFields) * 100) 
      : 100;
    
    // Calculate error rate (validation errors per protocol)
    const errorRate = totalProtocols > 0
      ? Math.round((totalValidationErrors / totalProtocols) * 100 * 10) / 10 // Percentage with 1 decimal
      : 0;
    
    // Check reviewer assignments for accepted/under_review protocols
    let missingReviewerAssignments = 0;
    const acceptedProtocols = protocols.filter(p => 
      p.status === 'accepted' || p.status === 'under_review'
    );
    
    for (const protocol of acceptedProtocols) {
      try {
        const reviewersRef = collection(db, SUBMISSIONS_COLLECTION, protocol.id, 'reviewers');
        const reviewersSnapshot = await getDocs(reviewersRef);
        
        if (reviewersSnapshot.empty) {
          missingReviewerAssignments++;
          missingFields += 3; // Count as missing: reviewers assignment
        }
      } catch (error) {
        missingReviewerAssignments++;
        missingFields += 3;
      }
    }
    
    // Calculate query performance
    const queryTime = Date.now() - startTime;
    
    // Get data freshness (time since last update)
    let maxUpdateTime = 0;
    protocols.forEach(protocol => {
      if (protocol.updatedAt) {
        const updateTime = toDate(protocol.updatedAt).getTime();
        if (updateTime > maxUpdateTime) {
          maxUpdateTime = updateTime;
        }
      }
    });
    
    const now = Date.now();
    const dataFreshness = maxUpdateTime > 0 
      ? Math.round((now - maxUpdateTime) / (1000 * 60 * 60)) // Hours
      : 0;
    
    // Cache hit rate (would need to track this separately - placeholder for now)
    const cacheHitRate = 0; // TODO: Implement cache tracking
    
    // Dashboard load time (would be measured client-side, placeholder)
    const dashboardLoadTime = queryTime; // Use query time as approximation
    
    // Get additional metrics
    const totalReviewers = await getTotalReviewersCount();
    const totalUsers = await getTotalUsersCount();
    
    // Calculate system uptime (simplified - would need actual uptime tracking)
    const systemUptime = 99.9; // Placeholder - would be calculated from actual uptime data
    
    // Calculate API success rate (simplified - would need API call tracking)
    const apiSuccessRate = errorRate > 0 ? Math.max(0, 100 - (errorRate * 2)) : 100;
    
    // Get Firebase Analytics data if date range is provided
    let firebaseAnalyticsData: Partial<SystemHealthMetrics> = {};
    let errorBreakdown: Record<string, number> = {};
    
    if (dateRange) {
      try {
        const [errorTrends, usageStats, performanceMetrics] = await Promise.all([
          getErrorTrends(dateRange),
          getAnalyticsUsageStats(dateRange),
          getPerformanceMetrics(dateRange),
        ]);
        
        // Calculate crash-free rate
        const totalErrors = errorTrends.reduce((sum, trend) => sum + trend.errors, 0);
        const totalDays = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));
        const errorsPerDay = totalErrors / totalDays;
        const crashFreeRate = Math.max(0, 100 - Math.min(100, errorsPerDay * 10));
        
        // Get unique users affected
        const uniqueUsersAffected = errorTrends.reduce((max, trend) => 
          Math.max(max, trend.usersAffected), 0
        );
        
        // Get error breakdown from Firestore
        errorBreakdown = await getErrorBreakdown(dateRange);
        
        // Calculate average response time from performance metrics
        const avgResponseTime = performanceMetrics.api_response_time || 
                               performanceMetrics.query_time || 
                               queryTime;
        
        firebaseAnalyticsData = {
          activeUsers: usageStats.uniqueUsers,
          totalPageViews: usageStats.totalViews,
          analyticsDashboardViews: usageStats.totalViews,
          crashFreeRate,
          errorCount: totalErrors,
          uniqueUsersAffected,
          averageSessionDuration: performanceMetrics.session_duration || 0,
          averageResponseTime: avgResponseTime,
          apiSuccessRate: performanceMetrics.api_success_rate || apiSuccessRate,
          peakConcurrentUsers: usageStats.uniqueUsers, // Simplified
        };
      } catch (error) {
        console.warn('Failed to fetch Firebase Analytics data:', error);
      }
    }
    
    return {
      dataCompleteness,
      missingDataPoints: missingFields,
      dataValidationErrors: totalValidationErrors,
      queryPerformance: queryTime,
      dashboardLoadTime,
      cacheHitRate,
      errorRate,
      dataFreshness,
      totalProtocols,
      totalReviewers,
      totalUsers,
      systemUptime,
      apiSuccessRate,
      errorTypes: errorBreakdown,
      ...firebaseAnalyticsData,
    };
  } catch (error) {
    console.error('Error calculating system health metrics:', error);
    // Return default values with error indication
    return {
      dataCompleteness: 0,
      missingDataPoints: 0,
      dataValidationErrors: 1, // Indicate error occurred
      queryPerformance: 0,
      dashboardLoadTime: 0,
      cacheHitRate: 0,
      errorRate: 100, // 100% error rate if calculation failed
      dataFreshness: 0,
    };
  }
}

/**
 * Calculate error trends
 */
export async function calculateErrorTrends(
  dateRange: DateRange
): Promise<ErrorTrend[]> {
  try {
    // Use Firebase Analytics service to get error trends
    const trends = await getErrorTrends(dateRange);
    return trends.map(trend => ({
      date: trend.date,
      errors: trend.errors,
      usersAffected: trend.usersAffected,
    }));
  } catch (error) {
    console.error('Error calculating error trends:', error);
    return [];
  }
}

/**
 * Get all analytics data
 */
export async function getAnalyticsData(
  dateRange: DateRange,
  filters?: AnalyticsFilters
): Promise<AnalyticsData> {
  const [
    protocolMetrics,
    protocolTrends,
    reviewerMetrics,
    reviewerPerformance,
    reviewProcessMetrics,
    systemHealthMetrics,
    errorTrends,
  ] = await Promise.all([
    calculateProtocolMetrics(dateRange, filters),
    calculateProtocolTrends(dateRange, filters),
    calculateReviewerMetrics(dateRange, filters),
    calculateReviewerPerformance(dateRange, filters),
    calculateReviewProcessMetrics(dateRange, filters),
    calculateSystemHealthMetrics(dateRange),
    calculateErrorTrends(dateRange),
  ]);
  
  return {
    protocolMetrics,
    protocolTrends,
    reviewerMetrics,
    reviewerPerformance,
    reviewProcessMetrics,
    systemHealthMetrics,
    errorTrends,
    dateRange,
    filters: filters || {},
    lastUpdated: new Date(),
  };
}

