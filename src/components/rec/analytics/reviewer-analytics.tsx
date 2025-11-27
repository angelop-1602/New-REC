"use client";

import React from 'react';
import { ReviewerMetrics, ReviewerPerformance } from '@/types/analytics.types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

interface ReviewerAnalyticsProps {
  reviewerMetrics: ReviewerMetrics;
  reviewerPerformance: ReviewerPerformance[];
}

export function ReviewerAnalytics({
  reviewerMetrics,
  reviewerPerformance,
}: ReviewerAnalyticsProps) {
  // Prepare performance data for chart
  const performanceData = reviewerPerformance
    .slice(0, 10) // Top 10 reviewers
    .map(reviewer => ({
      name: reviewer.reviewerName.length > 12 
        ? reviewer.reviewerName.substring(0, 12) + '...' 
        : reviewer.reviewerName,
      assignments: reviewer.totalAssignments,
      completed: reviewer.completedAssignments,
      overdue: reviewer.overdueAssignments,
      completionRate: reviewer.completionRate,
      avgTime: reviewer.averageCompletionTime,
    }));

  const assignmentData = [
    { label: 'Total', value: reviewerMetrics.totalAssignments, color: '#3b82f6' },
    { label: 'Completed', value: reviewerMetrics.completedAssignments, color: '#10b981' },
    { label: 'Pending', value: reviewerMetrics.pendingAssignments, color: '#f59e0b' },
    { label: 'Overdue', value: reviewerMetrics.overdueAssignments, color: '#ef4444' },
  ];

  // Workload distribution
  const workloadData = reviewerPerformance
    .slice(0, 8)
    .map(r => ({
      name: r.reviewerName.length > 10 ? r.reviewerName.substring(0, 10) + '...' : r.reviewerName,
      workload: r.totalAssignments,
    }));

  const performanceChartConfig: ChartConfig = {
    assignments: { label: 'Total Assignments', color: '#3b82f6' },
    completed: { label: 'Completed', color: '#10b981' },
    overdue: { label: 'Overdue', color: '#ef4444' },
  };

  const workloadChartConfig: ChartConfig = {
    workload: { label: 'Workload', color: '#8b5cf6' },
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Active Reviewers</p>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {reviewerMetrics.activeReviewers}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Avg Completion Time</p>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {reviewerMetrics.averageCompletionTime}
            <span className="text-xs font-normal text-muted-foreground ml-1">days</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Overdue Assignments</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {reviewerMetrics.overdueAssignments}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Avg Workload</p>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {reviewerMetrics.averageWorkload}
            <span className="text-xs font-normal text-muted-foreground ml-1">/reviewer</span>
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Breakdown */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Assignment Breakdown</h3>
          <ChartContainer config={{}} className="h-[280px] w-full">
            <BarChart data={assignmentData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
              >
                {assignmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Workload Distribution */}
        {workloadData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Workload Distribution</h3>
            <ChartContainer config={workloadChartConfig} className="h-[280px] w-full">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="workload" 
                  fill="var(--color-workload)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>

      {/* Reviewer Performance Chart */}
      {performanceData.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Top Reviewers Performance</h3>
          <ChartContainer config={performanceChartConfig} className="h-[350px] w-full">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-xs"
              />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="assignments" fill="var(--color-assignments)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="completed" fill="var(--color-completed)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="overdue" fill="var(--color-overdue)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {/* Reviewer Performance Table */}
      {reviewerPerformance.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Reviewer Performance Details</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium">Reviewer</th>
                    <th className="text-right p-3 text-xs font-medium">Total</th>
                    <th className="text-right p-3 text-xs font-medium">Completed</th>
                    <th className="text-right p-3 text-xs font-medium">Overdue</th>
                    <th className="text-right p-3 text-xs font-medium">Avg Time</th>
                    <th className="text-right p-3 text-xs font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewerPerformance.map((reviewer, index) => (
                    <tr 
                      key={reviewer.reviewerId} 
                      className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                    >
                      <td className="p-3 text-xs">{reviewer.reviewerName}</td>
                      <td className="text-right p-3 text-xs font-medium">{reviewer.totalAssignments}</td>
                      <td className="text-right p-3 text-xs text-green-600 dark:text-green-400">
                        {reviewer.completedAssignments}
                      </td>
                      <td className="text-right p-3 text-xs text-red-600 dark:text-red-400">
                        {reviewer.overdueAssignments}
                      </td>
                      <td className="text-right p-3 text-xs">{reviewer.averageCompletionTime} days</td>
                      <td className="text-right p-3 text-xs font-semibold">{reviewer.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
