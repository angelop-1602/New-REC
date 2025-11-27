"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertCircle, FileText } from "lucide-react";

interface DocumentStatusBadgeProps {
  status: string;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  switch (status) {
    case "accepted":
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Accepted
        </Badge>
      );
    case "revise":
      return (
        <Badge variant="default" className="bg-amber-100 text-amber-800 border-amber-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Needs Revision
        </Badge>
      );
    case "requested":
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
          <FileText className="w-3 h-3 mr-1" />
          Requested
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          {status || "Pending"}
        </Badge>
      );
  }
}

