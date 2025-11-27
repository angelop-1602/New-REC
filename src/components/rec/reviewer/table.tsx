import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EllipsisVertical, View, Pencil, FileText, Clock, CheckCircle, AlertCircle} from "lucide-react";
import { toDate, FirestoreDate } from '@/types';

interface ReviewerTableProps {
  protocols: any[];
  tabType: string;
  onProtocolAction: (protocolId: string, action: string) => void;
}

export default function ReviewerTable({ protocols, tabType, onProtocolAction }: ReviewerTableProps) {
  // State to track which dropdown is open
  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);

  const formatDate = (date: unknown) => {
    if (!date) return 'N/A';
    const dateObj = toDate(date as FirestoreDate);
    if (!dateObj) return 'N/A';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (deadline: unknown) => {
    if (!deadline) return 'N/A';
    const deadlineDate = toDate(deadline as FirestoreDate);
    if (!deadlineDate) return 'N/A';
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days remaining`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-[#036635]/10 dark:bg-[#FECC07]/20 text-[#036635] dark:text-[#FECC07] border-[#036635]/20 dark:border-[#FECC07]/30"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'submitted':
        return <Badge variant="default" className="bg-[#036635]/10 dark:bg-[#FECC07]/20 text-[#036635] dark:text-[#FECC07] border-[#036635]/20 dark:border-[#FECC07]/30"><CheckCircle className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'draft':
        return <Badge variant="secondary" className="bg-[#036635]/5 dark:bg-[#FECC07]/10 text-[#036635] dark:text-[#FECC07] border-[#036635]/20 dark:border-[#FECC07]/30"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-border"><Clock className="w-3 h-3 mr-1" />Not Started</Badge>;
      case 'resubmitted':
        return <Badge variant="outline" className="bg-[#036635]/5 dark:bg-[#FECC07]/10 text-[#036635] dark:text-[#FECC07] border-[#036635]/30 dark:border-[#FECC07]/40"><FileText className="w-3 h-3 mr-1" />Re-submitted</Badge>;
      case 'returned':
        return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/30"><AlertCircle className="w-3 h-3 mr-1" />Returned</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-[#036635]/10 dark:bg-[#FECC07]/20 text-[#036635] dark:text-[#FECC07] border-[#036635]/20 dark:border-[#FECC07]/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/30"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case 'reassigned':
        return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/30"><AlertCircle className="w-3 h-3 mr-1" />Reassigned</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">{status}</Badge>;
    }
  };

  const getActionButtons = (protocol: any) => {
    const dropdownId = `${tabType}-${protocol.protocolId}`;
    
    // No actions for reassigned protocols (read-only)
    if (tabType === 'reassignedProtocols') {
      return null;
    }
    
    switch (tabType) {
      case 'submittedProtocols':
        return (
          <DropdownMenu 
            open={openDropdownId === dropdownId}
            onOpenChange={(open) => setOpenDropdownId(open ? dropdownId : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => {
                onProtocolAction(protocol.protocolId, 'review');
                setOpenDropdownId(null);
              }}>
                <View className="w-4 h-4 mr-2" />
                Review
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      case 'reSubmittedProtocols':
        return (
          <DropdownMenu 
            open={openDropdownId === dropdownId}
            onOpenChange={(open) => setOpenDropdownId(open ? dropdownId : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => {
                onProtocolAction(protocol.protocolId, 'review');
                setOpenDropdownId(null);
              }}>
                <View className="w-4 h-4 mr-2" />
                Review
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      case 'returnedProtocols':
        return (
          <DropdownMenu 
            open={openDropdownId === dropdownId}
            onOpenChange={(open) => setOpenDropdownId(open ? dropdownId : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => {
                onProtocolAction(protocol.protocolId, 'edit');
                setOpenDropdownId(null);
              }}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit & Resubmit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                onProtocolAction(protocol.protocolId, 'view');
                setOpenDropdownId(null);
              }}>
                <View className="w-4 h-4 mr-2" />
                View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      case 'reviewedProtocols':
      case 'approvedProtocols':
      default:
        return (
          <Button variant="ghost" size="sm" onClick={() => onProtocolAction(protocol.protocolId, 'view')}>
            <View className="w-4 h-4 mr-2" />
            View
          </Button>
        );
    }
  };

  if (protocols.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No protocols found in this category.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="[&>div]:max-h-200 [&>div]:rounded-sm [&>div]:border">
        <Table>
          <TableHeader>
            <TableRow className="bg-background sticky top-0 text-center">
              <TableHead className="text-center w-20">SPUP REC Code</TableHead>
              <TableHead className="text-center w-10">
                Principal Investigator
              </TableHead>
              <TableHead className="text-center w-100">Title</TableHead>
              <TableHead className="text-center w-10">Assessment Type</TableHead>
              <TableHead className="text-center w-10">Due Date</TableHead>
              <TableHead className="text-center w-10">Status</TableHead>
              <TableHead className="text-center w-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {protocols.map((protocol, index) => {
              const isReassigned = protocol.status === 'reassigned';
              return (
                <TableRow key={protocol.protocolId || index}>
                  <TableCell className="text-center font-mono text-sm">{protocol.spupCode}</TableCell>
                  <TableCell className="text-center w-10">
                    {protocol.principalInvestigator || protocol.principal_investigator?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-center w-100">
                    <div className="font-medium truncate w-108">{protocol.protocolTitle}</div>
                    {isReassigned ? (
                      <>
                        <div className="text-sm text-destructive">Reassigned: {formatDate(protocol.reassignedAt)}</div>
                        <div className="text-xs text-muted-foreground italic">Reason: {protocol.reason}</div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Assigned: {formatDate(protocol.assignedAt)}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center w-10">
                    <Badge variant="outline" className="text-xs bg-[#036635]/5 dark:bg-[#FECC07]/10 text-[#036635] dark:text-[#FECC07] border-[#036635]/20 dark:border-[#FECC07]/30">{protocol.assessmentType}</Badge>
                  </TableCell>
                  <TableCell className="text-center w-10">
                    {isReassigned ? (
                      <>
                        <div className="text-sm text-foreground">{formatDate(protocol.originalDeadline)}</div>
                        <div className="text-xs text-destructive">Missed ({protocol.daysOverdue} days overdue)</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-foreground">{formatDate(protocol.deadline)}</div>
                        <div className="text-xs text-muted-foreground">{getDaysRemaining(protocol.deadline)}</div>
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-center w-10">
                    {getStatusBadge(protocol.status)}
                  </TableCell>
                  <TableCell className="text-center w-4">
                    {getActionButtons(protocol)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          <TableFooter></TableFooter>
        </Table>
      </div>
    </div>
  );
}
