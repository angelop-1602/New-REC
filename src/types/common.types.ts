/**
 * COMMON/UNIVERSAL TYPES
 * Shared types and utilities used across all modules (Proponent, Chairperson, Reviewer)
 * This is the foundation for the entire type system.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// FIRESTORE TIMESTAMP UTILITIES (Universal)
// ============================================================================

/**
 * Type that can be either a Firestore Timestamp or a serialized date
 */
export type FirestoreDate = Timestamp | Date | string | number | null | undefined;

/**
 * Type guard to check if value is a Firestore Timestamp
 */
export function isFirestoreTimestamp(value: unknown): value is Timestamp {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as any).toDate === 'function'
  );
}

/**
 * Safely converts a Firestore Timestamp or date string to a Date object
 * This is the UNIVERSAL date converter used throughout the app
 */
export function toDate(value: FirestoreDate): Date {
  if (!value) return new Date(0);
  if (isFirestoreTimestamp(value)) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
}

/**
 * Safely converts a Firestore Timestamp to ISO string
 */
export function toISOString(value: FirestoreDate): string | null {
  if (!value) return null;
  try {
    return toDate(value).toISOString();
  } catch {
    return null;
  }
}

/**
 * Safely converts a Firestore Timestamp to locale date string
 */
export function toLocaleDateString(
  value: FirestoreDate,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    return toDate(value).toLocaleDateString('en-US', options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Unknown';
  }
}

/**
 * Format date for relative display (e.g., "2 days ago")
 */
