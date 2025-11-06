# Document Request Integration for Protocol Acceptance

**Date:** January 27, 2025  
**Status:** ✅ Completed

## Overview

Integrated the document request system into the chairperson protocol review workflow to ensure protocols are complete and ready for reviewer assignment before acceptance.

## Problem

Previously, the chairperson could accept a protocol without ensuring all necessary documents were submitted. This could lead to incomplete protocols being assigned to reviewers, causing delays and inefficiencies in the review process.

## Solution

### 1. **Document Request Button**
Added a "Request Documents" button to the top right of the Documents card that allows the chairperson to:
- Request missing required documents
- Request additional documents needed for proper review
- Use pre-defined templates for common document types
- Create custom document requests with title and description

### 2. **Enhanced Validation Logic**
Updated the "Accept Protocol" button to check for:
- ✅ All submitted documents are accepted (status = "accepted")
- ✅ No pending document requests (status = "requested")
- ✅ At least one document has been submitted

### 3. **Visual Status Indicators**
Enhanced the document status card to show:
- **Document Count Badge**: Shows "X / Y Accepted" for submitted documents
- **Pending Request Badge**: Shows "X Pending Request(s)" in amber color
- **Clear Messaging**: Explains what needs to be done before protocol acceptance
- **Tooltip Feedback**: Provides specific reasons when accept button is disabled

### 4. **Automatic Updates**
Implemented automatic reload of documents and requests after:
- Creating new document requests
- Document status changes
- Any modifications to the protocol's document collection

## Technical Implementation

### Files Modified

#### 1. `src/components/rec/shared/dialogs/document-request-dialog.tsx`
**Changes:**
- Updated `getMissingRequiredDocuments()` to filter by document title instead of ID
- Now properly excludes documents that are already submitted
- Uses case-insensitive and trimmed title comparison for accurate matching
- Prevents duplicate document requests for already submitted documents

**Key Fix:**
```typescript
const getMissingRequiredDocuments = () => {
  // Compare by document title (case-insensitive and trimmed)
  const submittedDocTitles = existingDocuments.map(doc => 
    doc.title.toLowerCase().trim()
  );
  
  return REQUIRED_DOCUMENTS.filter(reqDoc => 
    !submittedDocTitles.includes(reqDoc.title.toLowerCase().trim())
  );
};
```

#### 2. `src/components/rec/shared/protocol-overview.tsx`
**Changes:**
- Added "Request Documents" button to Documents card header (top right)
- Button only visible for chairperson user type
- Imported `DocumentRequestDialog` and `enhancedDocumentManagementService`
- Added `handleRequestCreated` callback to reload documents after request creation
- Added `refreshKey` state to trigger document reload
- Integrated document request functionality directly into the document viewing interface

**Key Code Addition:**
```typescript
{userType === "chairperson" && (
  <DocumentRequestDialog
    protocolId={submissionId}
    existingDocuments={documents}
    onRequestCreated={handleRequestCreated}
    trigger={
      <Button variant="outline" size="sm">
        <FileText className="mr-2 h-4 w-4" />
        Request Documents
      </Button>
    }
  />
)}
```

#### 3. `src/components/rec/chairperson/components/protocol/chairperson-actions.tsx`
**Changes:**
- Added state management for document requests (`documentRequests`, `pendingRequestsCount`)
- Imported `enhancedDocumentManagementService` for fetching document requests
- Updated document loading logic to also fetch document requests
- Modified validation logic to check for pending requests
- Enhanced status card to display pending request count
- Updated tooltip to show specific pending request count
- Removed "Request Documents" button from actions section (moved to Documents card)

**Key Code Addition:**
```typescript
// Load document requests
const requests = await enhancedDocumentManagementService.getProtocolDocumentRequests(submission.id);
setDocumentRequests(requests);

// Count pending requests (documents with status "requested")
const pending = requests.filter((r: any) => 
  r.currentStatus === 'requested' || r.status === 'requested'
).length;
setPendingRequestsCount(pending);

// Check if all documents are accepted AND no pending requests
const hasDocuments = docs.length > 0;
const allAccepted = docs.every((doc: any) => doc.status === "accepted");
const noPendingRequests = pending === 0;

setAllDocumentsAccepted(hasDocuments && allAccepted && noPendingRequests);
```

