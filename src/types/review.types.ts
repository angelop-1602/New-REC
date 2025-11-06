import { FormResponse } from "./forms.type";

export interface ReviewerAssignment {
  reviewerId: string;
  name: string;
  status: "pending" | "completed" | "approved" ;
  assignedAt: string;
  completedAt?: string;
  decision?: "approve" | "revisions-required" | "disapprove";
  comments?: string;
  filledForm?: FormResponse; // answers for their review
}

export interface SubmissionReview {
  id: string;                  // document id in 'reviews'
  protocolId: string;          // parent submission id
  reviewers: ReviewerAssignment[];
  startedAt: string;
  completedAt?: string;
  status: "in-progress" | "completed" | "cancelled";
  overallDecision?: "approve" | "revisions-required" | "disapprove";
  overallComments?: string;
}

// Reassignment History for tracking reviewer changes
export interface ReassignmentHistory {
  id?: string;                           // document id in 'reassignment_history' subcollection
  protocolId: string;                    // parent submission id
  oldReviewerId: string;                 // reviewer who was removed
  oldReviewerName: string;               // name of removed reviewer
  oldReviewerEmail: string;              // email of removed reviewer
  newReviewerId: string;                 // new reviewer assigned
  newReviewerName: string;               // name of new reviewer
  newReviewerEmail: string;              // email of new reviewer
  assessmentType: string;                // which assessment position was reassigned
  position: number;                      // position index in reviewer array
  originalDeadline: Date | any;         // original deadline that was missed
  newDeadline: Date | any;              // new deadline for new reviewer
  reassignedAt: Date | any;             // timestamp when reassignment happened
  reassignedBy: string;                 // chairperson who did the reassignment
  reason: string;                       // reason for reassignment
  daysOverdue: number;                  // how many days past deadline when reassigned
}

// Extended protocol data for reassigned tab view
export interface ReassignedProtocol {
  protocolId: string;
  protocolTitle: string;
  spupCode: string;
  originalDeadline: Date | any;
  reassignedAt: Date | any;
  reason: string;
  assessmentType: string;
  daysOverdue: number;
}