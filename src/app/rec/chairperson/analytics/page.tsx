"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoading } from '@/components/ui/loading';
import { 
  Users, 
  Clock, 
  Activity,
  TrendingUp,
  FileText
} from 'lucide-react';
import { DateRange, AnalyticsData, AnalyticsFilters } from '@/types/analytics.types';
import { getAnalyticsData } from '@/lib/services/analytics/analyticsService';
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
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3); // Default: Last 3 months
    return { start, end, preset: 'last3months' };
  });
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAnalyticsData(dateRange, filters);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, filters]);

  useEffect(() => {
    loadAnalyticsData();
    // Track analytics dashboard view
    trackAnalyticsDashboardView(activeTab);
  }, [dateRange, filters, activeTab, loadAnalyticsData]);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  if (loading && !analyticsData) {
    return <PageLoading />;
  }

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
          <AnalyticsHeaderControls
            dateRange={dateRange}
            filters={filters}
            onDateRangeChange={handleDateRangeChange}
            onFiltersChange={handleFiltersChange}
          />
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
              {analyticsData && (
                <AnalyticsOverview analyticsData={analyticsData} />
              )}
            </TabsContent>

            <TabsContent value="protocols" className="mt-6">
              {analyticsData && (
                <ProtocolAnalytics 
                  protocolMetrics={analyticsData.protocolMetrics}
                  protocolTrends={analyticsData.protocolTrends}
                />
              )}
            </TabsContent>

            <TabsContent value="reviewers" className="mt-6">
              {analyticsData && (
                <ReviewerAnalytics 
                  reviewerMetrics={analyticsData.reviewerMetrics}
                  reviewerPerformance={analyticsData.reviewerPerformance}
                />
              )}
            </TabsContent>

            <TabsContent value="review-process" className="mt-6">
              {analyticsData && (
                <ReviewProcessAnalytics 
                  reviewProcessMetrics={analyticsData.reviewProcessMetrics}
                />
              )}
            </TabsContent>

            <TabsContent value="system-health" className="mt-6">
              {analyticsData && (
                <SystemHealthAnalytics 
                  systemHealthMetrics={analyticsData.systemHealthMetrics}
                  errorTrends={analyticsData.errorTrends}
                />
              )}
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}

