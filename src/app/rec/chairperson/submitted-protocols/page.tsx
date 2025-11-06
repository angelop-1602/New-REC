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
import { EllipsisVertical, Eye, UserPlus, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllSubmissionsByStatus } from "@/lib/firebase/firestore";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { getStatusBadge } from "@/lib/utils/statusUtils";

// Define the protocol type
interface Protocol {
  id: string;
  applicationID: string;
  title: string;
  submitBy: string;
  submittedByName?: string;
  status: string;
  createdAt: any;
  tempProtocolCode?: string;
  spupCode?: string;
  information?: any;
  decision?: string;
  decisionDetails?: {
    decision?: string;
  };
}

export default function SubmittedProtocolsPage() {
  const router = useRouter();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    fetchProtocols();
  }, []);

  const fetchProtocols = async () => {
    try {
      setLoading(true);
      // Fetch both pending and accepted protocols (not yet approved)
      const [pendingProtocols, acceptedProtocols] = await Promise.all([
        getAllSubmissionsByStatus('pending'),
        getAllSubmissionsByStatus('accepted')
      ]);
      
      const allProtocols = [...pendingProtocols, ...acceptedProtocols];
      
      // Sort by creation date (most recent first)
      allProtocols.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setProtocols(allProtocols);
    } catch (err) {
      console.error('Error fetching protocols:', err);
      setError('Failed to load protocols');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProtocol = (protocolId: string) => {
    router.push(`/rec/chairperson/protocol/${protocolId}`);
  };

  const handleAssignReviewer = (protocolId: string) => {
    // TODO: Implement reviewer assignment
    console.log('Assign reviewer for:', protocolId);
  };

  const handleSendMessage = (protocolId: string) => {
    // TODO: Implement message sending
    console.log('Send message for:', protocolId);
  };

  const getProtocolStatusBadge = (protocol: Protocol) => {
    // Use centralized status utility
    return getStatusBadge(
      protocol.status,
      protocol.decision || protocol.decisionDetails?.decision,
      false // hasReviewers - can be enhanced to check reviewers if needed
    );
  };

  const columns: ColumnDef<Protocol>[] = [
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
           row.original.information?.general_information?.principal_investigator?.name || 
           "Unknown"}
        </div>
      ),
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
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchProtocols}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submitted Protocols</h1>
          <p className="text-muted-foreground">
            Review and manage submitted research protocols
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Submitted Protocols</CardTitle>
          <CardDescription>
            Protocols pending review and assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={protocols}
            searchPlaceholder="Search protocols..."
            showSearch={true}
            showPagination={true}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
