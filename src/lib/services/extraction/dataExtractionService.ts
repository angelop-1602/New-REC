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
  ExtractionStats 
} from '@/types/extraction.types';

const db = getFirestore(firebaseApp);

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
        const researchType = p.information?.nature_and_type_of_study?.type;
        return typeof researchType === 'string' && 
               filters.researchType!.includes(researchType);
      });
    }
    
    if (filters.studyLevel && filters.studyLevel.length > 0) {
      protocols = protocols.filter(p => {
        const studyLevel = p.information?.nature_and_type_of_study?.level;
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
    submissionDate: protocol.createdAt ? toISOString(protocol.createdAt) : undefined,
    approvalDate: protocol.approvedAt ? toISOString(protocol.approvedAt) : undefined,
    decisionDate: protocol.decisionDate ? toISOString(protocol.decisionDate) : undefined,
    
    // Principal Investigator
    piName: pi?.name || undefined,
    piEmail: pi?.email || undefined,
    piContact: pi?.contact_number || undefined,
    piAddress: pi?.address || undefined,
    piPosition: pi?.position_institution || undefined,
    piCourse: pi?.course_program || undefined,
    adviser: info?.general_information?.adviser?.name || undefined,
    
    // Research Details
    studyLevel: study?.level || undefined,
    studyType: study?.type || undefined,
    studySite: info?.study_site?.location === 'outside' 
      ? info.study_site.outside_specify 
      : info?.study_site?.location || undefined,
    durationStart: info?.duration_of_study?.start_date || undefined,
    durationEnd: info?.duration_of_study?.end_date || undefined,
    participants: info?.participants?.number_of_participants || undefined,
    description: info?.brief_description_of_study || undefined,
    
    // Funding
    fundingSource: info?.source_of_funding?.selected || undefined,
    pharmaceuticalCompany: info?.source_of_funding?.pharmaceutical_company_specify || undefined,
    otherFunding: info?.source_of_funding?.others_specify || undefined,
    
    // Administrative
    assignedReviewers: protocol.totalReviewers || undefined,
    completedReviews: protocol.completedReviews || undefined,
    pendingReviews: protocol.pendingReviews || undefined,
    reviewType: protocol.reviewType || undefined,
    priority: protocol.priority || undefined,
    chairNotes: protocol.chairNotes || undefined,
    
    // Financial
    orNumber: info?.or_number || undefined,
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
    SR: protocols.filter(p => 
      p.information?.nature_and_type_of_study?.type === 'Social/Behavioral'
    ).length,
    PR: protocols.filter(p => 
      p.information?.nature_and_type_of_study?.type === 'Public Health Research'
    ).length,
    HO: protocols.filter(p => 
      p.information?.nature_and_type_of_study?.type === 'Health Operations'
    ).length,
    BS: protocols.filter(p => 
      p.information?.nature_and_type_of_study?.type === 'Biomedical Studies'
    ).length,
    EX: protocols.filter(p => 
      p.information?.nature_and_type_of_study?.type === 'Clinical Trials'
    ).length,
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

