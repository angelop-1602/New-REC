"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSkeleton } from '@/components/ui/loading';
import { 
  Users, 
  Clock, 
  Activity,
  TrendingUp,
  FileText
} from 'lucide-react';
import { DateRange, AnalyticsData, AnalyticsFilters } from '@/types/analytics.types';
import { 
  getOverviewData,
  getProtocolsData,
  getReviewersData,
  getReviewProcessData,
  getSystemHealthData
} from '@/lib/services/analytics/analyticsService';
import { AnalyticsOverview } from '@/components/rec/analytics/analytics-overview';
import { ProtocolAnalytics } from '@/components/rec/analytics/protocol-analytics';
import { ReviewerAnalytics } from '@/components/rec/analytics/reviewer-analytics';
import { ReviewProcessAnalytics } from '@/components/rec/analytics/review-process-analytics';
import { SystemHealthAnalytics } from '@/components/rec/analytics/system-health-analytics';
import { AnalyticsHeaderControls } from '@/components/rec/analytics/analytics-header-controls';
import { toast } from 'sonner';
import { trackAnalyticsDashboardView } from '@/lib/services/analytics/firebaseAnalyticsService';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState<Record<string, boolean>>({
    overview: true,
    protocols: false,
    reviewers: false,
    'review-process': false,
    'system-health': false,
  });
  const [analyticsData, setAnalyticsData] = useState<Partial<AnalyticsData>>({});
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3); // Default: Last 3 months
    return { start, end, preset: 'last3months' };
  });
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const prefetchRef = useRef<Set<string>>(new Set());

  // Load overview data first (PRIORITY)
  const loadOverviewData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, overview: true }));
      const data = await getOverviewData(dateRange, filters);
      setAnalyticsData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error loading overview data:', error);
      toast.error('Failed to load overview data');
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  }, [dateRange, filters]);

  // Prefetch other tabs in background
  const prefetchTabData = useCallback(async (tab: string) => {
    if (prefetchRef.current.has(tab)) return; // Already prefetching
    prefetchRef.current.add(tab);

    try {
      setLoading(prev => ({ ...prev, [tab]: true }));
      
      let data: Partial<AnalyticsData>;
      switch (tab) {
        case 'protocols':
          data = await getProtocolsData(dateRange, filters);
          break;
        case 'reviewers':
          data = await getReviewersData(dateRange, filters);
          break;
        case 'review-process':
          data = await getReviewProcessData(dateRange, filters);
          break;
        case 'system-health':
          data = await getSystemHealthData(dateRange);
          break;
        default:
          return;
      }
      
      setAnalyticsData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
      // Don't show toast for background prefetch errors
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, [dateRange, filters]);

  // Load overview data immediately when filters/dateRange change
  useEffect(() => {
    prefetchRef.current.clear(); // Reset prefetch tracking
    loadOverviewData();
  }, [loadOverviewData]);

  // Prefetch other tabs after overview loads (with small delay to prioritize overview)
  useEffect(() => {
    if (!loading.overview && analyticsData.protocolMetrics) {
      // Start prefetching other tabs in background after overview is ready
      const timer = setTimeout(() => {
        ['protocols', 'reviewers', 'review-process', 'system-health'].forEach(tab => {
          if (tab !== activeTab) {
            prefetchTabData(tab);
          }
        });
      }, 500); // Small delay to ensure overview renders first
      
      return () => clearTimeout(timer);
    }
  }, [loading.overview, analyticsData.protocolMetrics, prefetchTabData, activeTab]);

  // Load data for active tab if not already loaded
  useEffect(() => {
    if (activeTab !== 'overview' && !loading[activeTab]) {
      const dataKey = getDataKeyForTab(activeTab);
      if (dataKey && !analyticsData[dataKey]) {
        prefetchTabData(activeTab);
      }
    }
  }, [activeTab, loading, analyticsData, prefetchTabData]);

  // Track tab views separately so changing tabs doesn't refetch data
  useEffect(() => {
    trackAnalyticsDashboardView(activeTab);
  }, [activeTab]);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  // Helper to get data key for tab
  const getDataKeyForTab = (tab: string): keyof AnalyticsData | null => {
    switch (tab) {
      case 'overview':
        return 'protocolMetrics';
      case 'protocols':
        return 'protocolMetrics';
      case 'reviewers':
        return 'reviewerMetrics';
      case 'review-process':
        return 'reviewProcessMetrics';
      case 'system-health':
        return 'systemHealthMetrics';
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Comprehensive insights into protocol review system performance
          </p>
        </div>
        
        {/* Compact Controls - Right Side */}
        <div className="flex-shrink-0">
          {loading.overview ? (
            <div className="w-full sm:w-72">
              <LoadingSkeleton className="h-10 w-full rounded-md" />
            </div>
          ) : (
            <AnalyticsHeaderControls
              dateRange={dateRange}
              filters={filters}
              onDateRangeChange={handleDateRangeChange}
              onFiltersChange={handleFiltersChange}
            />
          )}
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-muted/50">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-[#036635]/10 dark:data-[state=active]:bg-[#FECC07]/20 data-[state=active]:text-[#036635] dark:data-[state=active]:text-[#FECC07]"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="protocols"
                className="flex items-center gap-2 data-[state=active]:bg-[#036635]/10 dark:data-[state=active]:bg-[#FECC07]/20 data-[state=active]:text-[#036635] dark:data-[state=active]:text-[#FECC07]"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Protocols</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reviewers"
                className="flex items-center gap-2 data-[state=active]:bg-[#036635]/10 dark:data-[state=active]:bg-[#FECC07]/20 data-[state=active]:text-[#036635] dark:data-[state=active]:text-[#FECC07]"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Reviewers</span>
              </TabsTrigger>
              <TabsTrigger 
                value="review-process"
                className="flex items-center gap-2 data-[state=active]:bg-[#036635]/10 dark:data-[state=active]:bg-[#FECC07]/20 data-[state=active]:text-[#036635] dark:data-[state=active]:text-[#FECC07]"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Review Process</span>
              </TabsTrigger>
              <TabsTrigger 
                value="system-health"
                className="flex items-center gap-2 data-[state=active]:bg-[#036635]/10 dark:data-[state=active]:bg-[#FECC07]/20 data-[state=active]:text-[#036635] dark:data-[state=active]:text-[#FECC07]"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">System Health</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              {loading.overview ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className="p-4 border rounded-lg min-h-[140px]">
                        <LoadingSkeleton className="h-4 w-24 mb-2 rounded-md" />
                        <LoadingSkeleton className="h-8 w-16 rounded-md mb-2" />
                        <LoadingSkeleton className="h-3 w-full rounded-md" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="min-h-[300px]">
                      <LoadingSkeleton className="h-6 w-48 mb-2 rounded-md" />
                      <LoadingSkeleton className="h-[300px] w-full rounded-xl" />
                    </div>
                    <div className="min-h-[300px]">
                      <LoadingSkeleton className="h-6 w-48 mb-2 rounded-md" />
                      <LoadingSkeleton className="h-[300px] w-full rounded-xl" />
                    </div>
                  </div>
                </div>
              ) : (
                analyticsData.protocolMetrics && analyticsData.protocolTrends && analyticsData.reviewProcessMetrics && (
                  <AnalyticsOverview analyticsData={analyticsData as AnalyticsData} />
                )
              )}
            </TabsContent>

            <TabsContent value="protocols" className="mt-6">
              {loading.protocols ? (
                <LoadingSkeleton className="h-80 w-full rounded-xl" />
              ) : (
                analyticsData.protocolMetrics && analyticsData.protocolTrends && (
                  <ProtocolAnalytics 
                    protocolMetrics={analyticsData.protocolMetrics}
                    protocolTrends={analyticsData.protocolTrends}
                  />
                )
              )}
            </TabsContent>

            <TabsContent value="reviewers" className="mt-6">
              {loading.reviewers ? (
                <LoadingSkeleton className="h-80 w-full rounded-xl" />
              ) : (
                analyticsData.reviewerMetrics && analyticsData.reviewerPerformance && (
                  <ReviewerAnalytics 
                    reviewerMetrics={analyticsData.reviewerMetrics}
                    reviewerPerformance={analyticsData.reviewerPerformance}
                  />
                )
              )}
            </TabsContent>

            <TabsContent value="review-process" className="mt-6">
              {loading['review-process'] ? (
                <LoadingSkeleton className="h-80 w-full rounded-xl" />
              ) : (
                analyticsData.reviewProcessMetrics && (
                  <ReviewProcessAnalytics 
                    reviewProcessMetrics={analyticsData.reviewProcessMetrics}
                  />
                )
              )}
            </TabsContent>

            <TabsContent value="system-health" className="mt-6">
              {loading['system-health'] ? (
                <LoadingSkeleton className="h-80 w-full rounded-xl" />
              ) : (
                analyticsData.systemHealthMetrics && analyticsData.errorTrends && (
                  <SystemHealthAnalytics 
                    systemHealthMetrics={analyticsData.systemHealthMetrics}
                    errorTrends={analyticsData.errorTrends}
                  />
                )
              )}
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}

