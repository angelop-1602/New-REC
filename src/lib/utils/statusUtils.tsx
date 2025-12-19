/**
 * Centralized Status Utilities
 * 
 * This file provides consistent status display logic across all components.
 * Use these utilities to ensure status badges and labels are consistent throughout the app.
 */

import { CustomBadge } from "@/components/ui/custom/badge";
import React from "react";

// Status mapping from database status to display status
const STATUS_DISPLAY_MAP: Record<string, string> = {
  // Basic statuses
  pending: "Pending",
  accepted: "Accepted",
  approved: "Approved",
  archived: "Archived",
  draft: "Pending",
  submitted: "Submitted",
  under_review: "Under Review",
  rejected: "Rejected",
  returned: "Needs Revision",
  completed: "Approved",
  
  // Decision-based statuses
  disapproved: "Disapproved",
  approved_minor_revisions: "Minor Revision Required",
  major_revisions_deferred: "Major Revision Required",
  deferred: "Deferred",
};

/**
 * Get display status from database status
 * Handles all status types including decision-based statuses
 * Status is the single source of truth - "under_review" means reviewers are assigned
 */
export const getDisplayStatus = (
  status: string,
  decision?: string | null,
  _hasReviewers?: boolean // Deprecated - kept for backward compatibility but not used
): string => {
  // Priority 1: If status is pending, always show "Pending"
  if (status === "pending") {
    return "Pending";
  }

  // Priority 2: If status is accepted, check for decision
  if (status === "accepted") {
    // If there's a decision, use the decision status
    if (decision) {
      return STATUS_DISPLAY_MAP[decision] || "Accepted";
    }
    // Otherwise show "Accepted"
    return "Accepted";
  }

  // Priority 3: Check if status has a direct mapping
  if (status in STATUS_DISPLAY_MAP) {
    return STATUS_DISPLAY_MAP[status];
  }

  // Fallback: capitalize first letter
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Get status badge component for use in tables
 * This ensures consistent badge styling across all tables
 * Status is the single source of truth - "under_review" means reviewers are assigned
 */
export const getStatusBadge = (
  status: string,
  decision?: string | null,
  _hasReviewers?: boolean // Deprecated - kept for backward compatibility but not used
): React.ReactElement => {
  const displayStatus = getDisplayStatus(status, decision);
  
  // Use CustomBadge which handles all status types
  return (
    <CustomBadge 
      status={displayStatus as any} 
      className="text-xs"
    />
  );
};

/**
 * Get status badge for simple cases (just status string)
 */
export const getSimpleStatusBadge = (status: string): React.ReactElement => {
  return getStatusBadge(status);
};

