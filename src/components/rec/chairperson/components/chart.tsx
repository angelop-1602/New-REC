"use client"

import * as React from "react"
import { useMemo, useEffect } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { LoadingSkeleton } from "@/components/ui/loading"
import { useTheme } from "next-themes"

import { useIsMobile } from "@/hooks/useMobile"
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useRealtimeProtocols } from "@/hooks/useRealtimeProtocols"
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore"
import { toDate, FirestoreDate } from '@/types'

export const description = "Protocol submissions over time chart"

const chartConfig = {
  protocols: {
    label: "Protocols",
  },
  count: {
    label: "Protocols",
    color: "var(--primary)",
  },
} satisfies ChartConfig

interface Protocol {
  id: string;
  createdAt: unknown;
  status: string;
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [timeRange, setTimeRange] = React.useState<"day" | "month" | "year">("month")
  const [statusFilter] = React.useState<string>("all") // "all" | "pending" | "accepted" | "approved" | "archived" - fixed to "all"
  const [dateRange] = React.useState<string>("all") // "all" | "7d" | "30d" | "90d" | "month" | "year" - fixed to "all"

  useEffect(() => {
    setMounted(true)
  }, [])

  // ⚡ Real-time data for all protocols
  const { protocols: allProtocols, loading } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: true,
  });

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("day")
    }
  }, [isMobile])

  // Filter protocols based on status and date range
  const filteredProtocols = useMemo(() => {
    if (!allProtocols || allProtocols.length === 0) {
      return []
    }

    let filtered = allProtocols as Protocol[]

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((protocol) => protocol.status === statusFilter)
    }

    // Filter by date range
    if (dateRange !== "all") {
      const cutoffDate = new Date()
      
      switch (dateRange) {
        case "7d":
          cutoffDate.setDate(cutoffDate.getDate() - 7)
          break
        case "30d":
          cutoffDate.setDate(cutoffDate.getDate() - 30)
          break
        case "90d":
          cutoffDate.setDate(cutoffDate.getDate() - 90)
          break
        case "month":
          cutoffDate.setDate(1) // First day of current month
          cutoffDate.setHours(0, 0, 0, 0)
          break
        case "year":
          cutoffDate.setMonth(0, 1) // January 1st of current year
          cutoffDate.setHours(0, 0, 0, 0)
          break
      }

      filtered = filtered.filter((protocol) => {
        if (!protocol.createdAt) return false
        const date = toDate(protocol.createdAt as FirestoreDate)
        if (!date) return false
        return date >= cutoffDate
      })
    }

    return filtered
  }, [allProtocols, statusFilter, dateRange])

  // Process protocols into chart data based on time range
  const chartData = useMemo(() => {
    if (!filteredProtocols || filteredProtocols.length === 0) {
      return []
    }

    const dataMap = new Map<string, number>()

    filteredProtocols.forEach((protocol: Protocol) => {
      if (!protocol.createdAt) return

      const date = toDate(protocol.createdAt as FirestoreDate)
      if (!date) return
      let key: string

      if (timeRange === "day") {
        // Group by day (YYYY-MM-DD)
        key = date.toISOString().split('T')[0]
      } else if (timeRange === "month") {
        // Group by month (YYYY-MM)
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else {
        // Group by year (YYYY)
        key = String(date.getFullYear())
      }

      dataMap.set(key, (dataMap.get(key) || 0) + 1)
    })

    // Convert map to array and sort by date
    const data = Array.from(dataMap.entries())
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return data
  }, [filteredProtocols, timeRange])

  // Calculate totals based on filtered protocols
  const totals = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let dayCount = 0
    let monthCount = 0
    let yearCount = 0

    filteredProtocols.forEach((protocol: Protocol) => {
      if (!protocol.createdAt) return

      const date = toDate(protocol.createdAt as FirestoreDate)
      if (!date) return
      
      // Today
      const protocolDate = new Date(date)
      protocolDate.setHours(0, 0, 0, 0)
      if (protocolDate.getTime() === today.getTime()) {
        dayCount++
      }

      // This month
      if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
        monthCount++
      }

      // This year
      if (date.getFullYear() === today.getFullYear()) {
        yearCount++
      }
    })

    return { day: dayCount, month: monthCount, year: yearCount, total: filteredProtocols.length }
  }, [filteredProtocols])

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Protocol Submissions</CardTitle>
          <CardDescription>Loading protocol data...</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[250px] flex flex-col justify-between space-y-4">
            {/* Simulated axis line */}
            <LoadingSkeleton className="h-4 w-24 rounded-md bg-muted mb-2" />
            {/* Simulated chart area */}
            <LoadingSkeleton className="h-full w-full rounded-xl bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "day":
        return "Per Day"
      case "month":
        return "Per Month"
      case "year":
        return "Per Year"
    }
  }

  const getTotalLabel = () => {
    const statusLabel = statusFilter !== "all" ? ` (${statusFilter})` : ""
    switch (timeRange) {
      case "day":
        return `Today: ${totals.day} protocol${totals.day !== 1 ? 's' : ''}${statusLabel}`
      case "month":
        return `This Month: ${totals.month} protocol${totals.month !== 1 ? 's' : ''}${statusLabel}`
      case "year":
        return `This Year: ${totals.year} protocol${totals.year !== 1 ? 's' : ''}${statusLabel}`
    }
  }

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case "7d":
        return "Last 7 days"
      case "30d":
        return "Last 30 days"
      case "90d":
        return "Last 90 days"
      case "month":
        return "This month"
      case "year":
        return "This year"
      default:
        return "All time"
    }
  }

  const formatDateLabel = (value: string) => {
    if (timeRange === "day") {
      const date = new Date(value)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    } else if (timeRange === "month") {
      const [year, month] = value.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    } else {
      return value
    }
  }

  return (
    <Card className="@container/card transition-all duration-300 hover:shadow-lg border border-[#036635]/10 dark:border-[#FECC07]/20 min-w-0">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent text-lg sm:text-xl">
          Protocol Submissions
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          <span className="hidden @[540px]/card:block">
            {getTotalLabel()} • {getDateRangeLabel()}
          </span>
          <span className="@[540px]/card:hidden">{getTimeRangeLabel()}</span>
        </CardDescription>
        <CardAction className="flex flex-col gap-2 @[540px]/card:flex-row flex-wrap">
          {/* Time Range Grouping */}
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value as "day" | "month" | "year")}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="day">Per Day</ToggleGroupItem>
            <ToggleGroupItem value="month">Per Month</ToggleGroupItem>
            <ToggleGroupItem value="year">Per Year</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as "day" | "month" | "year")}>
            <SelectTrigger
              className="flex w-full @[540px]/card:w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Per Month" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="day" className="rounded-lg">
                Per Day
              </SelectItem>
              <SelectItem value="month" className="rounded-lg">
                Per Month
              </SelectItem>
              <SelectItem value="year" className="rounded-lg">
                Per Year
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 overflow-x-auto">
        {chartData.length === 0 ? (
          <div className="h-[200px] sm:h-[250px] flex items-center justify-center text-muted-foreground">
            No protocol submissions data available
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[200px] sm:h-[250px] w-full min-w-[300px]"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillProtocolsLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#036635" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#036635" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillProtocolsDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FECC07" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#FECC07" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={timeRange === "year" ? 12 : 32}
                tickFormatter={formatDateLabel}
                className="text-sm"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={formatDateLabel}
                    indicator="dot"
                    nameKey="protocols"
                    className="border-[#036635]/20 dark:border-[#FECC07]/30 bg-background/95 backdrop-blur-sm"
                  />
                }
              />
              <Area
                dataKey="count"
                type="natural"
                fill={mounted && theme === "dark" ? "url(#fillProtocolsDark)" : "url(#fillProtocolsLight)"}
                stroke={mounted && theme === "dark" ? "#FECC07" : "#036635"}
                stackId="a"
                animationDuration={800}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
