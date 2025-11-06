"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/custom/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Eye, FileText, Download, Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllSubmissionsByStatus } from "@/lib/firebase/firestore";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { getStatusBadge } from "@/lib/utils/statusUtils";

// Define the archived protocol type
interface ArchivedProtocol {
  id: string;
  applicationID: string;
  title: string;
  spupCode: string;
  submitBy: string;
  submittedByName?: string;
  status: string;
  createdAt: any;
  approvedAt: any;
  archivedAt?: any;
  information?: any;
}

export default function ArchivedProtocolsPage() {
  const router = useRouter();
  const [protocols, setProtocols] = useState<ArchivedProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    fetchArchivedProtocols();
  }, []);

  const fetchArchivedProtocols = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const archivedProtocols = await getAllSubmissionsByStatus('archived');
      
      // Transform the data to include proper typing
      const transformedProtocols: ArchivedProtocol[] = archivedProtocols.map((protocol: any) => ({
        id: protocol.id,
        applicationID: protocol.applicationID || protocol.id,
        title: protocol.title || protocol.information?.general_information?.protocol_title || 'Untitled Protocol',
        spupCode: protocol.spupCode || 'N/A',
        submitBy: protocol.submitBy || 'Unknown',
        submittedByName: protocol.information?.general_information?.principal_investigator?.name,
        status: protocol.status || 'archived',
        createdAt: protocol.createdAt,
        approvedAt: protocol.approvedAt,
        archivedAt: protocol.archivedAt,
        information: protocol.information
      }));
      
      // Sort by archived date (most recent first), fallback to approved date
      transformedProtocols.sort((a, b) => {
        const dateA = a.archivedAt ? (a.archivedAt.toDate ? a.archivedAt.toDate() : new Date(a.archivedAt)) : 
                      (a.approvedAt ? (a.approvedAt.toDate ? a.approvedAt.toDate() : new Date(a.approvedAt)) : new Date(0));
        const dateB = b.archivedAt ? (b.archivedAt.toDate ? b.archivedAt.toDate() : new Date(b.archivedAt)) : 
                      (b.approvedAt ? (b.approvedAt.toDate ? b.approvedAt.toDate() : new Date(b.approvedAt)) : new Date(0));
        return dateB.getTime() - dateA.getTime();
      });
      
      setProtocols(transformedProtocols);
    } catch (err) {
      console.error('Error fetching archived protocols:', err);
      setError('Failed to load archived protocols');
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (date: any) => {
    if (!date) return "—";
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "—";
    }
  };

  const columns: ColumnDef<ArchivedProtocol>[] = [
    {
      accessorKey: "spupCode",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.spupCode || "—"}
        </div>
      ),
    },
    {
      accessorKey: "submittedByName",
      header: "Submitted By",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.submittedByName || 
           row.original.information?.general_information?.principal_investigator?.name || 
           "Unknown"}
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: "Protocol Title",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">
          {row.original.title || row.original.information?.general_information?.protocol_title || "Untitled Protocol"}
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
        const date = row.original.createdAt;
        if (!date) return <span className="text-muted-foreground">—</span>;
        
        try {
          const dateObj = date.toDate ? date.toDate() : new Date(date);
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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchArchivedProtocols}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archived Protocols</h1>
          <p className="text-muted-foreground">
            View and manage all archived research protocols
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Archived Protocols</CardTitle>
          <CardDescription>
            Protocols that have been completed and archived
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={protocols}
            searchPlaceholder="Search archived protocols..."
            showSearch={true}
            showPagination={true}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}

