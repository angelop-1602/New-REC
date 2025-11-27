"use client";

import React from 'react';
import { ReviewProcessMetrics } from '@/types/analytics.types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

interface ReviewProcessAnalyticsProps {
  reviewProcessMetrics: ReviewProcessMetrics;
}

export function ReviewProcessAnalytics({
  reviewProcessMetrics,
}: ReviewProcessAnalyticsProps) {
  // Decision rates data for pie chart
  const decisionData = [
    { name: 'Approved', value: reviewProcessMetrics.approvalRate, color: '#10b981' },
    { name: 'Rejected', value: reviewProcessMetrics.rejectionRate, color: '#ef4444' },
    { name: 'Conditional', value: reviewProcessMetrics.conditionalApprovalRate, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // Review cycle time by research type
  const cycleTimeData = Object.entries(reviewProcessMetrics.averageReviewCycleTimeByType)
    .map(([type, days]) => ({
      type,
      days,
    }));

  // Decision rates for bar chart
  const decisionBarData = [
    { label: 'Approved', value: reviewProcessMetrics.approvalRate, color: '#10b981' },
    { label: 'Rejected', value: reviewProcessMetrics.rejectionRate, color: '#ef4444' },
    { label: 'Conditional', value: reviewProcessMetrics.conditionalApprovalRate, color: '#f59e0b' },
  ];

  const decisionChartConfig: ChartConfig = {
    approved: { label: 'Approved', color: '#10b981' },
    rejected: { label: 'Rejected', color: '#ef4444' },
    conditional: { label: 'Conditional', color: '#f59e0b' },
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Avg Review Cycle Time</p>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {reviewProcessMetrics.averageReviewCycleTime}
            <span className="text-xs font-normal text-muted-foreground ml-1">days</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Approval Rate</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {reviewProcessMetrics.approvalRate}%
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Rejection Rate</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {reviewProcessMetrics.rejectionRate}%
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Assessment Completion</p>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {reviewProcessMetrics.assessmentCompletionRate}%
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Rates Pie Chart */}
        {decisionData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Decision Rates</h3>
            <ChartContainer config={decisionChartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={decisionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {decisionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        )}

        {/* Decision Rates Bar Chart */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Decision Rates Comparison</h3>
          <ChartContainer config={decisionChartConfig} className="h-[300px] w-full">
            <BarChart data={decisionBarData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
              >
                {decisionBarData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Review Cycle Time by Research Type */}
      {cycleTimeData.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Review Cycle Time by Research Type</h3>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <BarChart data={cycleTimeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="type" 
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="days" 
                fill="var(--color-primary)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