export function formatRelativeTime(value: FirestoreDate): string {
  try {
    const date = toDate(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return 'Unknown';
  }
}

// ============================================================================
// INFORMATION/FORM TYPES (Universal) - From information.types.ts
// ============================================================================

/**
 * Re-export from information.types.ts for compatibility
 * This is the main protocol information interface used in forms
 */
export type { InformationType } from './information.types';
export type { Adviser } from './information.types';
export type { StudyLevel, StudyType } from './information.types';

// ============================================================================
// DOCUMENT TYPES (Universal) - Consolidated from documents.types.ts
// ============================================================================

/**
 * Re-export from documents.types.ts for compatibility
 */
export type { DocumentsType } from './documents.types';
export type { DocumentRequirement, EnhancedDocument as EnhancedDocumentType } from './documents.types';

// ============================================================================
// USER/AUTH TYPES (Universal)
// ============================================================================

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface ProponentUser extends BaseUser {
  role: 'proponent';
  institution?: string;
  department?: string;
}

export interface ChairpersonUser extends BaseUser {
  role: 'chairperson';
  title?: string;
}

export interface ReviewerUser extends BaseUser {
  role: 'reviewer' | 'chairperson' | 'member';
  code: string;
  isActive: boolean;
  expertise?: string[];
}

export type AppUser = ProponentUser | ChairpersonUser | ReviewerUser;

// ============================================================================
// PROTOCOL/SUBMISSION CORE TYPES (Universal)
// ============================================================================

/**
 * Status types for protocols/submissions
 */
export type ProtocolStatus =
  | 'draft'
  | 'pending'
  | 'submitted'
  | 'accepted'
  | 'under_review'
  | 'approved'
  | 'approved_minor_revisions'
  | 'major_revisions_deferred'
  | 'disapproved'
  | 'archived'
  | 'terminated'
  | 'expired';

/**
 * Research type categories
 */
export type ResearchType = 'SR' | 'PR' | 'HO' | 'BS' | 'CT' | 'EX' | 'experimental' | 'documentary';

/**
 * Review type
 */
export type ReviewType = 'expedited' | 'full' | 'exempted';

/**
 * Principal Investigator information (shared across all modules)
 */
export interface PrincipalInvestigator {
  name: string;
  email?: string;
  contact_number?: string;
  affiliation?: string;
  position_institution?: string;
  course_program?: string; // Optional course/program for student submissions
  address?: string;
}

/**
 * Researcher information (shared)
 */
export interface Researcher {
  name: string;
  email?: string;
  contact_number?: string;
  affiliation?: string;
}

/**
 * General Information structure (shared)
 */
export interface GeneralInformation {
  protocol_title: string;
  principal_investigator: PrincipalInvestigator;
  co_researchers?: Researcher[];
  adviser?: {
    name: string;
    email?: string;
    contact_number?: string;
  };
}

/**
 * Base Protocol/Submission interface (shared by all user roles)
 */
export interface BaseProtocol {
  id: string;
  applicationID?: string;
  tempProtocolCode?: string;
  spupCode?: string;
  title?: string;
  status: ProtocolStatus;
  submitBy: string;
  submittedByName?: string;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
  information?: {
    general_information?: GeneralInformation;
    [key: string]: unknown;
  };
}

// ============================================================================
// DOCUMENT TYPES (Universal)
// ============================================================================

export type DocumentStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'requested'
  | 'rework'
  | 'revise';

export type DocumentCategory = 'basic' | 'supplementary' | 'custom';

export interface BaseDocument {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  status: DocumentStatus;
  currentStatus?: DocumentStatus;
  storagePath?: string;
  downloadURL?: string;
  uploadedAt: FirestoreDate;
  uploadedBy?: string;
  category?: DocumentCategory;
}

// ============================================================================
// DECISION TYPES (Universal)
// ============================================================================

export type DecisionType = 
  | 'approved'
  | 'approved_minor_revisions'
  | 'major_revisions_deferred'
  | 'disapproved'
  | 'exempted';

export interface DecisionDetails {
  decision?: DecisionType | string;
  comments?: string;
  conditions?: string[];
  decisionDate?: FirestoreDate;
  decisionBy?: string;
}

// ============================================================================
// ASSESSMENT/REVIEW TYPES (Universal)
// ============================================================================

export type AssessmentFormType =
  | 'protocol-review'
  | 'informed-consent'
  | 'iacuc-review'
  | 'exemption-checklist';

export type AssessmentStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'returned';

export interface BaseAssessment {
  id?: string;
  protocolId: string;
  reviewerId: string;
  reviewerName: string;
  formType: AssessmentFormType | string;
  status: AssessmentStatus;
  formData: Record<string, unknown>;
  submittedAt?: FirestoreDate;
  lastSavedAt?: FirestoreDate;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

// ============================================================================
// AUDIT & TRACKING TYPES (Universal)
// ============================================================================

export interface AuditTrailEntry {
  action: string;
  performedBy: string;
  performedByName?: string;
  performedAt: FirestoreDate;
  details?: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface NotificationEntry {
  sentTo: string[];
  notificationType: 'email' | 'sms' | 'in_app';
  sentAt: FirestoreDate;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  content: string;
}

// ============================================================================
// SORTING UTILITIES (Universal)
// ============================================================================

/**
 * Sort any array of objects by date field
 */
export function sortByDate<T extends Record<string, any>>(
  items: T[],
  dateField: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const dateA = toDate(a[dateField] as FirestoreDate);
    const dateB = toDate(b[dateField] as FirestoreDate);
    return order === 'desc'
      ? dateB.getTime() - dateA.getTime()
      : dateA.getTime() - dateB.getTime();
  });
}

/**
 * Filter items by date range
 */
export function filterByDateRange<T extends Record<string, any>>(
  items: T[],
  dateField: keyof T,
  startDate?: Date,
  endDate?: Date
): T[] {
  return items.filter(item => {
    const date = toDate(item[dateField] as FirestoreDate);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });
}

// ============================================================================
// VALIDATION UTILITIES (Universal)
// ============================================================================

/**
 * Check if a value is defined and not empty
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely get a string value with fallback
 */
export function getString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return fallback;
}

/**
 * Safely get a number value with fallback
 */
export function getNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Safely get a boolean value with fallback
 */
export function getBoolean(value: unknown, fallback: boolean = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

// ============================================================================
// NESTED OBJECT UTILITIES (Universal)
// ============================================================================

/**
 * Safely get nested value from object
 */
export function getNestedValue<T = any>(
  obj: Record<string, any>,
  path: string,
  fallback?: T
): T | undefined {
  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return fallback;
    }
    result = result[key];
  }

  return result !== undefined ? result : fallback;
}

/**
 * Safely set nested value in object (immutable)
 */
export function setNestedValue<T extends Record<string, any>>(
  obj: T,
  path: string,
  value: any
): T {
  const keys = path.split('.');
  const newObj = { ...obj };
  let current: any = newObj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    } else {
      current[key] = { ...current[key] };
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return newObj;
}

// ============================================================================
// SEARCH/FILTER UTILITIES (Universal)
// ============================================================================

/**
 * Generic search function for protocols/submissions
 */
