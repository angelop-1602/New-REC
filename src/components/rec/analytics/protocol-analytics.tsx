"use client";

import React from 'react';
import { ProtocolMetrics, ProtocolTrend } from '@/types/analytics.types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { format } from 'date-fns';

interface ProtocolAnalyticsProps {
  protocolMetrics: ProtocolMetrics;
  protocolTrends: ProtocolTrend[];
}

const statusColors = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  approved: '#10b981',
  archived: '#6b7280',
  rejected: '#ef4444',
};

const researchTypeColors = {
  SR: '#8b5cf6',
  PR: '#ec4899',
  HO: '#06b6d4',
  BS: '#f59e0b',
  EX: '#6366f1',
};

export function ProtocolAnalytics({
  protocolMetrics,
  protocolTrends,
}: ProtocolAnalyticsProps) {
  // Prepare status data for pie chart
  const statusData = Object.entries(protocolMetrics.byStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: statusColors[status as keyof typeof statusColors] || '#6b7280',
    }));

  // Prepare research type data for bar chart
  const researchTypeData = Object.entries(protocolMetrics.byResearchType)
    .map(([type, count]) => ({
      type,
      count,
      color: researchTypeColors[type as keyof typeof researchTypeColors] || '#6b7280',
    }));

  // Prepare trends data for line chart
  const trendsData = protocolTrends.map(trend => ({
    date: format(new Date(trend.date), 'MMM yyyy'),
    submissions: trend.submissions,
    approvals: trend.approvals,
    rejections: trend.rejections,
  }));

  // Status over time - use trend data with calculated distribution
  const statusOverTime = protocolTrends.map((trend) => {
    const total = trend.submissions + trend.approvals + trend.rejections;
    return {
      date: format(new Date(trend.date), 'MMM yyyy'),
      pending: Math.max(0, total - trend.approvals - trend.rejections),
      accepted: Math.floor(trend.submissions * 0.3), // Estimated accepted
      approved: trend.approvals,
    };
  });

  const statusChartConfig: ChartConfig = {
    pending: { label: 'Pending', color: statusColors.pending },
    accepted: { label: 'Accepted', color: statusColors.accepted },
    approved: { label: 'Approved', color: statusColors.approved },
    archived: { label: 'Archived', color: statusColors.archived },
    rejected: { label: 'Rejected', color: statusColors.rejected },
  };

  const trendsChartConfig: ChartConfig = {
    submissions: { label: 'Submissions', color: '#3b82f6' },
    approvals: { label: 'Approvals', color: '#10b981' },
    rejections: { label: 'Rejections', color: '#ef4444' },
  };

  const researchTypeChartConfig: ChartConfig = {
    SR: { label: 'SR', color: researchTypeColors.SR },
    PR: { label: 'PR', color: researchTypeColors.PR },
    HO: { label: 'HO', color: researchTypeColors.HO },
    BS: { label: 'BS', color: researchTypeColors.BS },
    EX: { label: 'EX', color: researchTypeColors.EX },
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Total Protocols</p>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {protocolMetrics.total}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Submission Rate</p>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {protocolMetrics.submissionRate}
            <span className="text-xs font-normal text-muted-foreground ml-1">/month</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Avg Time to Approval</p>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {protocolMetrics.averageTimeToApproval}
            <span className="text-xs font-normal text-muted-foreground ml-1">days</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Completion Rate</p>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {protocolMetrics.completionRate}%
          </p>
        </div>
      </div>

      {/* Main Charts Grid - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Trends Line Chart */}
        {trendsData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Submission Trends Over Time</h3>
            <ChartContainer config={trendsChartConfig} className="h-[280px] w-full">
              <LineChart data={trendsData}>
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="approvals" 
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rejections" 
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}

        {/* Status Distribution Pie Chart */}
        {statusData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Status Distribution</h3>
            <ChartContainer config={statusChartConfig} className="h-[280px] w-full">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        )}
      </div>

      {/* Research Type Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Research Type Distribution Bar Chart */}
        {researchTypeData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Research Type Distribution</h3>
            <ChartContainer config={researchTypeChartConfig} className="h-[280px] w-full">
              <BarChart data={researchTypeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="type" 
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]}
                >
                  {researchTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        )}

        {/* Status Timeline Stacked Area Chart */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Status Distribution Timeline</h3>
          <ChartContainer config={statusChartConfig} className="h-[280px] w-full">
            <AreaChart data={statusOverTime}>
              <defs>
                <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillAccepted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="pending" 
                stackId="1"
                stroke="#f59e0b"
                fill="url(#fillPending)"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="accepted" 
                stackId="1"
                stroke="#3b82f6"
                fill="url(#fillAccepted)"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="approved" 
                stackId="1"
                stroke="#10b981"
                fill="url(#fillApproved)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