#### 4. `src/lib/services/enhancedDocumentManagementService.ts`
**Changes:**
- Updated all collection references from `submissions_accepted` to `submissions`
- Ensured compatibility with unified collection architecture

**Collections Updated:**
```typescript
// Before: doc(db, 'submissions_accepted', protocolId)
// After:  doc(db, 'submissions', protocolId)
```

#### 5. `TASKING.md`
**Changes:**
- Documented the document request integration under "Document Status Management System"
- Added completion checkmarks and detailed feature descriptions

## User Workflow

### Chairperson Flow:
1. Chairperson views a pending protocol
2. Reviews submitted documents in the protocol overview
3. If documents need revision or are missing:
   - Click "Request Documents" button
   - Select from missing required documents or request new ones
   - Set due date and urgency if needed
   - Submit request
4. System shows pending request count in status card
5. "Accept Protocol" button remains disabled until:
   - All submitted documents are accepted
   - All document requests are fulfilled (proponent uploads requested documents)
6. Once complete, chairperson can accept protocol and assign reviewers

### Proponent Flow (Existing):
1. Proponent receives notification of document request
2. Views protocol detail page showing requested documents
3. Uploads requested documents via document management interface
4. System updates document status and removes from pending requests
5. Chairperson can now proceed with acceptance

## Benefits

✅ **Quality Control**: Ensures protocols are complete before reviewer assignment  
✅ **Clear Communication**: Proponents know exactly what documents are needed  
✅ **Workflow Efficiency**: Prevents back-and-forth due to missing documents  
✅ **Visual Feedback**: Chairperson can see at a glance what's pending  
✅ **Prevents Premature Acceptance**: System enforces document completeness  
✅ **Better User Experience**: Clear tooltips and status indicators guide the user

## Testing Checklist

- [x] Document request button appears on pending protocols
- [x] Document request dialog opens and allows selection of documents
- [x] Missing required documents tab filters out already submitted documents
- [x] Document matching works by title (case-insensitive)
- [x] Due date and urgent flags removed for simplified workflow
- [x] Pending request count displays correctly in status card
- [x] Accept button is disabled when pending requests exist
- [x] Tooltip shows specific count of pending requests
- [x] Documents and requests reload after creating new requests
- [x] Validation logic correctly checks both accepted documents and pending requests
- [x] No linter errors in modified files

## Related Components

- `src/components/rec/shared/dialogs/document-request-dialog.tsx` - Existing dialog for requesting documents
- `src/components/rec/shared/protocol-overview.tsx` - Protocol information and document display
- `src/lib/services/documentManagementService.ts` - Core document management operations
- `src/types/documents.types.ts` - Document and request type definitions

## Recent Updates (January 27, 2025)

### Simplified Document Request Flow
- **Removed Due Date Field**: Eliminated optional due date picker to streamline the request process
- **Removed Urgent Flag**: Removed "Mark as urgent" checkbox and related alert messages
- **Cleaner Interface**: Focused on essential fields (title, description) for faster document requests
- **Improved UX**: Fewer fields to fill out means quicker document request creation

### Missing Documents Filter Enhancement
- **Smart Filtering**: Documents already submitted are automatically removed from "Missing Required Documents" list
- **Title-Based Matching**: Uses case-insensitive title comparison instead of ID matching
- **Accurate Lists**: Shows only truly missing documents to prevent duplicate requests

### Document Status Display & Actions
- **Added "Requested" Status Badge**: Blue badge with file icon to distinguish requested documents
- **Status-Based Actions**: Actions change dynamically based on document status
  - **Requested documents**: Show "Awaiting Upload" instead of action buttons
  - **Other statuses** (pending, accepted, revise, rejected): Show full action menu with preview/download
- **Proper Status Checking**: Checks `currentStatus` first, then falls back to `status` field
- **Consistent Display**: All document statuses now display correctly across the system

## Future Enhancements

- Add email notifications when document requests are created
- Show document request details in proponent dashboard
- Add timeline view of document request fulfillment
- Add batch document request capabilities
- Implement automatic reminders for pending requests

---

**Implementation Status:** ✅ Complete  
**Tested:** ✅ Yes  
**Documentation:** ✅ Complete  
**Merged:** ✅ Yes

