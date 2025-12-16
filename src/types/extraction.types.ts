/**
 * Data Extraction Types
 * Types for protocol data extraction and export functionality
 */

import { FirestoreDate, ProtocolStatus } from './common.types';
import { InformationType } from './information.types';

// ============================================================================
// EXTRACTION FILTERS
// ============================================================================

export interface ExtractionFilters {
  // Date range filters
  dateRange?: {
    start: Date;
    end: Date;
    field: 'submission' | 'approval' | 'decision'; // Which date field to filter by
  };
  
  // Status filters
  status?: ProtocolStatus[];
  
  // Research type filters
  researchType?: string[]; // SR, PR, HO, BS, EX
  
  // Study level filters
  studyLevel?: string[]; // Undergraduate, Master's, Doctoral, etc.
  
  // Review status filters
  reviewStatus?: 'pending' | 'in-progress' | 'completed' | 'all';
  
  // OR Number filter
  hasOrNumber?: boolean | null; // true = has OR, false = no OR, null = all
  
  // Additional filters
  hasReviewers?: boolean | null;
  documentsComplete?: boolean | null;
}

// ============================================================================
// EXTRACTION FIELDS
// ============================================================================

export interface ExtractionField {
  id: string;
  label: string;
  category: 'basic' | 'pi' | 'research' | 'funding' | 'administrative' | 'financial';
  description?: string;
  default?: boolean; // Include by default
}

export const EXTRACTION_FIELDS: ExtractionField[] = [
  // Basic Information
  { id: 'protocolId', label: 'Protocol ID', category: 'basic', default: true },
  { id: 'spupCode', label: 'SPUP REC Protocol Code', category: 'basic', default: true },
  { id: 'tempCode', label: 'Temporary Protocol Code', category: 'basic', default: true },
  { id: 'title', label: 'Protocol Title', category: 'basic', default: true },
  { id: 'status', label: 'Status', category: 'basic', default: true },
  { id: 'submissionDate', label: 'Submission Date', category: 'basic', default: true },
  { id: 'approvalDate', label: 'Approval Date', category: 'basic', default: false },
  { id: 'decisionDate', label: 'Decision Date', category: 'basic', default: false },
  
  // Principal Investigator
  { id: 'piName', label: 'Principal Investigator Name', category: 'pi', default: true },
  { id: 'piEmail', label: 'PI Email', category: 'pi', default: true },
  { id: 'piContact', label: 'PI Contact Number', category: 'pi', default: true },
  { id: 'piAddress', label: 'PI Address', category: 'pi', default: false },
  { id: 'piPosition', label: 'PI Position & Institution', category: 'pi', default: true },
  { id: 'piCourse', label: 'PI Course/Program', category: 'pi', default: false },
  { id: 'adviser', label: 'Research Adviser', category: 'pi', default: false },
  
  // Research Details
  { id: 'studyLevel', label: 'Study Level', category: 'research', default: true },
  { id: 'studyType', label: 'Study Type', category: 'research', default: true },
  { id: 'studySite', label: 'Study Site Location', category: 'research', default: false },
  { id: 'durationStart', label: 'Duration Start Date', category: 'research', default: false },
  { id: 'durationEnd', label: 'Duration End Date', category: 'research', default: false },
  { id: 'participants', label: 'Number of Participants', category: 'research', default: false },
  { id: 'description', label: 'Brief Description', category: 'research', default: false },
  
  // Funding
  { id: 'fundingSource', label: 'Funding Source', category: 'funding', default: false },
  { id: 'pharmaceuticalCompany', label: 'Pharmaceutical Company', category: 'funding', default: false },
  { id: 'otherFunding', label: 'Other Funding Details', category: 'funding', default: false },
  
  // Administrative
  { id: 'assignedReviewers', label: 'Assigned Reviewers Count', category: 'administrative', default: false },
  { id: 'completedReviews', label: 'Completed Reviews Count', category: 'administrative', default: false },
  { id: 'pendingReviews', label: 'Pending Reviews Count', category: 'administrative', default: false },
  { id: 'reviewType', label: 'Review Type', category: 'administrative', default: false },
  { id: 'priority', label: 'Priority Level', category: 'administrative', default: false },
  { id: 'chairNotes', label: 'Chairperson Notes', category: 'administrative', default: false },
  
  // Financial/Administrative
  { id: 'orNumber', label: 'OR Number', category: 'financial', default: true },
];

// ============================================================================
// PROTOCOL DATA FOR EXPORT
// ============================================================================

/**
 * Flattened protocol data structure for export
 * All dates are converted to strings
 */
export interface ProtocolExportData {
  // Basic Information
  protocolId: string;
  spupCode?: string;
  tempCode?: string;
  title: string;
  status: string;
  submissionDate?: string;
  approvalDate?: string;
  decisionDate?: string;
  
  // Principal Investigator
  piName?: string;
  piEmail?: string;
  piContact?: string;
  piAddress?: string;
  piPosition?: string;
  piCourse?: string;
  adviser?: string;
  
  // Research Details
  studyLevel?: string;
  studyType?: string;
  studySite?: string;
  durationStart?: string;
  durationEnd?: string;
  participants?: number | null;
  description?: string;
  
  // Funding
  fundingSource?: string;
  pharmaceuticalCompany?: string;
  otherFunding?: string;
  
  // Administrative
  assignedReviewers?: number;
  completedReviews?: number;
  pendingReviews?: number;
  reviewType?: string;
  priority?: string;
  chairNotes?: string;
  
  // Financial
  orNumber?: string;
  
  // Additional metadata
  [key: string]: string | number | null | undefined;
}

// ============================================================================
// EXTRACTION STATISTICS
// ============================================================================

export interface ExtractionStats {
  totalProtocols: number;
  byStatus: {
    pending: number;
    accepted: number;
    approved: number;
    archived: number;
    rejected: number;
  };
  byResearchType: {
    SR: number;
    PR: number;
    HO: number;
    BS: number;
    EX: number;
  };
  withOrNumber: number;
  withoutOrNumber: number;
  dateRange: {
    earliest: Date | null;
    latest: Date | null;
  };
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  fields: string[]; // Field IDs to include
  filename?: string; // Custom filename (without extension)
  includeHeaders?: boolean; // Include column headers (default: true)
}

// ============================================================================
// REPORT DATA (REC Format)
// ============================================================================

/**
 * Report data structure matching REC reporting format
 */
export interface ReportData {
  protocolCode: string;
  protocolTitle: string;
  researcherNames: string;
  funding: 'R' | 'I' | 'A' | 'D' | 'O';
  researchType: string;
  studyLevel?: string;
  dateReceived: string;
  reviewType: 'FR' | 'ER' | 'EX';
  meetingDate: string | null;
  primaryReviewerName: string | null;
  decision: 'A' | 'MN' | 'MJ' | 'D' | '';
  decisionDate: string | null;
  status: 'OR' | 'A' | 'C' | 'T' | 'W';
}

/**
 * Report type
 */
export type ReportType = 'monthly' | 'yearly';

/**
 * Report period configuration
 */
export interface ReportPeriod {
  type: ReportType;
  month?: number; // 1-12 for monthly reports
  year: number;
}

