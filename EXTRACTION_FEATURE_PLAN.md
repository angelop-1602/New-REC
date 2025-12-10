# Data Extraction Feature - Implementation Plan

## Overview
Add a "Extraction" navigation item in the chairperson sidebar that allows admins to extract protocol data in various formats (CSV, Excel, PDF) with customizable filters and field selection.

## 1. Navigation & Route Structure

### 1.1 Sidebar Navigation
- **Location**: Add to "General" category in `app-sidebar.tsx`
- **Icon**: `Download` or `FileDown` from lucide-react
- **Route**: `/rec/chairperson/extraction`
- **Position**: After "Analytics", before "Messages"

### 1.2 Page Structure
- **File**: `src/app/rec/chairperson/extraction/page.tsx`
- **Layout**: Similar to analytics page with filters and export controls

## 2. Data Extraction Features

### 2.1 Extractable Data Fields

#### Protocol Basic Information
- Protocol ID
- SPUP REC Protocol Code
- Temporary Protocol Code
- Protocol Title
- Status (pending, accepted, approved, archived, rejected)
- Submission Date
- Approval Date
- Decision Date
- OR Number (newly added field)

#### Principal Investigator Information
- PI Name
- PI Email
- PI Contact Number
- PI Address
- PI Position & Institution
- PI Course/Program

