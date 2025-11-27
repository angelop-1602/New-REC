"use client"

import { useMemo } from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRealtimeProtocols } from "@/hooks/useRealtimeProtocols"
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore"

export function SectionCards() {
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

  // Calculate statistics
  const stats = useMemo(() => {
    const pending = pendingProtocols.length;
    const accepted = acceptedProtocols.length;
    const approved = approvedProtocols.length;
    const archived = archivedProtocols.length;
    const total = pending + accepted + approved + archived;

    // Calculate percentage changes (simplified - can be enhanced with historical data)
    const pendingChange = pending > 0 ? "+" : "";
    const acceptedChange = accepted > 0 ? "+" : "";
    const approvedChange = approved > 0 ? "+" : "";
    const totalChange = total > 0 ? "+" : "";

    return {
      pending,
      accepted,
      approved,
      archived,
      total,
      pendingChange,
      acceptedChange,
      approvedChange,
      totalChange,
    };
  }, [pendingProtocols, acceptedProtocols, approvedProtocols, archivedProtocols]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-2 sm:px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription>
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-2 sm:px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 [&>*]:data-[slot=card]:bg-gradient-to-t [&>*]:data-[slot=card]:shadow-lg [&>*]:data-[slot=card]:from-[#036635]/10 [&>*]:data-[slot=card]:to-card dark:[&>*]:data-[slot=card]:from-[#FECC07]/20 dark:[&>*]:data-[slot=card]:to-card [&>*]:data-[slot=card]:border [&>*]:data-[slot=card]:border-[#036635]/20 dark:[&>*]:data-[slot=card]:border-[#FECC07]/30">
      <Card className="@container/card group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#036635]/40 dark:hover:border-[#FECC07]/50 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <CardHeader>
          <CardDescription className="text-sm font-medium">Pending Protocols</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
            {stats.pending}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-[#036635]/30 dark:border-[#FECC07]/40 bg-[#036635]/5 dark:bg-[#FECC07]/10 transition-all duration-300 group-hover:border-[#036635]/50 dark:group-hover:border-[#FECC07]/60">
              {stats.pending > 0 ? <IconTrendingUp className="text-[#036635] dark:text-[#FECC07]" /> : <IconTrendingDown />}
              <span className="text-[#036635] dark:text-[#FECC07] font-semibold">{stats.pendingChange}{stats.pending}</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Awaiting review {stats.pending > 0 ? <IconTrendingUp className="size-4 text-[#036635] dark:text-[#FECC07]" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Protocols pending initial review
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#036635]/40 dark:hover:border-[#FECC07]/50 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
        <CardHeader>
          <CardDescription className="text-sm font-medium">Accepted Protocols</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
            {stats.accepted}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-[#036635]/30 dark:border-[#FECC07]/40 bg-[#036635]/5 dark:bg-[#FECC07]/10 transition-all duration-300 group-hover:border-[#036635]/50 dark:group-hover:border-[#FECC07]/60">
              {stats.accepted > 0 ? <IconTrendingUp className="text-[#036635] dark:text-[#FECC07]" /> : <IconTrendingDown />}
              <span className="text-[#036635] dark:text-[#FECC07] font-semibold">{stats.acceptedChange}{stats.accepted}</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Under review {stats.accepted > 0 ? <IconTrendingUp className="size-4 text-[#036635] dark:text-[#FECC07]" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Protocols accepted and under review
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#036635]/40 dark:hover:border-[#FECC07]/50 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
        <CardHeader>
          <CardDescription className="text-sm font-medium">Approved Protocols</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
            {stats.approved}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-[#036635]/30 dark:border-[#FECC07]/40 bg-[#036635]/5 dark:bg-[#FECC07]/10 transition-all duration-300 group-hover:border-[#036635]/50 dark:group-hover:border-[#FECC07]/60">
              {stats.approved > 0 ? <IconTrendingUp className="text-[#036635] dark:text-[#FECC07]" /> : <IconTrendingDown />}
              <span className="text-[#036635] dark:text-[#FECC07] font-semibold">{stats.approvedChange}{stats.approved}</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Successfully approved <IconTrendingUp className="size-4 text-[#036635] dark:text-[#FECC07]" />
          </div>
          <div className="text-muted-foreground">Protocols approved for research</div>
        </CardFooter>
      </Card>
      <Card className="@container/card group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#036635]/40 dark:hover:border-[#FECC07]/50 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-225">
        <CardHeader>
          <CardDescription className="text-sm font-medium">Total Protocols</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
            {stats.total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-[#036635]/30 dark:border-[#FECC07]/40 bg-[#036635]/5 dark:bg-[#FECC07]/10 transition-all duration-300 group-hover:border-[#036635]/50 dark:group-hover:border-[#FECC07]/60">
              {stats.total > 0 ? <IconTrendingUp className="text-[#036635] dark:text-[#FECC07]" /> : <IconTrendingDown />}
              <span className="text-[#036635] dark:text-[#FECC07] font-semibold">{stats.totalChange}{stats.total}</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All protocols <IconTrendingUp className="size-4 text-[#036635] dark:text-[#FECC07]" />
          </div>
          <div className="text-muted-foreground">Total protocols in system</div>
        </CardFooter>
      </Card>
    </div>
  )
}
