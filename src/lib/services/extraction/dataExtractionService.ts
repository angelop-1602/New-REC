/**
 * Data Extraction Service
 * Handles fetching and transforming protocol data for export
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { 
  ChairpersonProtocol, 
  toChairpersonProtocols,
  toDate,
  toISOString 
} from '@/types';
import { SUBMISSIONS_COLLECTION } from '@/lib/firebase/firestore';
import { 
  ExtractionFilters, 
  ProtocolExportData, 
  ExtractionStats,
  ReportPeriod
} from '@/types/extraction.types';

const db = getFirestore(firebaseApp);

/**
 * Calculate date range for monthly report
 */
export function getMonthlyDateRange(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
  return { start, end };
}

/**
 * Calculate date range for yearly report
 */
export function getYearlyDateRange(year: number): { start: Date; end: Date } {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999); // Last day of year
  return { start, end };
}

/**
 * Fetch protocols for report (monthly or yearly)
 */
export async function fetchProtocolsForReport(
  period: ReportPeriod
): Promise<ChairpersonProtocol[]> {
  const { start, end } = period.type === 'monthly' && period.month
    ? getMonthlyDateRange(period.month, period.year)
    : getYearlyDateRange(period.year);
  
  const filters: ExtractionFilters = {
    dateRange: {
      start,
      end,
      field: 'submission', // Use submission date for reports
    },
  };
  
  return fetchProtocolsForExtraction(filters);
}

/**
 * Fetch protocols based on extraction filters
 */
export async function fetchProtocolsForExtraction(
  filters: ExtractionFilters
): Promise<ChairpersonProtocol[]> {
  try {
    const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
    let q = query(submissionsRef);
    
    // Apply date range filter
    if (filters.dateRange) {
      const { start, end, field } = filters.dateRange;
      const dateField = field === 'approval' ? 'approvedAt' : 
                       field === 'decision' ? 'decisionDate' : 
                       'createdAt';
      
      if (start) {
        q = query(q, where(dateField, '>=', Timestamp.fromDate(start)));
      }
      if (end) {
        // Add one day to include the end date
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        q = query(q, where(dateField, '<=', Timestamp.fromDate(endDate)));
      }
    }
    
    const snapshot = await getDocs(q);
    let protocols = toChairpersonProtocols(
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    );
    
    // Apply additional filters in memory (to avoid complex Firestore queries)
    if (filters.status && filters.status.length > 0) {
      protocols = protocols.filter(p => filters.status!.includes(p.status));
    }
    
    if (filters.researchType && filters.researchType.length > 0) {
      protocols = protocols.filter(p => {
        const study = p.information?.nature_and_type_of_study;
        const researchType = study && typeof study === 'object' && 'type' in study 
          ? (study as { type?: string }).type 
          : undefined;
        return typeof researchType === 'string' && 
               filters.researchType!.includes(researchType);
      });
    }
    
    if (filters.studyLevel && filters.studyLevel.length > 0) {
      protocols = protocols.filter(p => {
        const study = p.information?.nature_and_type_of_study;
        const studyLevel = study && typeof study === 'object' && 'level' in study 
          ? (study as { level?: string }).level 
          : undefined;
        return typeof studyLevel === 'string' && 
               filters.studyLevel!.includes(studyLevel);
      });
    }
    
    if (filters.hasOrNumber !== null && filters.hasOrNumber !== undefined) {
      protocols = protocols.filter(p => {
        const hasOr = !!p.information?.or_number;
        return filters.hasOrNumber ? hasOr : !hasOr;
      });
    }
    
    if (filters.hasReviewers !== null && filters.hasReviewers !== undefined) {
      protocols = protocols.filter(p => {
        const hasReviewers = (p.totalReviewers || 0) > 0;
        return filters.hasReviewers ? hasReviewers : !hasReviewers;
      });
    }
    
    if (filters.documentsComplete !== null && filters.documentsComplete !== undefined) {
      protocols = protocols.filter(p => {
        return filters.documentsComplete ? 
               (p.documentsComplete === true) : 
               (p.documentsComplete !== true);
      });
    }
    
    return protocols;
  } catch (error) {
    console.error('Error fetching protocols for extraction:', error);
    throw new Error('Failed to fetch protocols for extraction');
  }
}

/**
 * Transform protocol to export data format
 */
