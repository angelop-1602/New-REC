/**
 * Comprehensive Mock Data for Protocol Submissions
 * 
 * This file contains mock data covering ALL possible scenarios in the protocol application process.
 * Use this to test and visualize all states without breaking existing functionality.
 */

import { Timestamp } from 'firebase/firestore';

// Helper function to create timestamps
// Negative values for future dates, positive for past dates
const createTimestamp = (daysOffset: number = 0, hoursOffset: number = 0): Timestamp => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset); // Negative = past, positive = future
  date.setHours(date.getHours() + hoursOffset); // Negative = past, positive = future
  return Timestamp.fromDate(date);
};

// Helper function to create base submission structure
const createBaseSubmission = (
  id: string,
  status: string,
  title: string,
  researchType: string = 'SR',
  studyLevel: string = "Master's Thesis",
  studyType: string = 'Social/Behavioral',
  daysAgo: number = 0,
  hoursAgo: number = 0
) => ({
  id,
  applicationID: id,
  protocolCode: `PROTO-${id.substring(0, 8)}`,
  title,
  submitBy: 'mock-user-uid-123',
  createdBy: 'mock-user-uid-123',
  createdAt: createTimestamp(-(daysAgo + 30), -hoursAgo),
  updatedAt: createTimestamp(-daysAgo, -hoursAgo),
  status,
  researchType,
  information: {
    general_information: {
      protocol_title: title,
      principal_investigator: {
        name: 'Dr. John Doe',
        email: 'john.doe@example.com',
        contact_number: '+63 912 345 6789',
        position: 'Associate Professor',
        institution: 'St. Paul University Philippines',
        address: 'Maharlika Highway, Tuguegarao City, Cagayan'
      },
      co_researchers: [
        { name: 'Jane Smith', email: 'jane.smith@example.com', contact_number: '+63 912 345 6780' },
        { name: 'Bob Johnson', email: 'bob.johnson@example.com' }
      ],
      adviser: {
        name: 'Dr. Maria Garcia',
        email: 'maria.garcia@example.com',
        contact_number: '+63 912 345 6781'
      }
    },
    nature_and_type_of_study: {
      level: studyLevel,
      type: studyType
    },
    study_site: {
      location: 'inside' as const,
      outside_specify: undefined
    },
    duration_of_study: {
      start_date: '2025-03-01',
      end_date: '2025-12-31'
    },
    source_of_funding: {
      selected: 'institution_funded' as const,
      others_specify: undefined
    },
    participants: {
      number_of_participants: 100,
      type_and_description: 'Undergraduate students aged 18-25'
    },
    brief_description_of_study: 'This is a comprehensive research study designed to investigate various aspects of the research topic. The study aims to contribute valuable insights to the field and provide practical recommendations for implementation.',
    technical_review_completed: true,
    submitted_to_other_committee: false
  }
});

// ============================================================================
// SCENARIO 1: PENDING SUBMISSIONS (Waiting for Chairperson Review)
// ============================================================================

export const mockPendingSubmission = {
  ...createBaseSubmission(
    'MOCK-PENDING-001',
    'pending',
    'Social Media Impact on Student Well-being: A Quantitative Analysis',
    'SR',
    "Master's Thesis",
    'Social/Behavioral',
    5
  ),
  tempProtocolCode: 'PENDING-20250115-123456',
  documents: []
};

export const mockPendingSubmissionWithDocuments = {
  ...createBaseSubmission(
    'MOCK-PENDING-002',
    'pending',
    'Clinical Trial Protocol for New Treatment Method',
    'BS',
    'Doctoral Dissertation',
    'Biomedical Studies',
    3
  ),
  tempProtocolCode: 'PENDING-20250117-789012',
  documents: [
    {
      id: 'doc1',
      title: 'Informed Consent Form',
      status: 'accepted',
      currentStatus: 'accepted',
      uploadedAt: createTimestamp(-3)
    },
    {
      id: 'doc2',
      title: 'Research Protocol',
      status: 'accepted',
      currentStatus: 'accepted',
      uploadedAt: createTimestamp(-3)
    }
  ]
};

export const mockPendingSubmissionWithDocumentRequests = {
  ...createBaseSubmission(
    'MOCK-PENDING-003',
    'pending',
    'Public Health Intervention Study in Rural Communities',
    'PR',
    'Faculty/Staff',
    'Public Health Research',
    7
  ),
  tempProtocolCode: 'PENDING-20250113-456789',
  documents: [
    {
      id: 'doc1',
      title: 'Informed Consent Form',
      status: 'requested',
      currentStatus: 'requested',
      uploadedAt: createTimestamp(-7)
    }
  ]
};