export function searchProtocols<T extends BaseProtocol>(
  protocols: T[],
  query: string
): T[] {
  if (!query.trim()) return protocols;

  const lowerQuery = query.toLowerCase();

  return protocols.filter(protocol => {
    const searchableFields = [
      getString(protocol.spupCode),
      getString(protocol.tempProtocolCode),
      getString(protocol.applicationID),
      getString(protocol.title),
      getString(protocol.information?.general_information?.protocol_title),
      getString(protocol.information?.general_information?.principal_investigator?.name),
    ];

    return searchableFields.some(field => 
      field.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Filter protocols by status
 */
export function filterByStatus<T extends BaseProtocol>(
  protocols: T[],
  status: ProtocolStatus | ProtocolStatus[] | 'all'
): T[] {
  if (status === 'all') return protocols;

  const statuses = Array.isArray(status) ? status : [status];
  return protocols.filter(p => statuses.includes(p.status));
}

// ============================================================================
// TITLE/NAME EXTRACTION UTILITIES (Universal)
// ============================================================================

/**
 * Get protocol title with smart fallbacks
 */
export function getProtocolTitle(protocol: BaseProtocol): string {
  return (
    getString(protocol.title) ||
    getString(protocol.information?.general_information?.protocol_title) ||
    'Untitled Protocol'
  );
}

/**
 * Get protocol code with smart fallbacks
 */
export function getProtocolCode(protocol: BaseProtocol): string {
  return (
    getString(protocol.spupCode) ||
    getString(protocol.tempProtocolCode) ||
    getString(protocol.applicationID) ||
    getString(protocol.id)
  );
}

/**
 * Get principal investigator name with fallback
 */
export function getPIName(protocol: BaseProtocol): string {
  return getString(
    protocol.information?.general_information?.principal_investigator?.name,
    'Unknown'
  );
}

/**
 * Get principal investigator email with fallback
 */
export function getPIEmail(protocol: BaseProtocol): string {
  return getString(
    protocol.information?.general_information?.principal_investigator?.email,
    'N/A'
  );
}

// ============================================================================
// STATUS UTILITIES (Universal)
// ============================================================================

/**
 * Check if protocol is in pending state
 */
export function isPending(protocol: BaseProtocol): boolean {
  return ['draft', 'pending', 'submitted'].includes(protocol.status);
}

/**
 * Check if protocol is under review
 */
export function isUnderReview(protocol: BaseProtocol): boolean {
  return ['accepted', 'under_review'].includes(protocol.status);
}

/**
 * Check if protocol is approved
 */
export function isApproved(protocol: BaseProtocol): boolean {
  return ['approved', 'approved_minor_revisions'].includes(protocol.status);
}

/**
 * Check if protocol is archived/completed
 */
export function isArchived(protocol: BaseProtocol): boolean {
  return ['archived', 'terminated', 'expired'].includes(protocol.status);
}

// ============================================================================
// COLLECTION UTILITIES (Universal)
// ============================================================================

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  SUBMISSIONS: 'submissions',
  REVIEWERS: 'reviewers',
  ASSESSMENTS: 'assessments',
  DECISIONS: 'decisions',
  DOCUMENTS: 'documents',
  MESSAGES: 'messages',
  SETTINGS: 'settings',
  PRESENCE: 'presence',
} as const;

/**
 * Subcollection names
 */
export const SUBCOLLECTIONS = {
  DOCUMENTS: 'documents',
  REVIEWER_ASSIGNMENTS: 'reviewer_assignments',
  REASSIGNMENT_HISTORY: 'reassignment_history',
  MESSAGES: 'messages',
  AUDIT_TRAIL: 'audit_trail',
} as const;

// ============================================================================
// ERROR HANDLING TYPES (Universal)
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a success result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function error(message: string, code: string = 'ERROR', details?: any): Result<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date(),
    },
  };
}

// ============================================================================
// PAGINATION TYPES (Universal)
// ============================================================================

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginate an array of items
 */
export function paginate<T>(
  items: T[],
  options: PaginationOptions
): PaginatedResult<T> {
  const { page, pageSize } = options;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = items.slice(start, end);
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ============================================================================
// FORM UTILITIES (Universal)
// ============================================================================

/**
 * Form field validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Check if validation result is valid
 */
export function isValid(result: ValidationResult): boolean {
  return result.valid && Object.keys(result.errors).length === 0;
}

