"use client"
import { CustomBadge } from "@/components/ui/custom/badge";
import { Calendar, ScanBarcode, Key, Dot, MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import ProtocolMessage from "./message";

const BADGE_CONFIG = {
  "Pending Upload": "bg-gray-100 text-gray-800 border border-gray-300",
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

// Status display mapping
const STATUS_DISPLAY = {
  pending: "Under Review",
  accepted: "Under Review", 
  approved: "Approved",
  archived: "Archived",
} as const;

interface CustomBannerProps {
  title?: string;
  status?: string;
  submissionId?: string;
  spupCode?: string;
  tempCode?: string;
  dateSubmitted?: string;
  unreadMessageCount?: number;
}

export default function CustomBanner({ 
  title = "Protocol Title", 
  status = "pending", 
  submissionId, 
  spupCode,
  tempCode,
  dateSubmitted,
  unreadMessageCount = 0
}: CustomBannerProps) {
  const [open, setOpen] = useState(false);
  
  // Format date if not provided
  const displayDate = dateSubmitted || new Date().toLocaleDateString();
  
  // Get display status
  const displayStatus = STATUS_DISPLAY[status as keyof typeof STATUS_DISPLAY] || status;
  
  return (
    <section className="w-full max-w-full bg-primary rounded-lg p-4 sm:p-6 lg:p-8 flex flex-col gap-3 sm:gap-4">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
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
                  <span className="text-xs sm:text-sm text-white/90 flex items-center gap-1.5 sm:gap-2">
                    <ScanBarcode className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{submissionId}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Submission ID is the unique identifier for the submission.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Dot className="hidden sm:block w-4 h-4 text-white/90 flex-shrink-0" />
          </>
        )}
        
        {/* Date Submitted */}
        <span className="text-xs sm:text-sm text-white/90 flex items-center gap-1.5 sm:gap-2">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">{displayDate}</span>
        </span>
        
        {/* Protocol Code (SPUP or Temporary) */}
        {(spupCode || tempCode) && (
          <>
            <Dot className="hidden sm:block w-4 h-4 text-white/90 flex-shrink-0" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-xs sm:text-sm text-white/90 flex items-center gap-1.5 sm:gap-2">
                    <Key className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">
                      {spupCode || tempCode}
                      {!spupCode && tempCode && (
                        <span className="text-yellow-200 ml-1">(Temp)</span>
                      )}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="">
                  <p>
                    {spupCode 
                      ? "SPUP Protocol Code is the official identifier for the protocol." 
                      : "Temporary code until SPUP code is assigned by REC Chairperson."
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
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
