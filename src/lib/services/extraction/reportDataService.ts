/**
 * Report Data Service
 * Transforms protocol data to REC report format with specific column mappings
 */

import { ChairpersonProtocol } from '@/types';
import { toDate, toISOString } from '@/types';
import { reviewersManagementService } from '@/lib/services/reviewers/reviewersManagementService';
import { ReportData } from '@/types/extraction.types';

/**
 * Shorten reviewer name format (e.g., "Dr. Janette Fermin" → "J. Fermin")
 */
export function shortenReviewerName(fullName: string): string {
  if (!fullName || !fullName.trim()) return '';
  
  // Remove common titles
  let name = fullName.trim();
  const titles = ['Dr.', 'Dr', 'Prof.', 'Prof', 'Professor', 'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Miss'];
  for (const title of titles) {
    const regex = new RegExp(`^${title}\\s+`, 'i');
    name = name.replace(regex, '');
  }
  
  // Split by spaces
  const parts = name.split(/\s+/).filter(p => p.length > 0);
  
  if (parts.length === 0) return fullName; // Fallback to original
  if (parts.length === 1) return parts[0]; // Single name
  
  // Get first initial and last name
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastName = parts[parts.length - 1];
  
  return `${firstInitial}. ${lastName}`;
}

/**
 * Map funding source to code
 */
export function mapFundingSource(funding: string | undefined | null): 'R' | 'I' | 'A' | 'D' | 'O' {
  if (!funding) return 'O';
  
  const normalized = funding.toLowerCase().trim();
  
  switch (normalized) {
    case 'self_funded':
      return 'R'; // Researcher-funded
    case 'institution_funded':
      return 'I'; // Institution-funded
    case 'government_funded':
    case 'scholarship':
    case 'research_grant':
      return 'A'; // Agency other than institution
    case 'pharmaceutical_company':
      return 'D'; // Pharmaceutical companies
    case 'others':
    default:
      return 'O'; // Others
  }
}

/**
 * Map research type to full name
 */
export function mapResearchType(type: string | undefined | null): string {
  if (!type) return '';
  
  const normalized = type.trim();
  
  switch (normalized) {
    case 'Social/Behavioral':
      return 'Social Research';
    case 'Public Health Research':
      return 'Public Health Research';
    case 'Health Operations':
      return 'Health Operations Research';
    case 'Biomedical Studies':
      return 'Biomedical studies';
    case 'Clinical Trials':
      return 'Clinical Trials';
    default:
      return normalized; // Keep as is if not mapped
  }
}

/**
 * Map review type to code
 */
export function mapReviewType(type: string | undefined | null): 'FR' | 'ER' | 'EX' {
  if (!type) return 'ER'; // Default to expedited
  
  const normalized = type.toString().toLowerCase().trim();
  
  if (normalized === 'full' || normalized === 'full board') {
    return 'FR'; // Full Review
  } else if (normalized === 'expedited') {
    return 'ER'; // Expedited Review
  } else if (normalized === 'exempted' || normalized === 'exempt') {
    return 'EX'; // Exempt from Review
  }
  
  return 'ER'; // Default to expedited
}

/**
 * Map decision to code
 */
export function mapDecision(decision: string | undefined | null): 'A' | 'MN' | 'MJ' | 'D' | '' {
  if (!decision) return '';
  
  const normalized = decision.toString().toLowerCase().trim();
  
  switch (normalized) {
    case 'approved':
      return 'A'; // Approved
    case 'approved_minor_revisions':
    case 'minor_revisions':
      return 'MN'; // Minor modification
    case 'major_revisions_deferred':
    case 'major_revisions':
      return 'MJ'; // Major modification
    case 'disapproved':
      return 'D'; // Disapproved
    default:
      return ''; // No decision or unknown
  }
}

/**
 * Map status to code
 */
export function mapStatus(status: string | undefined | null): 'OR' | 'A' | 'C' | 'T' | 'W' {
  if (!status) return 'OR';
  
  const normalized = status.toString().toLowerCase().trim();
  
  switch (normalized) {
    case 'pending':
    case 'accepted':
      return 'OR'; // On-going review
    case 'approved':
      return 'A'; // Approved and on-going
    case 'archived':
      return 'C'; // Completed (assuming archived = completed)
    case 'disapproved':
      return 'T'; // Terminated
    case 'withdrawn':
      return 'W'; // Withdrawn
    default:
      return 'OR'; // Default to on-going review
  }
}

/**
 * Extract meeting date from meeting reference (only for full board reviews)
 * Returns null if not full board review or no meeting reference
 * Meeting reference format: "sequential-mm-yyyy" (e.g., "001-03-2025")
 */
