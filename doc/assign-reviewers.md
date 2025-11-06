"Implement a complete reviewer assignment system for the REC chairperson with the following requirements:
1. Core Functionality:
Button: Add "Assign Reviewers" button in chairperson actions (only for accepted/pending protocols)
Dialog: Create a modal dialog for reviewer selection
Research Type Logic: Different reviewer requirements based on research type:
Social Research: 3 reviewers (2x Protocol Review + 1x Informed Consent)
Experimental Research: 2 reviewers (2x IACUC Protocol Review)
Exemption: 2 reviewers (2x Checklist for Exemption Form Review)
2. Data Source:
Fetch reviewers from Firestore reviewers collection
Filter active reviewers only (isActive: true)
Display reviewer info: name, code
3. UI Components:
Individual dropdowns for each required reviewer position
Assessment type badges showing what each reviewer will assess
Search functionality to filter reviewers by name
4. Data Storage:
Save assignments to Firestore subcollection: submissions_accepted/{protocolId}/reviewers
Assignment structure:
typescript
  {
    reviewerId: string,
    reviewerName: string,
    reviewerEmail: string,
    assessmentType: string,
    position: number,
    assignedAt: string
  }
5. User Experience:
Clear visual feedback for selected/unselected positions
Success/error messages for assignment operations
Automatic dialog closure after successful assignment
Loading states during operations
6. Technical Requirements:
TypeScript interfaces for all data structures
Firebase Firestore integration
Error handling for database operations
Clean component architecture with proper separation of concerns
Please implement this as a complete, working system that integrates seamlessly with the existing chairperson dashboard."