"use client";
import { CustomBadge } from "@/components/ui/custom/badge";
import { Calendar, ScanBarcode, Key, Dot } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import ProtocolMessage from "./message";

const BADGE_CONFIG = {
  "Pending": "bg-orange-100 text-orange-800 border border-orange-300",
  "Pending Upload": "bg-gray-100 text-gray-800 border border-gray-300",
  "Accepted": "bg-teal-100 text-teal-800 border border-teal-300",
  Submitted: "bg-blue-100 text-blue-800 border border-blue-300",
  "Under Review": "bg-indigo-100 text-indigo-800 border border-indigo-300",
  "Needs Revision": "bg-amber-100 text-amber-800 border border-amber-300",
  Resubmitted: "bg-sky-100 text-sky-800 border border-sky-300",
  Approved: "bg-green-100 text-green-800 border border-green-300",
  Rejected: "bg-red-100 text-red-800 border border-red-300",
  Expired: "bg-rose-100 text-rose-800 border border-rose-300",
  Archived: "bg-gray-200 text-gray-800 border border-gray-300",
  Exempted: "bg-emerald-100 text-emerald-800 border border-emerald-300",
} as const;

// Status display mapping - will be dynamically determined based on reviewers
const STATUS_DISPLAY = {
  pending: "Pending", // Default to Pending, will change to Under Review when reviewers assigned
  accepted: "Accepted", // Default to Accepted, will change to Under Review when reviewers assigned
  approved: "Approved",
  archived: "Archived",
  draft: "Pending", // Draft maps to Pending
  submitted: "Submitted",
  under_review: "Under Review",
  rejected: "Rejected",
  returned: "Needs Revision", // Returned reviews need revision
  completed: "Approved", // Completed maps to Approved
  // Decision-based statuses
  disapproved: "Disapproved",
  approved_minor_revisions: "Minor Revision Required",
  major_revisions_deferred: "Major Revision Required",
  deferred: "Deferred",
} as const;

interface CustomBannerProps {
  title?: string;
  status?: string;
  submissionId?: string;
  spupCode?: string;
  tempCode?: string;
  dateSubmitted?: string;
  unreadMessageCount?: number;
  hasReviewers?: boolean; // Deprecated - kept for backward compatibility but not used
}

export default function CustomBanner({
  title = "Protocol Title",
  status = "pending",
  submissionId,
  spupCode,
  tempCode: _tempCode, // eslint-disable-line @typescript-eslint/no-unused-vars
  dateSubmitted,
  unreadMessageCount = 0,
  hasReviewers: _hasReviewers, // Deprecated - kept for backward compatibility but not used
}: CustomBannerProps) {
  const [open] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Format date if not provided
  const displayDate = dateSubmitted || new Date().toLocaleDateString();

  // Get display status based on current status
  // Status is the single source of truth - "under_review" means reviewers are assigned
  const getDisplayStatus = (): keyof typeof BADGE_CONFIG => {
    // Priority 1: If status is "pending", always show "Pending"
    if (status === "pending") {
      return "Pending";
    }
    
    // Priority 2: Map status to display status using STATUS_DISPLAY
    const mappedStatus = STATUS_DISPLAY[status as keyof typeof STATUS_DISPLAY];
    if (mappedStatus && mappedStatus in BADGE_CONFIG) {
      return mappedStatus as keyof typeof BADGE_CONFIG;
    }
    
    // Priority 3: Try to use status directly if it exists in BADGE_CONFIG
    if (status in BADGE_CONFIG) {
      return status as keyof typeof BADGE_CONFIG;
    }
    
    // Final fallback to "Pending"
    return "Pending";
  };

  const displayStatus = getDisplayStatus();

  // Handle SPUP code display - show SPUP code or PENDING, hide complex temp codes
  const shouldShowCode = true; // Always show code section
  const displayCode = spupCode || "PENDING";

  return (
    <section className="w-full max-w-full bg-gradient-to-r from-[#036635] to-[#036635]/90 dark:from-[#FECC07] dark:to-[#FECC07]/90 rounded-lg p-4 sm:p-6 lg:p-8 flex flex-col gap-3 sm:gap-4 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white dark:text-black leading-tight">
          {title}
        </h1>
      </div>

      {/* Protocol Details */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 items-start sm:items-center">
        {/* Submission ID */}
        {submissionId && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-xs sm:text-sm text-white/90 dark:text-black/90 flex items-center gap-1.5 sm:gap-2">
                    <ScanBarcode className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{submissionId}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Submission ID is the unique identifier for the submission.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        {/* Protocol Code (SPUP or PENDING) */}
        {shouldShowCode && (
          <>
            <Dot className="hidden sm:block w-4 h-4 text-white/90 dark:text-black/90 flex-shrink-0" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-xs sm:text-sm text-white/90 dark:text-black/90 flex items-center gap-1.5 sm:gap-2">
                    <Key className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">
                      {displayCode}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="">
                  <p>
                    {spupCode
                      ? "SPUP Protocol Code is the official identifier for the protocol."
                      : "Protocol code will be assigned when accepted by REC Chairperson."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Dot className="hidden sm:block w-4 h-4 text-white/90 dark:text-black/90 flex-shrink-0" />
          </>
        )}

        {/* Date Submitted */}
        <span className="text-xs sm:text-sm text-white/90 dark:text-black/90 flex items-center gap-1.5 sm:gap-2">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">{displayDate}</span>
        </span>
      </div>

      {/* Status and Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div className="flex-1">
          <CustomBadge status={displayStatus as keyof typeof BADGE_CONFIG} />
        </div>
        <div className="flex justify-end">
          <ProtocolMessage
            submissionId={submissionId}
            unreadCount={unreadMessageCount}
          />
        </div>
      </div>
    </section>
  );
}
