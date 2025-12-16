# Extraction Reports Feature - Implementation Plan

## Overview
Transform the extraction page to focus on monthly and yearly REC reports with specific columns matching the REC reporting format. Remove statistics cards and implement report-specific data extraction.

## 1. UI Changes

### 1.1 Remove Statistics Cards
- **Remove**: The 4 statistics cards (Total Protocols, With OR Number, Approved, Pending)
- **Reason**: User only needs total count of protocols for the selected period

### 1.2 Add Report Type Selector
- **Location**: Top of the page, below header
- **Options**: 
  - Monthly Report
  - Yearly Report
- **Default**: Monthly Report (current month)
- **Design**: Modern toggle or select dropdown (no cards)

### 1.3 Add Period Selector
- **For Monthly Reports**:
  - Month selector (dropdown)
  - Year selector (dropdown)
  - Default: Current month/year
- **For Yearly Reports**:
  - Year selector (dropdown)
  - Default: Current year

### 1.4 Export Buttons in Filter Section
- **Location**: Inside the filter panel (not separate section)
- **Design**: Simple buttons with icon and text
- **Buttons**: 
  - CSV Export (FileText icon + "CSV")
  - Excel Export (FileSpreadsheet icon + "Excel")
  - PDF Export (FileDown icon + "PDF")
- **Layout**: Horizontal row of buttons, compact design
- **Show total protocol count** in filter section as well

## 2. Report Data Structure

### 2.1 Required Columns (Fixed for All Reports)

| Column Name | Data Source | Mapping/Transformation |
|------------|-------------|------------------------|
| Protocol Code | `spupCode` | Direct mapping |
| Protocol Title | `title` or `information.general_information.protocol_title` | Direct mapping |
| Names of Researcher(s)/Investigator(s) | `information.general_information.principal_investigator.name` + co-researchers | Combine PI name with co-researchers (comma-separated) |
| Funding | `information.source_of_funding.selected` | Map to codes: R, I, A, D, O |
| Research Type | `information.nature_and_type_of_study.type` | Map to full names |
| Date Received | `createdAt` or `submittedAt` | Format as MM/DD/YYYY |
| Review Type | `typeOfReview` or `reviewType` | Map to FR, ER, EX |
| Date of Meeting where Protocol is First Discussed | `meetingReference` or `decision.meetingReference` | Extract date from meeting reference (if full review). **Leave blank if not full board review** |
| Name of Primary Reviewer | First assigned reviewer from `assignedReviewers` | Get reviewer name from reviewers collection. **Format: Shorten to "J. Fermin" format (e.g., "Dr. Janette Fermin" → "J. Fermin")** |
| Decision | `decision` field | Map to A, MN, MJ, D |
| Date of First Decision Letter to the PI / Researcher | `decisionDate` | Format as MM/DD/YYYY |
| Status | `status` field | Map to OR, A, C, T, W |

### 2.2 Data Mappings

#### Funding Source Mapping
```
self_funded → R (Researcher-funded)
institution_funded → I (Institution-funded)
government_funded → A (Agency other than institution)
scholarship → A (Agency other than institution)
research_grant → A (Agency other than institution)
pharmaceutical_company → D (Pharmaceutical companies)
others → O (Others)
```

#### Research Type Mapping
```
Social/Behavioral → Social Research
Public Health Research → Public Health Research
Health Operations → Health Operations Research
Biomedical Studies → Biomedical studies
Clinical Trials → Clinical Trials
Others → (keep as is or map appropriately)
```

#### Review Type Mapping
```
full → FR (Full Review)
full board → FR (Full Review)
expedited → ER (Expedited Review)
exempted → EX (Exempt from Review)
exempt → EX (Exempt from Review)
```

#### Decision Mapping
```
approved → A (Approved)
approved_minor_revisions → MN (Minor modification)
major_revisions_deferred → MJ (Major modification)
disapproved → D (Disapproved)
deferred → (handle appropriately - might be pending decision)
```

#### Status Mapping
```
pending → OR (On-going review)
accepted → OR (On-going review)
approved → A (Approved and on-going)
archived → C (Completed) or T (Terminated) - need to determine based on context
disapproved → (might be T - Terminated or W - Withdrawn)
```

## 3. Data Transformation Service

### 3.1 New Service File
**File**: `src/lib/services/extraction/reportDataService.ts`

**Functions**:
```typescript
// Transform protocol to report format
transformProtocolToReportData(protocol: ChairpersonProtocol, primaryReviewerName?: string): ReportData

// Map funding source to code
mapFundingSource(funding: string): 'R' | 'I' | 'A' | 'D' | 'O'

// Map research type to full name
mapResearchType(type: string): string

// Map review type to code
mapReviewType(type: string): 'FR' | 'ER' | 'EX'

// Map decision to code
mapDecision(decision: string): 'A' | 'MN' | 'MJ' | 'D' | ''

// Map status to code
mapStatus(status: string): 'OR' | 'A' | 'C' | 'T' | 'W'

// Extract meeting date from meeting reference (only for full board reviews)
// Returns null/empty if not full board review
extractMeetingDate(meetingReference: string | null | undefined, reviewType: string): string | null

// Get primary reviewer name (shortened format)
getPrimaryReviewerName(protocol: ChairpersonProtocol): Promise<string | null>

// Shorten reviewer name format (e.g., "Dr. Janette Fermin" → "J. Fermin")
// Handles: "Dr. Janette Fermin" → "J. Fermin"
//          "Prof. John Smith" → "J. Smith"
//          "Maria Santos" → "M. Santos"
shortenReviewerName(fullName: string): string
```

