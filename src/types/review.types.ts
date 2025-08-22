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
