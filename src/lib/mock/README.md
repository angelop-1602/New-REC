# Mock Data for Protocol Submissions

This directory contains comprehensive mock data covering all possible scenarios in the protocol application process.

## Purpose

The mock data helps you:
- Visualize all possible states in the application
- Test UI components without needing real data
- Identify missing states or edge cases
- Understand the complete workflow

## Files

- **`mockSubmissions.ts`**: Contains all mock submission data with different scenarios
- **`mockDataLoader.ts`**: Utility functions to load and format mock data

## Usage

### Import Mock Data

```typescript
import { allMockSubmissions, mockByStatus } from '@/lib/mock/mockSubmissions';
import { getMockSubmissionsByStatus, getAllFormattedMockSubmissions } from '@/lib/mock/mockDataLoader';
```

### Get Mock Submissions by Status

```typescript
// Get all pending submissions
const pendingSubmissions = getMockSubmissionsByStatus('pending');

// Get all accepted submissions
const acceptedSubmissions = getMockSubmissionsByStatus('accepted');

// Get all approved submissions
const approvedSubmissions = getMockSubmissionsByStatus('approved');

// Get all archived submissions
const archivedSubmissions = getMockSubmissionsByStatus('archived');

// Get all draft submissions
const draftSubmissions = getMockSubmissionsByStatus('draft');
```

### Get Mock Submissions by Research Type

```typescript
import { getMockSubmissionsByResearchType } from '@/lib/mock/mockDataLoader';

const socialResearch = getMockSubmissionsByResearchType('SR');
const publicHealthResearch = getMockSubmissionsByResearchType('PR');
const healthOperations = getMockSubmissionsByResearchType('HO');
const biomedicalStudies = getMockSubmissionsByResearchType('BS');
const exemption = getMockSubmissionsByResearchType('EX');
```

### Get Mock Submissions by Decision Type

```typescript
import { getMockSubmissionsByDecision } from '@/lib/mock/mockDataLoader';

const approved = getMockSubmissionsByDecision('approved');
const minorRevisions = getMockSubmissionsByDecision('approved_minor_revisions');
const majorRevisions = getMockSubmissionsByDecision('major_revisions_deferred');
const disapproved = getMockSubmissionsByDecision('disapproved');
const deferred = getMockSubmissionsByDecision('deferred');
```

## Scenarios Covered

### 1. Pending Submissions
- Basic pending submission
- Pending with documents
- Pending with document requests

### 2. Accepted Submissions
- Accepted without reviewers
- Accepted with documents
- Accepted with reviewers (pending, in progress, completed, returned)

### 3. Decisions
- Approved (standard)
- Approved (exemption)
- Minor revisions
- Major revisions
- Disapproved
- Deferred
- Full board approved

### 4. Archived Protocols
- Completed studies
- Terminated studies

### 5. Draft Submissions
- In-progress drafts

### 6. Study Levels
- Undergraduate Thesis
- Master's Thesis
- Doctoral Dissertation
- Faculty/Staff Research
- Funded Research

### 7. Research Types
- Social/Behavioral Research (SR)
- Public Health Research (PR)
- Health Operations (HO)
- Biomedical Studies (BS)
- Exemption (EX)

## Important Notes

⚠️ **This is mock data for testing only. Do not use in production.**

- All IDs are prefixed with `MOCK-` to easily identify them
- Timestamps are relative (e.g., "5 days ago")
- User IDs are mock values (`mock-user-uid-123`)
- Documents are simplified representations

## Integration Example

To temporarily use mock data in your dashboard:

```typescript
import { getAllFormattedMockSubmissions } from '@/lib/mock/mockDataLoader';

// In your component
const [useMockData, setUseMockData] = useState(false);
const mockSubmissions = useMockData ? getAllFormattedMockSubmissions() : [];

// Toggle between real and mock data
<Button onClick={() => setUseMockData(!useMockData)}>
  {useMockData ? 'Use Real Data' : 'Use Mock Data'}
</Button>
```

## Testing Checklist

Use this mock data to verify:

- [ ] All status badges display correctly
- [ ] All decision cards show proper information
- [ ] Reviewer assignments display correctly
- [ ] Document statuses are handled properly
- [ ] Timeline displays are accurate
- [ ] Filtering and searching works
- [ ] All study levels render correctly
- [ ] All research types render correctly
- [ ] All decision types render correctly
- [ ] Mobile responsive layouts work
- [ ] Empty states are handled
- [ ] Loading states work
- [ ] Error states are handled

