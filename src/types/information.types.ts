// ===========================
// Protocol Informations TYPES
// ===========================

// Level of study for the research protocol
export type StudyLevel =
  | ""
  | "Undergraduate Thesis"
  | "Master's Thesis"
  | "Doctoral Dissertation"
  | "Faculty/Staff"
  | "Funded Research"
  | "Others";

// General category or methodology of the research
export type StudyType =
  | ""
  | "Social/Behavioral"
  | "Public Health Research"
  | "Health Operations"
  | "Biomedical Studies"
  | "Clinical Trials"
  | "Others";

// ===========================
// PEOPLE & TEAM
// ===========================

// Any researcher other than the principal investigator
export interface Researcher {
  id?: string;      // Optional: for easy list rendering, editing, or deletion
  name: string;     // Researcher's full name
}

// Lead researcher who is responsible for the protocol
export interface PrincipalInvestigator {
  name: string;                   // Full name
  email: string;                  // Email address
  address: string;                // Complete mailing address
  contact_number: string;         // Phone or mobile number
  position_institution: string;   // Job position and institution combined
  course_program?: string;        // Course or program of study (for students)
}

// Research adviser or mentor (can be multiple)
export interface Adviser {
  id?: string;     // Optional: for list editing/removal
  name: string;    // Adviser's name
}

// ===========================
// STUDY LOCATION
// ===========================

// Details for research conducted outside the home university
export interface ResearchOutsideUniversity {
  is_outside: boolean;   // Is this outside the main university?
  specify: string;       // Details about the external location/site
}

// Describes where the study will be conducted
export interface StudySite {
  location: "within" | "outside";     // Study location selection
  outside_specify?: string;           // Details if location is outside university
}

// ===========================
// STUDY DURATION
// ===========================

// Timeframe for conducting the study
export interface DurationOfStudy {
  start_date: string;   // Start date in ISO format (YYYY-MM-DD)
  end_date: string;     // End date in ISO format (YYYY-MM-DD)
}

// ===========================
// FUNDING SOURCES
// ===========================

// Details about pharmaceutical company sponsorship
export interface PharmaceuticalCompanyFunding {
  is_funded: boolean;   // Is there funding from a pharmaceutical company?
  specify: string;      // Which company?
}

// List of all potential sources of funding for the study
export interface SourceOfFunding {
  selected: "self_funded" | "institution_funded" | "government_funded" | "scholarship" | "research_grant" | "pharmaceutical_company" | "others";
  pharmaceutical_company_specify?: string;     // Details if pharmaceutical company is selected
  others_specify?: string;                     // Details if others is selected
}

// ===========================
// PARTICIPANTS
// ===========================

// Participant information for the study
export interface Participants {
  number_of_participants: number | null;       // Total participants in the study
  type_and_description: string;         // Description of participant type, inclusion/exclusion criteria, etc.
}

// ===========================
// OVERALL FORM STRUCTURE
// ===========================

// The main form object containing all required and optional data for a protocol submission
export interface InformationType {
  
  general_information: {
    protocol_title: string;                       // Official research protocol title
    principal_investigator: PrincipalInvestigator;// PI details
    co_researchers: Researcher[];                 // Other team members
    adviser: Adviser;                          // Advisers/mentors
  };

  nature_and_type_of_study: {
    level: StudyLevel;        // Study level (see above)
    type: StudyType;          // Study type/category (see above)
  };

  study_site?: StudySite;                      // Where study is conducted (can be omitted if not known yet)
  duration_of_study?: DurationOfStudy;         // Study period (start/end)
  source_of_funding?: SourceOfFunding;         // Funding sources (if any)
  participants?: Participants;                 // Info about participants
  
  // Pre-submission status questions
  technical_review_completed?: boolean | null;         // Has the research undergone technical review/proposal defense?
  submitted_to_other_committee?: boolean | null;       // Has the research been submitted to another research ethics committee?
  
  brief_description_of_study?: string;         // Abstract/summary (minimum 50 words, if enforced)
  
  // Administrative fields (added by chairperson/admin)
  or_number?: string;                          // OR Number (Official Receipt Number) - added by admin when data is available

  // Optional advanced fields for future-proofing:
  history?: { by: string; at: string; note: string }[]; // (Optional) Log of changes, reviewer comments, etc.
  version?: number;                                      // (Optional) Version of form data, useful for edits/revisions
}
