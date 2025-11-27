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
import { EllipsisVertical, Eye, Archive, Download, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/ui/loading";
import { formatDistanceToNow } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { getStatusBadge } from "@/lib/utils/statusUtils";
import { useRealtimeProtocols } from "@/hooks/useRealtimeProtocols";
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import { Input } from "@/components/ui/input";
import { 
  ChairpersonProtocol, 
  toChairpersonProtocols, 
  getProtocolTitle,
  getProtocolCode,
  getPIName,
  toDate
} from '@/types';

export default function ArchivedProtocolsPage() {
  const router = useRouter();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  // ⚡ Real-time data for archived protocols
  const { protocols: archivedProtocols, loading, error } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    statusFilter: 'archived',
    enabled: true,
  });

  // Transform protocols data using new type system
  const protocols = useMemo(() => {
    const typedProtocols = toChairpersonProtocols(archivedProtocols);
    // Sort by decision date (most recent first), fallback to createdAt
    return typedProtocols.sort((a, b) => {
      const dateA = toDate(a.decisionDetails?.decisionDate || a.createdAt);
      const dateB = toDate(b.decisionDetails?.decisionDate || b.createdAt);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });
  }, [archivedProtocols]);

  const handleViewProtocol = (protocolId: string) => {
    router.push(`/rec/chairperson/protocol/${protocolId}`);
  };

  const handleDownloadDocuments = (protocolId: string) => {
    // TODO: Implement document download functionality
    console.log('Download documents for:', protocolId);
  };

  const handleViewArchiveNotification = (protocolId: string) => {
    // TODO: Implement archive notification view/download
    console.log('View archive notification for:', protocolId);
  };

  const columns: ColumnDef<ChairpersonProtocol>[] = [
    {
      accessorKey: "spupCode",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {getProtocolCode(row.original) || "—"}
        </div>
      ),
    },
    {
      accessorKey: "submittedByName",
      header: "Submitted By",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.submittedByName || getPIName(row.original) || "Unknown"}
        </div>
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => {
        try {
          const dateObj = toDate(row.original.createdAt);
          if (!dateObj) return <span className="text-muted-foreground">—</span>;
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
                handleViewArchiveNotification(row.original.id);
                setOpenDropdownId(null);
              }}>
                <Archive className="mr-2 h-4 w-4" />
                View Archive Notification
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                handleDownloadDocuments(row.original.id);
                setOpenDropdownId(null);
              }}>
                <Download className="mr-2 h-4 w-4" />
                Download Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <PageLoading text="Loading protocols..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <p className="text-destructive mb-4">Error: {error.message || 'Failed to load archived protocols'}</p>
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
            placeholder="Search archived protocols..."
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
            searchPlaceholder="Search archived protocols..."
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