### 3.2 Report Data Interface
**File**: `src/types/extraction.types.ts` (add to existing file)

```typescript
export interface ReportData {
  protocolCode: string;
  protocolTitle: string;
  researcherNames: string;
  funding: 'R' | 'I' | 'A' | 'D' | 'O';
  researchType: string;
  dateReceived: string;
  reviewType: 'FR' | 'ER' | 'EX';
  meetingDate: string | null;
  primaryReviewerName: string | null;
  decision: 'A' | 'MN' | 'MJ' | 'D' | '';
  decisionDate: string | null;
  status: 'OR' | 'A' | 'C' | 'T' | 'W';
}
```

## 4. Filtering Logic

### 4.1 Monthly Report Filter
- Filter protocols by `createdAt` or `submittedAt` within the selected month
- Include all protocols submitted/received in that month regardless of current status

### 4.2 Yearly Report Filter
- Filter protocols by `createdAt` or `submittedAt` within the selected year
- Include all protocols submitted/received in that year regardless of current status

### 4.3 Date Range Implementation
```typescript
// Monthly filter
const startDate = new Date(year, month - 1, 1);
const endDate = new Date(year, month, 0, 23, 59, 59, 999);

// Yearly filter
const startDate = new Date(year, 0, 1);
const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
```

## 5. Export Format

### 5.1 CSV Export
- Fixed columns in exact order as specified
- Headers match column names exactly
- UTF-8 encoding with BOM

### 5.2 Excel Export
- Single sheet with all data
- Headers in first row (bold, colored)
- Auto-width columns
- Date formatting (MM/DD/YYYY)
- Freeze first row

### 5.3 PDF Export
- Header: "SPUP REC [Monthly/Yearly] Report - [Month Year] or [Year]"
- Table with all columns
- Footer: "Generated on [Date]"
- Page breaks for large datasets
- Landscape orientation (to fit all columns)

## 6. UI Components

### 6.1 Report Type Selector
- Toggle or Select component
- Options: "Monthly Report", "Yearly Report"
- Modern design (no cards)

### 6.2 Period Selector
- Month/Year picker for monthly reports
- Year picker for yearly reports
- Default to current period

### 6.3 Summary Display
- Show total protocols count for selected period
- Simple text display (no card)

### 6.4 Export Buttons (In Filter Section)
- Simple button design with icon + text
- CSV: FileText icon + "CSV"
- Excel: FileSpreadsheet icon + "Excel"  
- PDF: FileDown icon + "PDF"
- Show loading states
- Disable when no data
- Compact horizontal layout within filter panel

### 6.5 Preview Table
- **Keep current preview table design** (user likes it)
- Show first 10-20 protocols
- All columns visible
- Scrollable horizontally if needed
- Modern table design

## 7. Implementation Steps

### Phase 1: Data Transformation
1. Create `reportDataService.ts` with mapping functions
2. Add `ReportData` interface to types
3. Implement all mapping functions
4. Test data transformation with sample protocols

### Phase 2: Filtering
1. Update `dataExtractionService.ts` to support monthly/yearly filters
2. Add date range calculation functions
3. Test filtering logic

### Phase 3: UI Updates
1. Remove statistics cards
2. Add report type selector
3. Add period selector
4. Update export section
5. Update preview table

### Phase 4: Export Functions
1. Update export service to use `ReportData` format
2. Ensure fixed column order
3. Test all export formats

### Phase 5: Testing & Refinement
1. Test with real data
2. Verify all mappings are correct
3. Test edge cases (missing data, null values)
4. Polish UI/UX

## 8. Edge Cases to Handle

1. **Missing Data**:
   - Protocol without SPUP code → Use temp code or "N/A"
   - No reviewers assigned → "N/A" for primary reviewer
   - No decision made → Empty for decision fields
   - No meeting date → Empty for meeting date

2. **Date Handling**:
   - Invalid dates → "N/A"
   - Missing dates → Empty string
   - Format consistently as MM/DD/YYYY
   - **Meeting Date**: Only show if review type is "full" or "full board", otherwise leave blank

3. **Multiple Researchers**:
   - Combine PI name with co-researchers
   - Format: "PI Name, Co-Researcher 1, Co-Researcher 2"
   - Handle missing co-researchers

4. **Reviewer Name Lookup**:
   - Fetch reviewer name from reviewers collection
   - Handle deleted/inactive reviewers
   - Cache reviewer names for performance
   - **Shorten format**: "Dr. Janette Fermin" → "J. Fermin"
   - Handle titles (Dr., Prof., etc.) - remove them
   - Extract first initial + last name
   - Handle edge cases (single name, multiple last names, etc.)

5. **Status Mapping**:
   - Handle ambiguous statuses
   - Determine if archived = completed or terminated
   - Handle disapproved protocols (terminated vs withdrawn)

## 9. File Structure

```
src/
├── app/
│   └── rec/
│       └── chairperson/
│           └── extraction/
│               └── page.tsx (updated)
├── lib/
│   └── services/
│       └── extraction/
│           ├── dataExtractionService.ts (updated)
│           ├── exportService.ts (updated)
│           └── reportDataService.ts (new)
└── types/
    └── extraction.types.ts (updated)
```

## 10. Success Criteria

- ✅ Statistics cards removed
- ✅ Monthly and yearly report options available
- ✅ Period selector works correctly
- ✅ All columns match REC format exactly
- ✅ All mappings are correct (funding, research type, review type, decision, status)
- ✅ Export functions work for CSV, Excel, PDF
- ✅ Preview table shows correct data
- ✅ Total protocol count displays correctly
- ✅ Modern UI without cards
- ✅ Handles edge cases gracefully