// ============================================================================
// SCENARIO 2: ACCEPTED SUBMISSIONS (No Reviewers Assigned Yet)
// ============================================================================

export const mockAcceptedNoReviewers = {
  ...createBaseSubmission(
    'MOCK-ACCEPTED-001',
    'accepted',
    'Digital Literacy Program for Senior Citizens',
    'SR',
    "Master's Thesis",
    'Social/Behavioral',
    10
  ),
  spupCode: 'SPUP_2025_00123_SR_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-10),
  documents: []
};

export const mockAcceptedWithDocuments = {
  ...createBaseSubmission(
    'MOCK-ACCEPTED-002',
    'accepted',
    'Animal Behavior Study in Controlled Environment',
    'BS',
    'Undergraduate Thesis',
    'Biomedical Studies',
    8
  ),
  spupCode: 'SPUP_2025_00124_BS_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-8),
  documents: [
    {
      id: 'doc1',
      title: 'IACUC Approval',
      status: 'accepted',
      currentStatus: 'accepted',
      uploadedAt: createTimestamp(-8)
    }
  ]
};

// ============================================================================
// SCENARIO 3: ACCEPTED WITH REVIEWERS ASSIGNED (In Review)
// ============================================================================

export const mockAcceptedWithReviewersPending = {
  ...createBaseSubmission(
    'MOCK-ACCEPTED-REVIEW-001',
    'accepted',
    'Mental Health Support Program for Students',
    'SR',
    'Funded Research',
    'Social/Behavioral',
    15
  ),
  spupCode: 'SPUP_2025_00125_SR_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-15),
  assignedAt: createTimestamp(-12),
  reviewers: [
    {
      reviewerId: 'reviewer-1',
      reviewerName: 'Dr. Reviewer One',
      assignedAt: createTimestamp(-12),
      deadline: createTimestamp(-1), // 1 day ago (expired)
      reviewStatus: 'pending',
      formType: 'Protocol Review Assessment'
    },
    {
      reviewerId: 'reviewer-2',
      reviewerName: 'Dr. Reviewer Two',
      assignedAt: createTimestamp(-12),
      deadline: createTimestamp(5), // 5 days from now
      reviewStatus: 'pending',
      formType: 'Informed Consent Assessment'
    }
  ]
};

export const mockAcceptedWithReviewersInProgress = {
  ...createBaseSubmission(
    'MOCK-ACCEPTED-REVIEW-002',
    'accepted',
    'Healthcare Quality Improvement Initiative',
    'HO',
    'Doctoral Dissertation',
    'Health Operations',
    20
  ),
  spupCode: 'SPUP_2025_00126_HO_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-20),
  assignedAt: createTimestamp(-18),
  reviewers: [
    {
      reviewerId: 'reviewer-1',
      reviewerName: 'Dr. Reviewer One',
      assignedAt: createTimestamp(-18),
      deadline: createTimestamp(4), // 4 days from now
      reviewStatus: 'pending',
      formType: 'Protocol Review Assessment',
      assessmentStatus: 'draft'
    },
    {
      reviewerId: 'reviewer-2',
      reviewerName: 'Dr. Reviewer Two',
      assignedAt: createTimestamp(-18),
      deadline: createTimestamp(4),
      reviewStatus: 'completed',
      formType: 'Informed Consent Assessment',
      assessmentStatus: 'submitted'
    }
  ]
};

export const mockAcceptedWithReviewersCompleted = {
  ...createBaseSubmission(
    'MOCK-ACCEPTED-REVIEW-003',
    'accepted',
    'Expedited Review: Survey on Student Satisfaction',
    'EX',
    "Master's Thesis",
    'Social/Behavioral',
    25
  ),
  spupCode: 'SPUP_2025_00127_EX_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-25),
  assignedAt: createTimestamp(-22),
  reviewers: [
    {
      reviewerId: 'reviewer-1',
      reviewerName: 'Dr. Reviewer One',
      assignedAt: createTimestamp(-22),
      deadline: createTimestamp(1), // 1 day from now
      reviewStatus: 'completed',
      formType: 'Checklist for Exemption Form Review',
      assessmentStatus: 'approved'
    }
  ]
};

