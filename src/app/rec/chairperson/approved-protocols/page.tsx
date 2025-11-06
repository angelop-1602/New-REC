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
import { EllipsisVertical, Eye, FileText, Download, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllSubmissionsByStatus } from "@/lib/firebase/firestore";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { getStatusBadge } from "@/lib/utils/statusUtils";

// Define the approved protocol type
interface ApprovedProtocol {
  id: string;
  applicationID: string;
  title: string;
  spupCode: string;
  submitBy: string;
  submittedByName?: string;
  status: string;
  createdAt: any;
  approvedAt: any;
  information?: any;
}

export default function ApprovedProtocolsPage() {
  const router = useRouter();
  const [protocols, setProtocols] = useState<ApprovedProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovedProtocols();
  }, []);

  const fetchApprovedProtocols = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const approvedProtocols = await getAllSubmissionsByStatus('approved');
      
      // Transform the data to include proper typing
      const transformedProtocols: ApprovedProtocol[] = approvedProtocols.map((protocol: any) => ({
        id: protocol.id,
        applicationID: protocol.applicationID || protocol.id,
        title: protocol.title || protocol.information?.general_information?.protocol_title || 'Untitled Protocol',
        spupCode: protocol.spupCode || 'N/A',
        submitBy: protocol.submitBy || 'Unknown',
        submittedByName: protocol.information?.general_information?.principal_investigator?.name,
        status: protocol.status || 'approved',
        createdAt: protocol.createdAt,
        approvedAt: protocol.approvedAt,
        information: protocol.information
      }));
      
      setProtocols(transformedProtocols);
    } catch (err) {
      console.error('Error fetching approved protocols:', err);
      setError('Failed to load approved protocols');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProtocol = (protocolId: string) => {
    router.push(`/rec/chairperson/protocol/${protocolId}`);
  };

  const handleGenerateDocuments = (protocolId: string) => {
    // Navigate to document generation page
    router.push(`/rec/chairperson/protocol/${protocolId}/generate-documents`);
  };

  const handleDownloadDocuments = (protocolId: string) => {
    // TODO: Implement document download functionality
    console.log('Download documents for:', protocolId);
  };

  const handleSendMessage = (protocolId: string) => {
    // TODO: Implement message sending
    console.log('Send message for:', protocolId);
  };

  const getProtocolStatusBadge = (protocol: ApprovedProtocol) => {
    // Use centralized status utility
    return getStatusBadge(
      protocol.status,
      protocol.decision || protocol.decisionDetails?.decision,
      false
    );
  };

  const columns: ColumnDef<ApprovedProtocol>[] = [
    {
      accessorKey: "applicationID",
      header: "Application ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.applicationID || row.original.id}</div>
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
      accessorKey: "spupCode",
      header: "SPUP Code",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.spupCode || "—"}
        </div>
      ),
    },
    {
      accessorKey: "submittedByName",
      header: "Principal Investigator",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.submittedByName || 
           row.original.information?.general_information?.principal_investigator?.name || 
           "Unknown"}
        </div>
      ),
    },
    {
      accessorKey: "approvedAt",
      header: "Approved",
      cell: ({ row }) => {
        const date = row.original.approvedAt;
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
                handleGenerateDocuments(row.original.id);
                setOpenDropdownId(null);
              }}>
                <FileText className="mr-2 h-4 w-4" />
                Generate Documents
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                handleDownloadDocuments(row.original.id);
                setOpenDropdownId(null);
              }}>
                <Download className="mr-2 h-4 w-4" />
                Download Documents
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
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchApprovedProtocols}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approved Protocols</h1>
          <p className="text-muted-foreground">
            Manage and monitor all approved research protocols
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Approved Protocols</CardTitle>
          <CardDescription>
            Protocols that have been approved and are in progress or awaiting reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={protocols}
            searchPlaceholder="Search approved protocols..."
            showSearch={true}
            showPagination={true}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
