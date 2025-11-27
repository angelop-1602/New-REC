import { collection, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';

const db = getFirestore(firebaseApp);

export interface ReviewerAssessmentSummary {
  reviewerId: string;
  reviewerName?: string;
  assignmentId: string;
  formType: string;
  status: string;
  submittedAt?: any;
  formData: Record<string, any>;
}

export interface ProtocolAssessmentsResult {
  protocolId: string;
  totalAssigned: number;
  totalCompleted: number;
  allCompleted: boolean;
  assessments: ReviewerAssessmentSummary[];
}

export function formatAssessmentsToDocxData(protocol: any, result: ProtocolAssessmentsResult) {
  const title = protocol?.information?.general_information?.protocol_title || protocol?.title || result.protocolId;
  const spupCode = protocol?.spupCode || '';

  const reviewers = result.assessments.map(a => ({
    reviewer: a.reviewerName || a.reviewerId,
    formType: a.formType,
    status: a.status,
    // Flatten key answers from formData (first-level only)
    answers: Object.entries(a.formData || {}).map(([k, v]) => ({ key: k, value: typeof v === 'string' ? v : JSON.stringify(v) }))
  }));

  return { title, spupCode, reviewers };
}

/**
 * Fetch all reviewer assessments for a protocol, respecting the per-reviewer storage path:
 * submissions/{protocolId}/reviewers/{assignmentId}/assessment_forms/{formType}
 */
export async function getProtocolReviewerAssessments(protocolId: string): Promise<ProtocolAssessmentsResult> {
  // Load all reviewer assignments for the protocol
  const reviewersRef = collection(db, 'submissions', protocolId, 'reviewers');
  const reviewersSnap = await getDocs(reviewersRef);

  const summaries: ReviewerAssessmentSummary[] = [];

  for (const assignmentDoc of reviewersSnap.docs) {
    const assignment = assignmentDoc.data() as any;
    const assignmentId = assignmentDoc.id;

    // Read all assessment form docs under this reviewer (usually 1)
    const formsRef = collection(db, 'submissions', protocolId, 'reviewers', assignmentId, 'assessment_forms');
    const formsSnap = await getDocs(formsRef);

    for (const formDoc of formsSnap.docs) {
      const data = formDoc.data() as any;
      summaries.push({
        reviewerId: assignment.reviewerId,
        reviewerName: assignment.reviewerName,
        assignmentId,
        formType: data.formType || formDoc.id,
        status: data.status || assignment.reviewStatus || 'draft',
        submittedAt: data.submittedAt,
        formData: data.formData || {},
      });
    }

    // If reviewer has no assessment doc, still include a placeholder summary
    if (formsSnap.empty) {
      summaries.push({
        reviewerId: assignment.reviewerId,
        reviewerName: assignment.reviewerName,
        assignmentId,
        formType: assignment.assessmentType || 'unknown',
        status: assignment.reviewStatus || 'pending',
        submittedAt: undefined,
        formData: {},
      });
    }
  }

  const totalAssigned = reviewersSnap.size;
  const totalCompleted = summaries.filter(s => s.status === 'submitted' || s.status === 'approved' || s.status === 'completed').length;
  const allCompleted = totalAssigned > 0 && totalAssigned === summaries.filter(s => s.status === 'submitted' || s.status === 'approved' || s.status === 'completed').length;

  return {
    protocolId,
    totalAssigned,
    totalCompleted,
    allCompleted,
    assessments: summaries,
  };
}


