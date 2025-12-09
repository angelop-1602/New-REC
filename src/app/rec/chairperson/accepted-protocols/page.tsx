"use client"

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/custom/data-table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Eye, UserPlus, MessageSquare, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { LoadingSkeleton } from "@/components/ui/loading";
import { formatDistanceToNow } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { getStatusBadge } from "@/lib/utils/statusUtils";
import { useRealtimeProtocols } from "@/hooks/useRealtimeProtocols";
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import { Input } from "@/components/ui/input";
import { 
  ChairpersonProtocol, 
  toChairpersonProtocols, 
  sortProtocolsByDate,
  getProtocolTitle,
  getProtocolCode,
  toDate
} from '@/types';

export default function AcceptedProtocolsPage() {
  const router = useRouter();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  // ⚡ Real-time data for accepted protocols only
  const { protocols: acceptedProtocols, loading, error } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    statusFilter: 'accepted',
    enabled: true,
  });

  // Sort protocols by creation date (most recent first) - Using type-safe utilities
  const protocols = useMemo(() => {
    const typedProtocols = toChairpersonProtocols(acceptedProtocols);
    return sortProtocolsByDate(typedProtocols);
  }, [acceptedProtocols]);

  const handleViewProtocol = (protocolId: string) => {
    router.push(`/rec/chairperson/protocol/${protocolId}`);
  };

  const handleAssignReviewer = (protocolId: string) => {
    router.push(`/rec/chairperson/protocol/${protocolId}`);
  };

  const handleSendMessage = (protocolId: string) => {
    router.push(`/rec/chairperson/protocol/${protocolId}`);
  };

  const getProtocolStatusBadge = (protocol: ChairpersonProtocol) => {
    return getStatusBadge(
      protocol.status,
      protocol.decision || protocol.decisionDetails?.decision,
      false
    );
  };

  const columns: ColumnDef<ChairpersonProtocol>[] = [
    {
      accessorKey: "applicationID",
      header: "Application ID",
      cell: ({ row }) => (
        <div className="font-medium">{getProtocolCode(row.original)}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "Protocol Title",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">
          {getProtocolTitle(row.original)}
        </div>
      ),
    },
    {
      accessorKey: "tempProtocolCode",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.spupCode || row.original.tempProtocolCode || "—"}
        </div>
      ),
    },
    {
      accessorKey: "submittedByName",
      header: "Submitted By",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.submittedByName || 
           (row.original.information?.general_information as {principal_investigator?: {name?: string}})?.principal_investigator?.name || 
           "Unknown"}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Accepted",
      cell: ({ row }) => {
        try {
          const dateObj = toDate(row.original.createdAt);
          return (
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(dateObj, { addSuffix: true })}
            </div>
          );
        } catch {
          return <span className="text-muted-foreground">—</span>;
        }
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getProtocolStatusBadge(row.original),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const dropdownId = `actions-${row.original.id}`;
        return (
          <DropdownMenu 
            open={openDropdownId === dropdownId}
            onOpenChange={(open) => setOpenDropdownId(open ? dropdownId : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                handleViewProtocol(row.original.id);
                setOpenDropdownId(null);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                handleAssignReviewer(row.original.id);
                setOpenDropdownId(null);
              }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Reviewer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                handleSendMessage(row.original.id);
                setOpenDropdownId(null);
              }}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
        <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 dark:to-card p-6">
            <div className="relative flex-1 max-w-sm">
              <LoadingSkeleton className="h-10 w-full rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pb-6">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <LoadingSkeleton className="h-4 w-32 rounded-md" />
                  <LoadingSkeleton className="h-4 w-64 rounded-md" />
                  <LoadingSkeleton className="h-4 w-24 rounded-md" />
                  <LoadingSkeleton className="h-4 w-28 rounded-md ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <p className="text-destructive mb-4">Error: {error.message || 'Failed to load protocols'}</p>
        <p className="text-sm text-muted-foreground">Real-time updates will resume automatically</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 overflow-hidden p-0">
        <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 dark:to-card p-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#036635] dark:text-[#FECC07] h-4 w-4" />
          <Input
            placeholder="Search accepted protocols..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 border-[#036635]/20 dark:border-[#FECC07]/30 focus:border-[#036635] dark:focus:border-[#FECC07] focus:ring-[#036635]/20 dark:focus:ring-[#FECC07]/20 transition-all duration-300"
          />
        </div>
        </CardHeader>
        <CardContent className="p-6 pb-6">
          <DataTable
            columns={columns}
            data={protocols}
            searchPlaceholder="Search accepted protocols..."
            showSearch={false}
            showPagination={true}
            pageSize={10}
            externalSearchValue={searchValue}
            onSearchChange={setSearchValue}
          />
        </CardContent>
      </Card>
    </div>
  );
}