export const mockAcceptedWithReturnedReviews = {
  ...createBaseSubmission(
    'MOCK-ACCEPTED-REVIEW-004',
    'accepted',
    'Full Board Review: Multi-site Clinical Study',
    'BS',
    'Funded Research',
    'Biomedical Studies',
    30
  ),
  spupCode: 'SPUP_2025_00128_BS_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-30),
  assignedAt: createTimestamp(-25),
  reviewers: [
    {
      reviewerId: 'reviewer-1',
      reviewerName: 'Dr. Reviewer One',
      assignedAt: createTimestamp(-25),
      deadline: createTimestamp(11), // 11 days from now
      reviewStatus: 'completed',
      formType: 'Protocol Review Assessment',
      assessmentStatus: 'returned',
      returnReason: 'Please provide more details on the methodology section and clarify the risk assessment.'
    },
    {
      reviewerId: 'reviewer-2',
      reviewerName: 'Dr. Reviewer Two',
      assignedAt: createTimestamp(-25),
      deadline: createTimestamp(11),
      reviewStatus: 'completed',
      formType: 'IACUC Protocol Review Assessment',
      assessmentStatus: 'approved'
    }
  ]
};

// ============================================================================
// SCENARIO 4: DECISIONS MADE (All Types)
// ============================================================================

export const mockApprovedDecision = {
  ...createBaseSubmission(
    'MOCK-APPROVED-001',
    'approved',
    'Approved: Online Learning Platform Effectiveness Study',
    'SR',
    "Master's Thesis",
    'Social/Behavioral',
    40
  ),
  spupCode: 'SPUP_2025_00129_SR_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-40),
  approvedAt: createTimestamp(-35),
  decision: 'approved',
  decisionDate: createTimestamp(-35),
  decisionBy: 'chairperson-uid',
  decisionDetails: {
    decision: 'approved',
    decisionDate: createTimestamp(-35),
    timeline: '30 days',
    meetingReference: undefined
  }
};

export const mockApprovedExemption = {
  ...createBaseSubmission(
    'MOCK-APPROVED-EX-001',
    'approved',
    'Exempted: Anonymous Survey Study',
    'EX',
    'Undergraduate Thesis',
    'Social/Behavioral',
    45
  ),
  spupCode: 'SPUP_2025_00130_EX_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-45),
  approvedAt: createTimestamp(-42),
  decision: 'approved',
  decisionDate: createTimestamp(-42),
  decisionBy: 'chairperson-uid',
  decisionDetails: {
    decision: 'approved',
    decisionDate: createTimestamp(-42),
    timeline: undefined,
    meetingReference: undefined
  }
};

export const mockMinorRevisionsDecision = {
  ...createBaseSubmission(
    'MOCK-MINOR-REV-001',
    'accepted',
    'Minor Revisions: Community Health Assessment',
    'PR',
    'Faculty/Staff',
    'Public Health Research',
    50
  ),
  spupCode: 'SPUP_2025_00131_PR_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-50),
  decision: 'approved_minor_revisions',
  decisionDate: createTimestamp(-48),
  decisionBy: 'chairperson-uid',
  decisionDetails: {
    decision: 'approved_minor_revisions',
    decisionDate: createTimestamp(-48),
    timeline: '14 days',
    meetingReference: undefined
  }
};

export const mockMajorRevisionsDecision = {
  ...createBaseSubmission(
    'MOCK-MAJOR-REV-001',
    'accepted',
    'Major Revisions: Experimental Drug Trial',
    'BS',
    'Doctoral Dissertation',
    'Biomedical Studies',
    55
  ),
  spupCode: 'SPUP_2025_00132_BS_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-55),
  decision: 'major_revisions_deferred',
  decisionDate: createTimestamp(-53),
  decisionBy: 'chairperson-uid',
  decisionDetails: {
    decision: 'major_revisions_deferred',
    decisionDate: createTimestamp(-53),
    timeline: '30 days',
    meetingReference: undefined
  }
};

export const mockDisapprovedDecision = {
  ...createBaseSubmission(
    'MOCK-DISAPPROVED-001',
    'accepted',
    'Disapproved: High-Risk Study Protocol',
    'BS',
    'Funded Research',
    'Biomedical Studies',
    60
  ),
  spupCode: 'SPUP_2025_00133_BS_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-60),
  decision: 'disapproved',
  decisionDate: createTimestamp(-58),
  decisionBy: 'chairperson-uid',
  decisionDetails: {
    decision: 'disapproved',
    decisionDate: createTimestamp(-58),
    timeline: undefined,
    meetingReference: undefined
  }
};

export const mockDeferredDecision = {
  ...createBaseSubmission(
    'MOCK-DEFERRED-001',
    'accepted',
    'Deferred: Complex Multi-site Study',
    'PR',
    'Funded Research',
    'Public Health Research',
    65
  ),
  spupCode: 'SPUP_2025_00134_PR_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-65),
  decision: 'deferred',
  decisionDate: createTimestamp(-63),
  decisionBy: 'chairperson-uid',
  decisionDetails: {
    decision: 'deferred',
    decisionDate: createTimestamp(-63),
    timeline: '60 days',
    meetingReference: 'FB-2025-01-15'
  }
};