export function extractMeetingDate(
  meetingReference: string | null | undefined,
  reviewType: string | undefined | null
): string | null {
  // Only extract if it's a full board review
  const normalizedReviewType = reviewType?.toString().toLowerCase().trim();
  if (normalizedReviewType !== 'full' && normalizedReviewType !== 'full board') {
    return null;
  }
  
  if (!meetingReference) return null;
  
  // Meeting reference format: "sequential-mm-yyyy" (e.g., "001-03-2025")
  // Extract month and year from the reference
  const match = meetingReference.match(/-(\d{2})-(\d{4})$/);
  if (match) {
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    
    // Format as MM/DD/YYYY (using first day of month as meeting date)
    // Note: We use the 1st of the month as the meeting date since the reference doesn't include day
    const date = new Date(year, month - 1, 1);
    return formatDate(date);
  }
  
  return null;
}

/**
 * Format date as MM/DD/YYYY
 */
function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  
  try {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return null;
  }
}

/**
 * Get primary reviewer name (first assigned reviewer, shortened format)
 */
export async function getPrimaryReviewerName(protocol: ChairpersonProtocol): Promise<string | null> {
  try {
    // Get assigned reviewers from protocol
    const assignedReviewers = protocol.assignedReviewers || [];
    if (assignedReviewers.length === 0) return null;
    
    // Get the first reviewer
    const firstReviewerId = assignedReviewers[0]?.reviewerId || assignedReviewers[0]?.id;
    if (!firstReviewerId) return null;
    
    // Fetch reviewer data
    const reviewer = await reviewersManagementService.getReviewerById(firstReviewerId);
    if (!reviewer || !reviewer.name) return null;
    
    // Shorten the name
    return shortenReviewerName(reviewer.name);
  } catch (error) {
    console.error('Error getting primary reviewer name:', error);
    return null;
  }
}

/**
 * Get researcher names (PI + co-researchers)
 */
function getResearcherNames(protocol: ChairpersonProtocol): string {
  const info = protocol.information;
  const pi = info?.general_information?.principal_investigator;
  const piName = pi?.name || '';
  
  // Get co-researchers
  const coResearchers = info?.general_information?.co_researchers || [];
  const coResearcherNames = coResearchers
    .map((cr: any) => cr.name)
    .filter((name: string) => name && name.trim());
  
  // Combine PI and co-researchers
  const allNames = [piName, ...coResearcherNames].filter(name => name && name.trim());
  return allNames.join(', ') || 'N/A';
}

/**
 * Transform protocol to report data format
 */
export async function transformProtocolToReportData(
  protocol: ChairpersonProtocol
): Promise<ReportData> {
  const info = protocol.information;
  const generalInfo = info?.general_information;
  const study = info?.nature_and_type_of_study;
  const funding = info?.source_of_funding;
  
  // Get review type
  const reviewTypeRaw = (() => {
    if (generalInfo && typeof generalInfo === 'object' && 'typeOfReview' in generalInfo) {
      return (generalInfo as { typeOfReview?: string }).typeOfReview || '';
    }
    return protocol.reviewType || '';
  })();
  const reviewType = mapReviewType(reviewTypeRaw);
  
  // Get primary reviewer name
  const primaryReviewerName = await getPrimaryReviewerName(protocol);
  
  // Get meeting date (only for full board reviews)
  const meetingReference = (() => {
    const candidate = (protocol as any).meetingReference;
    if (typeof candidate === 'string') return candidate;
    const decisionRef = (protocol as any).decision?.meetingReference;
    if (typeof decisionRef === 'string') return decisionRef;
    return null;
  })();
  const meetingDate = extractMeetingDate(meetingReference, reviewTypeRaw);
  
  // Get dates
  const submissionDate = protocol.createdAt ? formatDate(toDate(protocol.createdAt)) : null;
  const decisionDate = protocol.decisionDate ? formatDate(toDate(protocol.decisionDate)) : null;
  
  return {
    protocolCode: protocol.spupCode || protocol.tempProtocolCode || 'N/A',
    protocolTitle: protocol.title 
      || (generalInfo && typeof generalInfo === 'object' && 'protocol_title' in generalInfo
          ? (generalInfo as { protocol_title?: string }).protocol_title
          : undefined)
      || 'Untitled',
    researcherNames: getResearcherNames(protocol),
    funding: (() => {
      const source = funding;
      if (source && typeof source === 'object' && 'selected' in source) {
        return mapFundingSource((source as { selected?: string }).selected);
      }
      return mapFundingSource(undefined);
    })(),
    researchType: (() => {
      const s = study;
      if (s && typeof s === 'object' && 'type' in s) {
        return mapResearchType((s as { type?: string }).type);
      }
      return mapResearchType(undefined);
    })(),
    studyLevel: (() => {
      const s = study;
      if (s && typeof s === 'object' && 'level' in s) {
        return (s as { level?: string }).level || '';
      }
      return '';
    })(),
    dateReceived: submissionDate || '',
    reviewType: reviewType,
    meetingDate: meetingDate,
    primaryReviewerName: primaryReviewerName,
    decision: mapDecision(protocol.decision),
    decisionDate: decisionDate,
    status: mapStatus(protocol.status),
  };
}