export function transformProtocolToExportData(
  protocol: ChairpersonProtocol
): ProtocolExportData {
  const info = protocol.information;
  const pi = info?.general_information?.principal_investigator;
  const study = info?.nature_and_type_of_study;
  
  return {
    // Basic Information
    protocolId: protocol.id,
    spupCode: protocol.spupCode || undefined,
    tempCode: protocol.tempProtocolCode || undefined,
    title: protocol.title || info?.general_information?.protocol_title || 'Untitled',
    status: protocol.status || 'pending',
    submissionDate: protocol.createdAt ? (toISOString(protocol.createdAt) ?? undefined) : undefined,
    approvalDate: protocol.approvedAt ? (toISOString(protocol.approvedAt) ?? undefined) : undefined,
    decisionDate: protocol.decisionDate ? (toISOString(protocol.decisionDate) ?? undefined) : undefined,
    
    // Principal Investigator
    piName: pi?.name || undefined,
    piEmail: pi?.email || undefined,
    piContact: pi?.contact_number || undefined,
    piAddress: pi?.address || undefined,
    piPosition: pi?.position_institution || undefined,
    piCourse: pi?.course_program || undefined,
    adviser: info?.general_information?.adviser?.name || undefined,
    
    // Research Details
    studyLevel: (study && typeof study === 'object' && 'level' in study)
      ? (study as { level?: string }).level
      : undefined,
    studyType: (study && typeof study === 'object' && 'type' in study)
      ? (study as { type?: string }).type
      : undefined,
    studySite: (() => {
      const site = info?.study_site;
      if (site && typeof site === 'object' && 'location' in site) {
        const location = (site as { location?: string; outside_specify?: string }).location;
        if (location === 'outside') {
          return (site as { outside_specify?: string }).outside_specify || undefined;
        }
        return location || undefined;
      }
      return undefined;
    })(),
    durationStart: (() => {
      const duration = info?.duration_of_study;
      if (duration && typeof duration === 'object' && 'start_date' in duration) {
        return (duration as { start_date?: string }).start_date || undefined;
      }
      return undefined;
    })(),
    durationEnd: (() => {
      const duration = info?.duration_of_study;
      if (duration && typeof duration === 'object' && 'end_date' in duration) {
        return (duration as { end_date?: string }).end_date || undefined;
      }
      return undefined;
    })(),
    participants: (() => {
      const participants = info?.participants;
      if (participants && typeof participants === 'object' && 'number_of_participants' in participants) {
        return (participants as { number_of_participants?: number }).number_of_participants || undefined;
      }
      return undefined;
    })(),
    description: typeof info?.brief_description_of_study === 'string'
      ? info.brief_description_of_study
      : undefined,
    
    // Funding
    fundingSource: (() => {
      const funding = info?.source_of_funding;
      if (funding && typeof funding === 'object' && 'selected' in funding) {
        return (funding as { selected?: string }).selected || undefined;
      }
      return undefined;
    })(),
    pharmaceuticalCompany: (() => {
      const funding = info?.source_of_funding;
      if (funding && typeof funding === 'object' && 'pharmaceutical_company_specify' in funding) {
        return (funding as { pharmaceutical_company_specify?: string }).pharmaceutical_company_specify || undefined;
      }
      return undefined;
    })(),
    otherFunding: (() => {
      const funding = info?.source_of_funding;
      if (funding && typeof funding === 'object' && 'others_specify' in funding) {
        return (funding as { others_specify?: string }).others_specify || undefined;
      }
      return undefined;
    })(),
    
    // Administrative
    assignedReviewers: protocol.totalReviewers || undefined,
    completedReviews: protocol.completedReviews || undefined,
    pendingReviews: protocol.pendingReviews || undefined,
    reviewType: protocol.reviewType || undefined,
    priority: protocol.priority || undefined,
    chairNotes: protocol.chairNotes || undefined,
    
    // Financial
    orNumber: typeof info?.or_number === 'string' ? info.or_number : undefined,
  };
}

/**
 * Get extraction statistics
 */
export async function getExtractionStatistics(
  filters: ExtractionFilters
): Promise<ExtractionStats> {
  const protocols = await fetchProtocolsForExtraction(filters);
  
  const byStatus = {
    pending: protocols.filter(p => p.status === 'pending').length,
    accepted: protocols.filter(p => p.status === 'accepted').length,
    approved: protocols.filter(p => p.status === 'approved').length,
    archived: protocols.filter(p => p.status === 'archived').length,
    rejected: protocols.filter(p => p.status === 'disapproved').length,
  };
  
  const byResearchType = {
    SR: protocols.filter(p => {
      const study = p.information?.nature_and_type_of_study;
      const type = study && typeof study === 'object' && 'type' in study
        ? (study as { type?: string }).type
        : undefined;
      return type === 'Social/Behavioral';
    }).length,
    PR: protocols.filter(p => {
      const study = p.information?.nature_and_type_of_study;
      const type = study && typeof study === 'object' && 'type' in study
        ? (study as { type?: string }).type
        : undefined;
      return type === 'Public Health Research';
    }).length,
    HO: protocols.filter(p => {
      const study = p.information?.nature_and_type_of_study;
      const type = study && typeof study === 'object' && 'type' in study
        ? (study as { type?: string }).type
        : undefined;
      return type === 'Health Operations';
    }).length,
    BS: protocols.filter(p => {
      const study = p.information?.nature_and_type_of_study;
      const type = study && typeof study === 'object' && 'type' in study
        ? (study as { type?: string }).type
        : undefined;
      return type === 'Biomedical Studies';
    }).length,
    EX: protocols.filter(p => {
      const study = p.information?.nature_and_type_of_study;
      const type = study && typeof study === 'object' && 'type' in study
        ? (study as { type?: string }).type
        : undefined;
      return type === 'Clinical Trials';
    }).length,
  };
  
  const withOrNumber = protocols.filter(p => !!p.information?.or_number).length;
  const withoutOrNumber = protocols.length - withOrNumber;
  
  // Get date range
  const dates = protocols
    .map(p => p.createdAt ? toDate(p.createdAt) : null)
    .filter((d): d is Date => d !== null);
  
  const earliest = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
  const latest = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
  
  return {
    totalProtocols: protocols.length,
    byStatus,
    byResearchType,
    withOrNumber,
    withoutOrNumber,
    dateRange: {
      earliest,
      latest,
    },
  };
}