#### Research Details
- Study Level (Undergraduate, Master's, Doctoral, etc.)
- Study Type (Social/Behavioral, Public Health, etc.)
- Study Site Location
- Duration Start Date
- Duration End Date
- Number of Participants
- Brief Description

#### Funding Information
- Funding Source
- Pharmaceutical Company (if applicable)
- Other Funding Details

#### Administrative Data
- Assigned Reviewers (count and names)
- Completed Reviews (count)
- Pending Reviews (count)
- Documents Status
- Review Type
- Priority Level
- Chairperson Notes

#### Financial/Administrative
- OR Number
- Payment Status (if applicable)

### 2.2 Filter Options
- **Date Range**: Start date and end date for submission/approval
- **Status**: Filter by protocol status (pending, accepted, approved, archived, rejected)
- **Research Type**: Filter by study type (SR, PR, HO, BS, EX)
- **Study Level**: Filter by level (Undergraduate, Master's, Doctoral, etc.)
- **Review Status**: Filter by review completion status
- **Has OR Number**: Filter protocols with/without OR Number

### 2.3 Export Formats

#### CSV Export
- Standard CSV format
- UTF-8 encoding
- Comma-separated values
- Headers in first row
- Date format: YYYY-MM-DD

#### Excel Export (.xlsx)
- Multiple sheets support:
  - Sheet 1: Protocol Summary
  - Sheet 2: Principal Investigators
  - Sheet 3: Reviewers & Assignments
  - Sheet 4: Documents Status
- Formatted headers
- Auto-width columns
- Date formatting

#### PDF Export
- Formatted report with:
  - Header with SPUP REC logo
  - Summary statistics
  - Detailed protocol list
  - Footer with generation date
- Page breaks for large datasets
- Table formatting

## 3. Implementation Components

### 3.1 Main Extraction Page
**File**: `src/app/rec/chairperson/extraction/page.tsx`

**Features**:
- Filter panel (date range, status, research type, etc.)
- Field selection checkboxes (choose which columns to export)
- Export format selection (CSV, Excel, PDF)
- Preview table (shows filtered data before export)
- Export button with loading state
- Statistics summary (total protocols, by status, etc.)

### 3.2 Extraction Service
**File**: `src/lib/services/extraction/dataExtractionService.ts`

**Functions**:
```typescript
- fetchProtocolsForExtraction(filters: ExtractionFilters): Promise<ProtocolData[]>
- exportToCSV(data: ProtocolData[], fields: string[]): Blob
- exportToExcel(data: ProtocolData[], fields: string[]): Blob
- exportToPDF(data: ProtocolData[], fields: string[]): Blob
- getExtractionStatistics(filters: ExtractionFilters): Promise<ExtractionStats>
```

### 3.3 Extraction Types
**File**: `src/types/extraction.types.ts`

**Interfaces**:
```typescript
- ExtractionFilters
- ExtractionField
- ProtocolData (flattened for export)
- ExtractionStats
```

### 3.4 UI Components

#### Filter Panel Component
**File**: `src/components/rec/chairperson/extraction/extraction-filters.tsx`
- Date range picker
- Status multi-select
- Research type checkboxes
- Study level dropdown
- Clear filters button

#### Field Selector Component
**File**: `src/components/rec/chairperson/extraction/field-selector.tsx`
- Grouped checkboxes by category
- Select all/none per category
- Search field names
- Preview selected fields

#### Export Preview Component
**File**: `src/components/rec/chairperson/extraction/export-preview.tsx`
- Table showing filtered data
- Pagination for large datasets
- Column sorting
- Row count display

#### Export Controls Component
**File**: `src/components/rec/chairperson/extraction/export-controls.tsx`
- Format selection (CSV, Excel, PDF)
- Export button
- Loading state
- Success/error notifications

## 4. Technical Implementation Details

### 4.1 Data Fetching
- Use existing `fetchSubmissionsData` from analytics service
- Apply filters before fetching
- Batch processing for large datasets
- Progress indicator for long operations

### 4.2 CSV Export
- Use native JavaScript (no external library needed)
- Handle special characters and commas
- Quote fields containing commas

### 4.3 Excel Export
- Use `xlsx` library (SheetJS)
- Create workbook with multiple sheets
- Format headers and dates
- Auto-size columns

### 4.4 PDF Export
- Use `jspdf` and `jspdf-autotable` libraries
- Generate formatted tables
- Add headers/footers
- Handle page breaks

### 4.5 Performance Considerations
- Lazy load preview data (pagination)
- Debounce filter changes
- Cache filtered results
- Show progress for large exports
- Stream large CSV exports

## 5. File Structure

```
src/
├── app/
│   └── rec/
│       └── chairperson/
│           └── extraction/
│               └── page.tsx
├── components/
│   └── rec/
│       └── chairperson/
│           └── extraction/
│               ├── extraction-filters.tsx
│               ├── field-selector.tsx
│               ├── export-preview.tsx
│               ├── export-controls.tsx
│               └── extraction-stats.tsx
├── lib/
│   └── services/
│       └── extraction/
│           ├── dataExtractionService.ts
│           ├── csvExporter.ts
│           ├── excelExporter.ts
│           └── pdfExporter.ts
└── types/
    └── extraction.types.ts
```

## 6. User Experience Flow

1. **Navigate to Extraction**: Click "Extraction" in sidebar
2. **Set Filters**: Select date range, status, research type, etc.
3. **Select Fields**: Choose which columns to include in export
4. **Preview Data**: Review filtered data in preview table
5. **Choose Format**: Select CSV, Excel, or PDF
6. **Export**: Click export button, file downloads automatically
7. **Success**: Toast notification confirms export completion

## 7. Security & Permissions

- Only chairperson role can access extraction page
- Use existing `useChairpersonPermission` hook
- Validate filters server-side (if API route added later)
- Rate limiting for exports (prevent abuse)

## 8. Future Enhancements

- Scheduled exports (email reports)
- Export templates (predefined field sets)
- Export history (track previous exports)
- Custom field mappings
- API endpoint for programmatic access
- Export to Google Sheets
- Email export results

## 9. Dependencies to Add

```json
{
  "xlsx": "^0.18.5",           // Excel export
  "jspdf": "^2.5.1",           // PDF export
  "jspdf-autotable": "^3.5.31" // PDF tables
}
```

## 10. Implementation Phases

### Phase 1: Basic Structure
- Add sidebar navigation
- Create extraction page with basic layout
- Implement filter panel
- Add data fetching

### Phase 2: Export Functionality
- Implement CSV export
- Implement Excel export
- Implement PDF export
- Add field selection

### Phase 3: Polish & Optimization
- Add preview table
- Improve UI/UX
- Add statistics
- Performance optimization

### Phase 4: Advanced Features
- Export templates
- Export history
- Scheduled exports (if needed)