export const mockFullBoardApproved = {
  ...createBaseSubmission(
    'MOCK-FULLBOARD-001',
    'approved',
    'Full Board Approved: Large-scale Clinical Trial',
    'BS',
    'Funded Research',
    'Biomedical Studies',
    70
  ),
  spupCode: 'SPUP_2025_00135_BS_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-70),
  approvedAt: createTimestamp(-65),
  decision: 'approved',
  decisionDate: createTimestamp(-65),
  decisionBy: 'chairperson-uid',
  decisionDetails: {
    decision: 'approved',
    decisionDate: createTimestamp(-65),
    timeline: '1 year',
    meetingReference: 'FB-2025-01-10'
  },
  information: {
    ...createBaseSubmission('', '', '').information,
    general_information: {
      ...createBaseSubmission('', '', '').information.general_information,
      typeOfReview: 'Full Board'
    }
  }
};

// ============================================================================
// SCENARIO 5: ARCHIVED PROTOCOLS
// ============================================================================

export const mockArchivedCompleted = {
  ...createBaseSubmission(
    'MOCK-ARCHIVED-001',
    'archived',
    'Archived: Completed Student Research Project',
    'SR',
    "Master's Thesis",
    'Social/Behavioral',
    100
  ),
  spupCode: 'SPUP_2024_00999_SR_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-100),
  approvedAt: createTimestamp(-95),
  archivedAt: createTimestamp(-10),
  decision: 'approved',
  decisionDate: createTimestamp(-95),
  decisionBy: 'chairperson-uid'
};

export const mockArchivedTerminated = {
  ...createBaseSubmission(
    'MOCK-ARCHIVED-002',
    'archived',
    'Archived: Terminated Study Protocol',
    'BS',
    'Funded Research',
    'Biomedical Studies',
    120
  ),
  spupCode: 'SPUP_2024_00998_BS_JD',
  acceptedBy: 'chairperson-uid',
  acceptedAt: createTimestamp(-120),
  approvedAt: createTimestamp(-115),
  archivedAt: createTimestamp(-5),
  decision: 'approved',
  decisionDate: createTimestamp(-115),
  decisionBy: 'chairperson-uid',
  archivedStatus: 'terminated'
};

// ============================================================================
// SCENARIO 6: DRAFT SUBMISSIONS
// ============================================================================

export const mockDraftSubmission = {
  ...createBaseSubmission(
    'MOCK-DRAFT-001',
    'draft',
    'Draft: Research Protocol in Progress',
    'SR',
    "Master's Thesis",
    'Social/Behavioral',
    2
  ),
  tempProtocolCode: 'DRAFT-20250118-111111',
  documents: []
};

// ============================================================================
// SCENARIO 7: ALL STUDY LEVELS
// ============================================================================

export const mockUndergraduateThesis = {
  ...createBaseSubmission(
    'MOCK-UNDERGRAD-001',
    'accepted',
    'Undergraduate Thesis: Case Study Analysis',
    'SR',
    'Undergraduate Thesis',
    'Social/Behavioral',
    15
  ),
  spupCode: 'SPUP_2025_00136_SR_JD'
};

export const mockMastersThesis = {
  ...createBaseSubmission(
    'MOCK-MASTERS-001',
    'accepted',
    "Master's Thesis: Advanced Research Methodology",
    'SR',
    "Master's Thesis",
    'Social/Behavioral',
    15
  ),
  spupCode: 'SPUP_2025_00137_SR_JD'
};

export const mockDoctoralDissertation = {
  ...createBaseSubmission(
    'MOCK-DOCTORAL-001',
    'accepted',
    'Doctoral Dissertation: Comprehensive Research Study',
    'BS',
    'Doctoral Dissertation',
    'Biomedical Studies',
    15
  ),
  spupCode: 'SPUP_2025_00138_BS_JD'
};

export const mockFacultyStaff = {
  ...createBaseSubmission(
    'MOCK-FACULTY-001',
    'accepted',
    'Faculty Research: Institutional Study',
    'PR',
    'Faculty/Staff',
    'Public Health Research',
    15
  ),
  spupCode: 'SPUP_2025_00139_PR_JD'
};

export const mockFundedResearch = {
  ...createBaseSubmission(
    'MOCK-FUNDED-001',
    'accepted',
    'Funded Research: Grant-Funded Project',
    'BS',
    'Funded Research',
    'Biomedical Studies',
    15
  ),
  spupCode: 'SPUP_2025_00140_BS_JD'
};

