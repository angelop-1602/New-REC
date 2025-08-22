"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentItem {
  name: string;
  status: string;
  dueDate?: string;
  url?: string;
}

interface DecisionProps {
  decision?: {
    status: string;
    type?: string;
    date: string;
    comments?: string;
    nextSteps?: string[];
    documents?: DocumentItem[];
  };
}

const DECISION_COLORS = {
  Approved: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    icon: CheckCircle,
    badge: "bg-green-100 text-green-800",
  },
  "Minor modification": {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    icon: AlertTriangle,
    badge: "bg-yellow-100 text-yellow-800",
  },
  "Major modification": {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: AlertCircle,
    badge: "bg-orange-100 text-orange-800",
  },
  Disapproved: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    icon: XCircle,
    badge: "bg-red-100 text-red-800",
  },
};

export function CustomDecisionAlert({ decision }: DecisionProps) {
  if (!decision) return null;

  const decisionStyle =
    DECISION_COLORS[decision.status as keyof typeof DECISION_COLORS] ||
    DECISION_COLORS.Approved;
  const Icon = decisionStyle.icon;

  return (
    <Card className={cn("w-full h-full", decisionStyle.bg, decisionStyle.border, "border")}>
      <CardHeader>
        <CardTitle className={cn("text-lg font-semibold flex items-center gap-2")}>
          <Icon className={cn("h-5 w-5", decisionStyle.text)} />
          Decision Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status, Type, Date */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Status</span>
            <Badge className={decisionStyle.badge}>{decision.status}</Badge>
          </div>
          {decision.type && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Review Type</span>
              <span className="text-sm text-gray-600">{decision.type}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Decision Date</span>
            <span className="text-sm text-gray-600">{decision.date}</span>
          </div>
        </div>

        {/* REC Decision Comments */}
        {decision.comments && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Notification of REC Decision</h4>
            <p className="text-sm text-gray-600">
              {decision.comments}
            </p>
          </div>
        )}

        {/* Next Steps */}
        {decision.nextSteps && decision.nextSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Next Steps</h4>
            <ul className="list-disc list-inside space-y-1">
              {decision.nextSteps.map((step, idx) => (
                <li key={idx} className="text-sm text-gray-600">
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Documents Section */}
        {decision.documents && decision.documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Documents</h4>
            <ul className="space-y-1">
              {decision.documents.map((doc, idx) => (
                <li key={idx} className="flex items-center justify-between rounded px-2 py-1 bg-gray-50 border border-gray-100">
                  <div>
                    <span className="font-medium">{doc.name}</span>
                    {doc.dueDate && (
                      <span className="ml-2 text-xs text-gray-400">
                        Due: {doc.dueDate}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">{doc.status}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
