"use client"

import * as React from "react"
import { useMemo, useEffect } from "react"
import { useTheme } from "next-themes"
import { Bar, BarChart, CartesianGrid, XAxis, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useRealtimeProtocols } from "@/hooks/useRealtimeProtocols"
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore"
import { cn } from "@/lib/utils"

export const description = "Protocol status distribution chart"

const chartConfig = {
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-2))", // SPUP Yellow
  },
  accepted: {
    label: "Accepted",
    color: "hsl(var(--chart-1))", // SPUP Green
  },
  approved: {
    label: "Approved",
    color: "hsl(var(--chart-1))", // SPUP Green
  },
  archived: {
    label: "Archived",
    color: "hsl(var(--chart-2))", // SPUP Yellow
  },
} satisfies ChartConfig

// Gradient mapping for each status in the chart
const statusGradients: Record<string, string> = {
  "Pending": "url(#yellowGradient)",
  "Accepted": "url(#greenGradient)",
  "Approved": "url(#greenGradientDark)",
  "Archived": "url(#yellowGradientDark)",
}

export function ProtocolCharts() {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const isDark = theme === 'dark'
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // ⚡ Real-time data for all protocol statuses
  const { protocols: pendingProtocols, loading: pendingLoading } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    statusFilter: 'pending',
    enabled: true,
  });

  const { protocols: acceptedProtocols, loading: acceptedLoading } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    statusFilter: 'accepted',
    enabled: true,
  });

  const { protocols: approvedProtocols, loading: approvedLoading } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    statusFilter: 'approved',
    enabled: true,
  });

  const { protocols: archivedProtocols, loading: archivedLoading } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    statusFilter: 'archived',
    enabled: true,
  });

  const loading = pendingLoading || acceptedLoading || approvedLoading || archivedLoading;

  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("pending")

  // Calculate totals
  const total = useMemo(
    () => ({
      pending: pendingProtocols.length,
      accepted: acceptedProtocols.length,
      approved: approvedProtocols.length,
      archived: archivedProtocols.length,
    }),
    [pendingProtocols, acceptedProtocols, approvedProtocols, archivedProtocols]
  )

  // Prepare chart data
  const chartData = useMemo(() => {
    return [
      { status: "Pending", count: total.pending },
      { status: "Accepted", count: total.accepted },
      { status: "Approved", count: total.approved },
      { status: "Archived", count: total.archived },
    ]
  }, [total])

  if (loading) {
    return (
      <Card className="py-0">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle>Protocol Status Distribution</CardTitle>
            <CardDescription>
              Loading protocol statistics...
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <div className="h-[250px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="py-0 transition-all duration-300 hover:shadow-lg border border-[#036635]/10 dark:border-[#FECC07]/20 min-w-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row border-[#036635]/10 dark:border-[#FECC07]/20">
        <div className="flex flex-1 flex-col justify-center gap-1 px-4 sm:px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent text-lg sm:text-xl">
            Protocol Status Distribution
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Real-time protocol counts by status
          </CardDescription>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap">
          {(["pending", "accepted", "approved", "archived"] as const).map((key) => {
            const chart = key as keyof typeof chartConfig
            const isActive = activeChart === chart
            return (
              <button
                key={chart}
                data-active={isActive}
                className={cn(
                  "relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-3 sm:px-6 py-3 sm:py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 transition-all duration-300 hover:scale-[1.02] min-w-[25%] sm:min-w-0",
                  isActive 
                    ? "bg-[#036635]/10 dark:bg-[#FECC07]/20 text-[#036635] dark:text-[#FECC07] border-[#036635]/10 dark:border-[#FECC07]/20"
                    : "border-[#036635]/10 dark:border-[#FECC07]/20 hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10"
                )}
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs font-medium">
                  {chartConfig[chart].label}
                </span>
                <span className={cn(
                  "text-base sm:text-lg lg:text-3xl leading-none font-bold transition-all duration-300",
                  isActive && "scale-105 bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent"
                )}>
                  {total[chart].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 overflow-x-auto">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[200px] sm:h-[250px] w-full min-w-[300px]"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <defs>
              {/* Pending - Light theme color gradient */}
              <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={mounted && isDark ? "#FECC07" : "#036635"} stopOpacity={0.6} />
                <stop offset="95%" stopColor={mounted && isDark ? "#FECC07" : "#036635"} stopOpacity={0.15} />
              </linearGradient>
              {/* Accepted - Main theme color gradient */}
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={mounted && isDark ? "#FECC07" : "#036635"} stopOpacity={0.9} />
                <stop offset="95%" stopColor={mounted && isDark ? "#FECC07" : "#036635"} stopOpacity={0.2} />
              </linearGradient>
              {/* Approved - Darker theme color gradient */}
              <linearGradient id="greenGradientDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={mounted && isDark ? "#E6B800" : "#024A28"} stopOpacity={0.9} />
                <stop offset="95%" stopColor={mounted && isDark ? "#E6B800" : "#024A28"} stopOpacity={0.2} />
              </linearGradient>
              {/* Archived - Muted theme color gradient */}
              <linearGradient id="yellowGradientDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={mounted && isDark ? "#FECC07" : "#036635"} stopOpacity={0.5} />
                <stop offset="95%" stopColor={mounted && isDark ? "#FECC07" : "#036635"} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-sm"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px] border-[#036635]/20 dark:border-[#FECC07]/30 bg-background/95 backdrop-blur-sm"
                  nameKey="count"
                />
              }
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={800}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={statusGradients[entry.status] || "url(#greenGradient)"}
                  className="transition-all duration-300 hover:opacity-90"
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