// ============================================================================
// SCENARIO 8: ALL RESEARCH TYPES
// ============================================================================

export const mockSocialResearch = {
  ...createBaseSubmission(
    'MOCK-SR-001',
    'accepted',
    'Social Research: Behavioral Study',
    'SR',
    "Master's Thesis",
    'Social/Behavioral',
    15
  ),
  spupCode: 'SPUP_2025_00141_SR_JD'
};

export const mockPublicHealthResearch = {
  ...createBaseSubmission(
    'MOCK-PR-001',
    'accepted',
    'Public Health Research: Community Study',
    'PR',
    'Faculty/Staff',
    'Public Health Research',
    15
  ),
  spupCode: 'SPUP_2025_00142_PR_JD'
};

export const mockHealthOperations = {
  ...createBaseSubmission(
    'MOCK-HO-001',
    'accepted',
    'Health Operations: System Improvement Study',
    'HO',
    'Funded Research',
    'Health Operations',
    15
  ),
  spupCode: 'SPUP_2025_00143_HO_JD'
};

export const mockBiomedicalStudies = {
  ...createBaseSubmission(
    'MOCK-BS-001',
    'accepted',
    'Biomedical Studies: Clinical Research',
    'BS',
    'Doctoral Dissertation',
    'Biomedical Studies',
    15
  ),
  spupCode: 'SPUP_2025_00144_BS_JD'
};

export const mockExemption = {
  ...createBaseSubmission(
    'MOCK-EX-001',
    'accepted',
    'Exemption: Low-Risk Survey Study',
    'EX',
    'Undergraduate Thesis',
    'Social/Behavioral',
    15
  ),
  spupCode: 'SPUP_2025_00145_EX_JD'
};

// ============================================================================
// COMPREHENSIVE MOCK DATA ARRAY
// ============================================================================

export const allMockSubmissions = [
  // Pending
  mockPendingSubmission,
  mockPendingSubmissionWithDocuments,
  mockPendingSubmissionWithDocumentRequests,
  
  // Accepted (No Reviewers)
  mockAcceptedNoReviewers,
  mockAcceptedWithDocuments,
  
  // Accepted (With Reviewers)
  mockAcceptedWithReviewersPending,
  mockAcceptedWithReviewersInProgress,
  mockAcceptedWithReviewersCompleted,
  mockAcceptedWithReturnedReviews,
  
  // Decisions
  mockApprovedDecision,
  mockApprovedExemption,
  mockMinorRevisionsDecision,
  mockMajorRevisionsDecision,
  mockDisapprovedDecision,
  mockDeferredDecision,
  mockFullBoardApproved,
  
  // Archived
  mockArchivedCompleted,
  mockArchivedTerminated,
  
  // Draft
  mockDraftSubmission,
  
  // Study Levels
  mockUndergraduateThesis,
  mockMastersThesis,
  mockDoctoralDissertation,
  mockFacultyStaff,
  mockFundedResearch,
  
  // Research Types
  mockSocialResearch,
  mockPublicHealthResearch,
  mockHealthOperations,
  mockBiomedicalStudies,
  mockExemption
];

// ============================================================================
// EXPORT BY CATEGORY FOR EASY TESTING
// ============================================================================

export const mockByStatus = {
  pending: [
    mockPendingSubmission,
    mockPendingSubmissionWithDocuments,
    mockPendingSubmissionWithDocumentRequests
  ],
  accepted: [
    mockAcceptedNoReviewers,
    mockAcceptedWithDocuments,
    mockAcceptedWithReviewersPending,
    mockAcceptedWithReviewersInProgress,
    mockAcceptedWithReviewersCompleted,
    mockAcceptedWithReturnedReviews,
    mockMinorRevisionsDecision,
    mockMajorRevisionsDecision,
    mockDisapprovedDecision,
    mockDeferredDecision
  ],
  approved: [
    mockApprovedDecision,
    mockApprovedExemption,
    mockFullBoardApproved
  ],
  archived: [
    mockArchivedCompleted,
    mockArchivedTerminated
  ],
  draft: [
    mockDraftSubmission
  ]
};

export const mockByResearchType = {
  SR: mockSocialResearch,
  PR: mockPublicHealthResearch,
  HO: mockHealthOperations,
  BS: mockBiomedicalStudies,
  EX: mockExemption
};

export const mockByDecision = {
  approved: mockApprovedDecision,
  approved_minor_revisions: mockMinorRevisionsDecision,
  major_revisions_deferred: mockMajorRevisionsDecision,
  disapproved: mockDisapprovedDecision,
  deferred: mockDeferredDecision
};

