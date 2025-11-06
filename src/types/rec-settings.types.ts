import { Timestamp } from 'firebase/firestore';

export interface RECMember {
  id: string;
  name: string;
  email?: string;
  position: string;
  department?: string;
  isActive: boolean;
  appointedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RECLineup {
  id: string;
  chair: RECMember;
  viceChair: RECMember;
  secretary: RECMember;
  staff: RECMember[];
  members: RECMember[];
  isActive: boolean;
  effectiveDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface RECSettings {
  id: string;
  currentLineup: RECLineup;
  institutionName: string;
  institutionAddress?: string;
  institutionLogo?: string;
  contactEmail?: string;
  contactPhone?: string;
  defaultDurationApproval: string; // e.g., "1 year"
  documentTemplates: {
    letterhead?: string;
    footer?: string;
    signature?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}

export type RECPosition = 'chair' | 'viceChair' | 'secretary' | 'staff' | 'member';

export interface CreateRECMemberRequest {
  name: string;
  email?: string;
  position: string;
  department?: string;
}

export interface UpdateRECLineupRequest {
  chairId?: string;
  viceChairId?: string;
  secretaryId?: string;
  staffIds?: string[];
  memberIds?: string[];
}
