"use client";

import React from 'react';
import { SystemHealthMetrics, ErrorTrend } from '@/types/analytics.types';
import Progress from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { AlertCircle, CheckCircle2, Activity, Database, Zap, Shield, Users } from 'lucide-react';

interface SystemHealthAnalyticsProps {
  systemHealthMetrics: SystemHealthMetrics;
  errorTrends: ErrorTrend[];
}

export function SystemHealthAnalytics({
  systemHealthMetrics,
  errorTrends,
}: SystemHealthAnalyticsProps) {
  // Prepare error trends data
  const errorTrendsData = errorTrends.length > 0 
    ? errorTrends.map(trend => ({
        date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        errors: trend.errors,
        usersAffected: trend.usersAffected,
      }))
    : [
        { date: 'No data', errors: 0, usersAffected: 0 }
      ];

  // Health metrics data for bar chart
  const healthMetricsData = [
    { metric: 'Data Completeness', value: systemHealthMetrics.dataCompleteness, color: '#10b981' },
    { metric: 'Cache Hit Rate', value: systemHealthMetrics.cacheHitRate, color: '#3b82f6' },
    { metric: 'System Reliability', value: 100 - systemHealthMetrics.errorRate, color: '#10b981' },
    { metric: 'API Success Rate', value: systemHealthMetrics.apiSuccessRate || 100, color: '#10b981' },
    { metric: 'System Uptime', value: systemHealthMetrics.systemUptime || 99.9, color: '#10b981' },
    { metric: 'Database Health', value: systemHealthMetrics.databaseHealth || 100, color: '#10b981' },
  ];

  // Error breakdown pie chart data
  const errorTypesData = systemHealthMetrics.errorTypes 
    ? Object.entries(systemHealthMetrics.errorTypes)
        .map(([type, count]) => ({
          name: type,
          value: count,
        }))
        .filter(item => item.value > 0)
    : [];

  // System health radar chart data
  const healthRadarData = [
    {
      category: 'Data Quality',
      value: systemHealthMetrics.dataCompleteness,
      fullMark: 100,
    },
    {
      category: 'Performance',
      value: Math.max(0, 100 - (systemHealthMetrics.queryPerformance / 100)),
      fullMark: 100,
    },
    {
      category: 'Reliability',
      value: 100 - systemHealthMetrics.errorRate,
      fullMark: 100,
    },
    {
      category: 'Uptime',
      value: systemHealthMetrics.systemUptime || 99.9,
      fullMark: 100,
    },
    {
      category: 'API Health',
      value: systemHealthMetrics.apiSuccessRate || 100,
      fullMark: 100,
    },
    {
      category: 'Database',
      value: systemHealthMetrics.databaseHealth || 100,
      fullMark: 100,
    },
  ];

  const errorTrendsChartConfig: ChartConfig = {
    errors: { label: 'Errors', color: '#ef4444' },
    usersAffected: { label: 'Users Affected', color: '#f59e0b' },
  };

  // Calculate overall health score
  const overallHealthScore = Math.round(
    (systemHealthMetrics.dataCompleteness +
     (systemHealthMetrics.apiSuccessRate || 100) +
     (systemHealthMetrics.systemUptime || 99.9) +
     (100 - systemHealthMetrics.errorRate) +
     (systemHealthMetrics.databaseHealth || 100)) / 5
  );

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <div className="p-6 rounded-lg border border-border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#036635] dark:text-[#FECC07] mb-2">
              Overall System Health
            </h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive system health score based on all metrics
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-[#036635] dark:text-[#FECC07]">
              {overallHealthScore}%
            </div>
            <div className="flex items-center gap-1 mt-2">
              {overallHealthScore >= 95 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Excellent</span>
                </>
              ) : overallHealthScore >= 85 ? (
                <>
                  <Activity className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600">Good</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">Needs Attention</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-muted-foreground">Data Completeness</p>
          </div>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {systemHealthMetrics.dataCompleteness}%
          </p>
          <p className="text-xs text-muted-foreground">
            {systemHealthMetrics.missingDataPoints} missing
          </p>
        </div>
        
        <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-xs text-muted-foreground">Error Rate</p>
          </div>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {systemHealthMetrics.errorRate}%
          </p>
          <p className="text-xs text-muted-foreground">
            {systemHealthMetrics.dataValidationErrors} errors
          </p>
        </div>
        
        <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-yellow-600" />
            <p className="text-xs text-muted-foreground">Load Time</p>
          </div>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {systemHealthMetrics.dashboardLoadTime}ms
          </p>
          <p className="text-xs text-muted-foreground">Average</p>
        </div>
        
        <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-purple-600" />
            <p className="text-xs text-muted-foreground">Cache Hit Rate</p>
          </div>
          <p className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
            {systemHealthMetrics.cacheHitRate}%
          </p>
          <p className="text-xs text-muted-foreground">Efficiency</p>
        </div>
        
        {systemHealthMetrics.crashFreeRate !== undefined && (
          <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Crash-Free Rate</p>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {systemHealthMetrics.crashFreeRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Stability</p>
          </div>
        )}
        
        {systemHealthMetrics.activeUsers !== undefined && (
          <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">Active Users</p>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {systemHealthMetrics.activeUsers}
            </p>
            <p className="text-xs text-muted-foreground">In Period</p>
          </div>
        )}
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {systemHealthMetrics.totalProtocols !== undefined && (
          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <p className="text-xs text-muted-foreground mb-1">Total Protocols</p>
            <p className="text-xl font-bold text-[#036635] dark:text-[#FECC07]">
              {systemHealthMetrics.totalProtocols}
            </p>
          </div>
        )}
        
        {systemHealthMetrics.totalReviewers !== undefined && (
          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <p className="text-xs text-muted-foreground mb-1">Total Reviewers</p>
            <p className="text-xl font-bold text-[#036635] dark:text-[#FECC07]">
              {systemHealthMetrics.totalReviewers}
            </p>
          </div>
        )}
        
        {systemHealthMetrics.systemUptime !== undefined && (
          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <p className="text-xs text-muted-foreground mb-1">System Uptime</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {systemHealthMetrics.systemUptime.toFixed(2)}%
            </p>
          </div>
        )}
        
        {systemHealthMetrics.apiSuccessRate !== undefined && (
          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <p className="text-xs text-muted-foreground mb-1">API Success Rate</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {systemHealthMetrics.apiSuccessRate.toFixed(1)}%
            </p>
          </div>
        )}
        
        <div className="p-3 rounded-lg border border-border bg-muted/20">
          <p className="text-xs text-muted-foreground mb-1">Query Performance</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {systemHealthMetrics.queryPerformance}ms
          </p>
        </div>
        
        <div className="p-3 rounded-lg border border-border bg-muted/20">
          <p className="text-xs text-muted-foreground mb-1">Data Freshness</p>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {systemHealthMetrics.dataFreshness}h
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Radar Chart */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">System Health Overview</h3>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <RadarChart data={healthRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" className="text-xs" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
              <Radar
                name="Health Score"
                dataKey="value"
                stroke="#036635"
                fill="#036635"
                fillOpacity={0.6}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </RadarChart>
          </ChartContainer>
        </div>

        {/* Health Metrics Bar Chart */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Health Metrics Comparison</h3>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <BarChart data={healthMetricsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="metric" 
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={100}
                className="text-xs"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                domain={[0, 100]}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
              >
                {healthMetricsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Error Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Trends */}
        {errorTrends.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Error Trends Over Time</h3>
            <ChartContainer config={errorTrendsChartConfig} className="h-[300px] w-full">
              <AreaChart data={errorTrendsData}>
                <defs>
                  <linearGradient id="fillErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillUsersAffected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
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
                  dataKey="errors" 
                  stroke="#ef4444"
                  fill="url(#fillErrors)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="usersAffected" 
                  stroke="#f59e0b"
                  fill="url(#fillUsersAffected)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}

        {/* Error Types Breakdown */}
        {errorTypesData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Error Types Distribution</h3>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={errorTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {errorTypesData.map((entry, index) => {
                    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        )}
      </div>

      {/* Data Quality Progress Bars */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Data Quality Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data Completeness</span>
              <span className="font-semibold">{systemHealthMetrics.dataCompleteness}%</span>
            </div>
            <Progress 
              value={systemHealthMetrics.dataCompleteness} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cache Hit Rate</span>
              <span className="font-semibold">{systemHealthMetrics.cacheHitRate}%</span>
            </div>
            <Progress 
              value={systemHealthMetrics.cacheHitRate} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">System Reliability</span>
              <span className="font-semibold">{100 - systemHealthMetrics.errorRate}%</span>
            </div>
            <Progress 
              value={100 - systemHealthMetrics.errorRate} 
              className="h-2"
            />
          </div>

          {systemHealthMetrics.apiSuccessRate !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API Success Rate</span>
                <span className="font-semibold">{systemHealthMetrics.apiSuccessRate.toFixed(1)}%</span>
              </div>
              <Progress 
                value={systemHealthMetrics.apiSuccessRate} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
