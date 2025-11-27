"use client";

import { useMemo } from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileClock, CheckCircle2, Archive, FileText } from "lucide-react";

interface DashboardStatsProps {
  submissions: any[];
  loading?: boolean;
}

export function DashboardStats({ submissions, loading = false }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const pending = submissions.filter((s) => 
      s.status === "pending" || s.status === "draft" || s.status === "submitted"
    ).length;
    
    const underReview = submissions.filter((s) => 
      s.status === "accepted" || s.status === "under_review"
    ).length;
    
    const approved = submissions.filter((s) => 
      s.status === "approved"
    ).length;
    
    const archived = submissions.filter((s) => 
      s.status === "archived"
    ).length;
    
    const total = submissions.length;

    return {
      pending,
      underReview,
      approved,
      archived,
      total,
    };
  }, [submissions]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#036635]/40 dark:hover:border-[#FECC07]/50 animate-in fade-in slide-in-from-bottom-2 duration-500 bg-gradient-to-t from-[#036635]/10 to-card dark:from-[#FECC07]/20 dark:to-card border border-[#036635]/20 dark:border-[#FECC07]/30">
        <CardHeader>
          <CardDescription className="text-sm font-medium flex items-center gap-2">
            <FileClock className="w-4 h-4 text-[#036635] dark:text-[#FECC07]" />
            Pending
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
            {stats.pending}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-[#036635]/30 dark:border-[#FECC07]/40 bg-[#036635]/5 dark:bg-[#FECC07]/10">
              {stats.pending > 0 ? (
                <IconTrendingUp className="text-[#036635] dark:text-[#FECC07]" />
              ) : (
                <IconTrendingDown />
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Awaiting review
          </div>
          <div className="text-muted-foreground">
            Protocols pending initial review
          </div>
        </CardFooter>
      </Card>

      <Card className="group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#036635]/40 dark:hover:border-[#FECC07]/50 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 bg-gradient-to-t from-[#036635]/10 to-card dark:from-[#FECC07]/20 dark:to-card border border-[#036635]/20 dark:border-[#FECC07]/30">
        <CardHeader>
          <CardDescription className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#036635] dark:text-[#FECC07]" />
            Under Review
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
            {stats.underReview}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-[#036635]/30 dark:border-[#FECC07]/40 bg-[#036635]/5 dark:bg-[#FECC07]/10">
              {stats.underReview > 0 ? (
                <IconTrendingUp className="text-[#036635] dark:text-[#FECC07]" />
              ) : (
                <IconTrendingDown />
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Being reviewed
          </div>
          <div className="text-muted-foreground">
            Protocols currently under review
          </div>
        </CardFooter>
      </Card>

      <Card className="group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#036635]/40 dark:hover:border-[#FECC07]/50 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 bg-gradient-to-t from-[#036635]/10 to-card dark:from-[#FECC07]/20 dark:to-card border border-[#036635]/20 dark:border-[#FECC07]/30">
        <CardHeader>
          <CardDescription className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#036635] dark:text-[#FECC07]" />
            Approved
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
            {stats.approved}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-[#036635]/30 dark:border-[#FECC07]/40 bg-[#036635]/5 dark:bg-[#FECC07]/10">
              {stats.approved > 0 ? (
                <IconTrendingUp className="text-[#036635] dark:text-[#FECC07]" />
              ) : (
                <IconTrendingDown />
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Successfully approved
          </div>
          <div className="text-muted-foreground">
            Protocols approved for research
          </div>
        </CardFooter>
      </Card>

      <Card className="group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#036635]/40 dark:hover:border-[#FECC07]/50 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-225 bg-gradient-to-t from-[#036635]/10 to-card dark:from-[#FECC07]/20 dark:to-card border border-[#036635]/20 dark:border-[#FECC07]/30">
        <CardHeader>
          <CardDescription className="text-sm font-medium flex items-center gap-2">
            <Archive className="w-4 h-4 text-[#036635] dark:text-[#FECC07]" />
            Total
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
            {stats.total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-[#036635]/30 dark:border-[#FECC07]/40 bg-[#036635]/5 dark:bg-[#FECC07]/10">
              {stats.total > 0 ? (
                <IconTrendingUp className="text-[#036635] dark:text-[#FECC07]" />
              ) : (
                <IconTrendingDown />
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All protocols
          </div>
          <div className="text-muted-foreground">
            Total protocols submitted
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

