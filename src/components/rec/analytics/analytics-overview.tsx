"use client";

import React from 'react';
import { AnalyticsData } from '@/types/analytics.types';
import { KPICard } from './kpi-card';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Activity
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

interface AnalyticsOverviewProps {
  analyticsData: AnalyticsData;
}

export function AnalyticsOverview({ analyticsData }: AnalyticsOverviewProps) {
  const { protocolMetrics, reviewerMetrics, reviewProcessMetrics, systemHealthMetrics, protocolTrends } = analyticsData;

  // Primary KPIs
  const primaryKPIs = [
    {
      id: 'avg-time-to-approval',
      label: 'Avg Time to Approval',
      value: protocolMetrics.averageTimeToApproval,
      unit: 'days',
      isPrimary: true,
      description: 'Average time from draft to approval',
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'approval-rate',
      label: 'Approval Rate',
      value: reviewProcessMetrics.approvalRate,
      unit: '%',
      isPrimary: true,
      description: 'Percentage of protocols approved',
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'avg-review-cycle',
      label: 'Avg Review Cycle Time',
      value: reviewProcessMetrics.averageReviewCycleTime,
      unit: 'days',
      isPrimary: true,
      description: 'Average time for complete review cycle',
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'overdue-assignments',
      label: 'Overdue Assignments',
      value: reviewerMetrics.overdueAssignments,
      isPrimary: true,
      description: 'Reviewer assignments past deadline',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'data-completeness',
      label: 'Data Completeness',
      value: systemHealthMetrics.dataCompleteness,
      unit: '%',
      isPrimary: true,
      description: 'Percentage of complete data',
      icon: Activity,
      color: 'text-orange-600 dark:text-orange-400',
    },
  ];

  // Status breakdown data for chart
  const statusData = Object.entries(protocolMetrics.byStatus)
    .map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));

  // Trends data
  const trendsData = protocolTrends.slice(-12).map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    submissions: trend.submissions,
    approvals: trend.approvals,
  }));

  const statusChartConfig: ChartConfig = {
    count: { label: 'Protocols', color: 'hsl(var(--primary))' },
  };

  const trendsChartConfig: ChartConfig = {
    submissions: { label: 'Submissions', color: '#3b82f6' },
    approvals: { label: 'Approvals', color: '#10b981' },
  };

  return (
    <div className="space-y-6">
      {/* Primary KPIs */}
      <div>
        <h3 className="text-base font-semibold mb-4 text-[#036635] dark:text-[#FECC07]">
          Key Performance Indicators
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {primaryKPIs.map((kpi) => (
            <KPICard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit}
              description={kpi.description}
              icon={kpi.icon}
              isPrimary={kpi.isPrimary}
              color={kpi.color}
            />
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Trends */}
        {trendsData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Submission & Approval Trends</h3>
            <ChartContainer config={trendsChartConfig} className="h-[300px] w-full">
              <AreaChart data={trendsData}>
                <defs>
                  <linearGradient id="fillSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillApprovals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#3b82f6"
                  fill="url(#fillSubmissions)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="approvals" 
                  stroke="#10b981"
                  fill="url(#fillApprovals)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}

        {/* Status Distribution Pie Chart */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Protocol Status Distribution</h3>
          <ChartContainer config={statusChartConfig} className="h-[300px] w-full">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {statusData.map((entry, index) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#ef4444'];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">Total Protocols</p>
          <p className="text-xl font-bold text-[#036635] dark:text-[#FECC07]">
            {protocolMetrics.total}
          </p>
        </div>
        <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">Pending Review</p>
          <p className="text-xl font-bold text-[#036635] dark:text-[#FECC07]">
            {protocolMetrics.byStatus.pending}
          </p>
        </div>
        <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">Active Reviewers</p>
          <p className="text-xl font-bold text-[#036635] dark:text-[#FECC07]">
            {reviewerMetrics.activeReviewers}
          </p>
        </div>
        <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">Submission Rate</p>
          <p className="text-xl font-bold text-[#036635] dark:text-[#FECC07]">
            {protocolMetrics.submissionRate}
            <span className="text-xs font-normal text-muted-foreground ml-1">/month</span>
          </p>
        </div>
      </div>
    </div>
  );
}
