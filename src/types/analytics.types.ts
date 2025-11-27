/**
 * Analytics Types
 * Type definitions for the analytics system
 */

import { FirestoreDate } from './common.types';

// ============================================================================
// DATE RANGE TYPES
// ============================================================================

export type DateRangePreset = 
  | 'today' 
  | 'last7days' 
  | 'last30days' 
  | 'last3months' 
  | 'last6months' 
  | 'lastyear' 
  | 'alltime';

export interface DateRange {
  start: Date;
  end: Date;
  preset?: DateRangePreset;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface AnalyticsFilters {
  researchType?: string[];
  status?: string[];
  reviewerId?: string[];
  proponentId?: string[];
  department?: string[];
}

// ============================================================================
// PROTOCOL ANALYTICS TYPES
// ============================================================================

export interface ProtocolMetrics {
  total: number;
  byStatus: {
    pending: number;
    accepted: number;
    approved: number;
    archived: number;
    rejected: number;
  };
  byResearchType: {
    SR: number;
    PR: number;
    HO: number;
    BS: number;
    EX: number;
  };
  submissionRate: number; // per month
  averageTimeToSubmission: number; // days
  averageTimeToApproval: number; // days - PRIMARY KPI
  completionRate: number; // % of drafts that become submissions
}

export interface ProtocolTrend {
  date: string;
  submissions: number;
  approvals: number;
  rejections: number;
}

// ============================================================================
// REVIEWER ANALYTICS TYPES
// ============================================================================

export interface ReviewerMetrics {
  totalReviewers: number;
  activeReviewers: number;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  overdueAssignments: number; // KPI
  averageCompletionTime: number; // days - PRIMARY KPI
  completionRate: number; // %
  averageWorkload: number; // assignments per reviewer
  workloadBalance: number; // standard deviation
}

export interface ReviewerPerformance {
  reviewerId: string;
  reviewerName: string;
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  averageCompletionTime: number;
  completionRate: number;
}

// ============================================================================
// REVIEW PROCESS ANALYTICS TYPES
// ============================================================================

export interface ReviewProcessMetrics {
  averageReviewCycleTime: number; // days - PRIMARY KPI
  averageReviewCycleTimeByType: {
    SR: number;
    PR: number;
    HO: number;
    BS: number;
    EX: number;
  };
  approvalRate: number; // % - PRIMARY KPI
  rejectionRate: number; // %
  conditionalApprovalRate: number; // %
  averageTimeToDecision: number; // days
  assessmentCompletionRate: number; // %
}

// ============================================================================
// SYSTEM HEALTH TYPES
// ============================================================================

export interface SystemHealthMetrics {
  dataCompleteness: number; // % - KPI
  missingDataPoints: number;
  dataValidationErrors: number;
  queryPerformance: number; // avg time in ms
  dashboardLoadTime: number; // ms - KPI
  cacheHitRate: number; // % - KPI
  errorRate: number; // % - KPI
  dataFreshness: number; // hours since last update
  // Firebase Analytics metrics
  activeUsers?: number; // Daily active users
  totalPageViews?: number; // Total page views
  analyticsDashboardViews?: number; // Analytics dashboard views
  crashFreeRate?: number; // % - KPI
  averageSessionDuration?: number; // seconds
  errorCount?: number; // Total errors in period
  uniqueUsersAffected?: number; // Users affected by errors
  // Additional comprehensive metrics
  systemUptime?: number; // % uptime
  apiSuccessRate?: number; // % successful API calls
  averageResponseTime?: number; // ms
  databaseHealth?: number; // % database health score
  totalProtocols?: number; // Total protocols in system
  totalReviewers?: number; // Total reviewers
  totalUsers?: number; // Total system users
  storageUsage?: number; // % storage used
  bandwidthUsage?: number; // MB used
  securityAlerts?: number; // Number of security alerts
  failedLogins?: number; // Failed login attempts
  successfulOperations?: number; // Successful operations count
  failedOperations?: number; // Failed operations count
  averageOperationTime?: number; // ms
  peakConcurrentUsers?: number; // Peak concurrent users
  errorTypes?: Record<string, number>; // Error breakdown by type
  performanceByEndpoint?: Record<string, number>; // Performance by API endpoint
}

export interface ErrorTrend {
  date: string;
  errors: number;
  usersAffected: number;
}

// ============================================================================
// KPI TYPES
// ============================================================================

export interface KPIMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  isPrimary?: boolean;
  description?: string;
}

export interface KPIDashboard {
  protocolKPIs: KPIMetric[];
  reviewerKPIs: KPIMetric[];
  reviewProcessKPIs: KPIMetric[];
  systemKPIs: KPIMetric[];
}

// ============================================================================
// ANALYTICS RESPONSE TYPES
// ============================================================================

export interface AnalyticsData {
  protocolMetrics: ProtocolMetrics;
  protocolTrends: ProtocolTrend[];
  reviewerMetrics: ReviewerMetrics;
  reviewerPerformance: ReviewerPerformance[];
  reviewProcessMetrics: ReviewProcessMetrics;
  systemHealthMetrics: SystemHealthMetrics;
  errorTrends: ErrorTrend[];
  dateRange: DateRange;
  filters: AnalyticsFilters;
  lastUpdated: Date;
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface AnalyticsCache {
  key: string;
  data: AnalyticsData;
  expiresAt: Date;
  createdAt: Date;
}