/**
 * Transform multiple protocols to report data (batch processing with caching)
 */
export async function transformProtocolsToReportData(
  protocols: ChairpersonProtocol[]
): Promise<ReportData[]> {
  // Cache reviewer names to avoid multiple lookups
  const reviewerCache = new Map<string, string | null>();
  
  const results = await Promise.all(
    protocols.map(async (protocol) => {
      try {
        // Get primary reviewer with caching
        const assignedReviewers = protocol.assignedReviewers || [];
        let primaryReviewerName: string | null = null;
        
        if (assignedReviewers.length > 0) {
          const firstReviewerId = assignedReviewers[0]?.reviewerId || assignedReviewers[0]?.id;
          if (firstReviewerId) {
            if (reviewerCache.has(firstReviewerId)) {
              primaryReviewerName = reviewerCache.get(firstReviewerId) || null;
            } else {
              try {
                const reviewer = await reviewersManagementService.getReviewerById(firstReviewerId);
                const name = reviewer?.name ? shortenReviewerName(reviewer.name) : null;
                reviewerCache.set(firstReviewerId, name);
                primaryReviewerName = name;
              } catch {
                reviewerCache.set(firstReviewerId, null);
              }
            }
          }
        }
        
        // Transform protocol
        const info = protocol.information;
        const generalInfo = info?.general_information;
        const study = info?.nature_and_type_of_study;
        const funding = info?.source_of_funding;
        
        const reviewTypeRaw = (() => {
          if (generalInfo && typeof generalInfo === 'object' && 'typeOfReview' in generalInfo) {
            return (generalInfo as { typeOfReview?: string }).typeOfReview || '';
          }
          return protocol.reviewType || '';
        })();
        const reviewType = mapReviewType(reviewTypeRaw);
        
        const meetingReference = (() => {
          const direct = (protocol as any).meetingReference;
          if (typeof direct === 'string') return direct;
          const decisionRef = (protocol as any).decision?.meetingReference;
          if (typeof decisionRef === 'string') return decisionRef;
          return null;
        })();
        const meetingDate = extractMeetingDate(meetingReference, reviewTypeRaw);
        
        const submissionDate = protocol.createdAt ? formatDate(toDate(protocol.createdAt)) : null;
        const decisionDate = protocol.decisionDate ? formatDate(toDate(protocol.decisionDate)) : null;
        
        return {
          protocolCode: protocol.spupCode || protocol.tempProtocolCode || 'N/A',
          protocolTitle: protocol.title 
            || (generalInfo && typeof generalInfo === 'object' && 'protocol_title' in generalInfo
                ? (generalInfo as { protocol_title?: string }).protocol_title
                : undefined)
            || 'Untitled',
          researcherNames: getResearcherNames(protocol),
          funding: (() => {
            const source = funding;
            if (source && typeof source === 'object' && 'selected' in source) {
              return mapFundingSource((source as { selected?: string }).selected);
            }
            return mapFundingSource(undefined);
          })(),
          researchType: (() => {
            const s = study;
            if (s && typeof s === 'object' && 'type' in s) {
              return mapResearchType((s as { type?: string }).type);
            }
            return mapResearchType(undefined);
          })(),
          studyLevel: (() => {
            const s = study;
            if (s && typeof s === 'object' && 'level' in s) {
              return (s as { level?: string }).level || '';
            }
            return '';
          })(),
          dateReceived: submissionDate || '',
          reviewType: reviewType,
          meetingDate: meetingDate,
          primaryReviewerName: primaryReviewerName,
          decision: mapDecision(protocol.decision),
          decisionDate: decisionDate,
          status: mapStatus(protocol.status),
        } as ReportData;
      } catch (error) {
        console.error('Error transforming protocol to report data:', error);
        // Return minimal data on error
        return {
          protocolCode: protocol.spupCode || protocol.tempProtocolCode || 'N/A',
          protocolTitle: protocol.title || 'Untitled',
          researcherNames: 'N/A',
          funding: 'O',
          researchType: '',
          studyLevel: '',
          dateReceived: '',
          reviewType: 'ER',
          meetingDate: null,
          primaryReviewerName: null,
          decision: '',
          decisionDate: null,
          status: 'OR',
        } as ReportData;
      }
    })
  );
  
  return results as ReportData[];
}

