# Submission Collections Structure

## 📋 Overview
This document outlines the Firebase Firestore collections structure for managing research protocol submissions across different stages of the review process.

## 🗂️ Collections Structure

### **1. Pending Collection** (`submissions_pending`)
**Purpose**: Store newly submitted protocols that haven't been assigned a SPUP REC Code yet.

**Status**: `pending`  
**Trigger**: When proponent completes and submits their application  
**Duration**: Until REC Chair assigns SPUP Code  

**Document Structure**:
```typescript
interface PendingSubmission {
  applicationID: string;           // Auto-generated Firebase ID
  tempProtocolCode: string;        // Temporary code (SPUPREC-YYYYMMDD-XXXXXX)
  title: string;                   // Protocol title
  submitBy: string;                // Proponent user ID
  createdAt: Timestamp;            // Submission timestamp
  updatedAt: Timestamp;            // Last modification
  status: "pending";               // Fixed status
  information: InformationType;    // Complete form data
  documents: DocumentsType[];      // Uploaded documents
  priority?: "high" | "normal";    // Optional priority flag
}
```

**Chair Actions**:
- Review submission completeness
- Assign SPUP REC Code
- Move to `accepted` collection
- Set review type (SR/Ex)

---

### **2. Accepted Collection** (`submissions_accepted`)
**Purpose**: Store protocols assigned with SPUP REC Code, ready for review process.

**Status**: `accepted`, `under_review`, `revision_requested`  
**Trigger**: When REC Chair assigns SPUP Code  
**Duration**: Until final approval/rejection decision  

**Document Structure**:
```typescript
interface AcceptedSubmission {
  applicationID: string;           // Same ID from pending
  spupRecCode: string;            // SPUP_YYYY_NNNNN_SR/Ex_II (assigned by chair)
  reviewType: "SR" | "Ex";        // Standard Review or Expedited
  title: string;
  submitBy: string;
  assignedAt: Timestamp;          // When moved to accepted
  reviewStarted?: Timestamp;      // When review officially began
  createdAt: Timestamp;           // Original submission
  updatedAt: Timestamp;
  status: "accepted" | "under_review" | "revision_requested";
  information: InformationType;
  documents: DocumentsType[];
  assignedReviewers?: string[];   // Reviewer user IDs
  chairNotes?: string;           // REC Chair notes
  estimatedCompletionDate?: Timestamp;
}
```

**Available Actions**:
- Assign reviewers
- Start review process
- Request revisions
- Approve/Reject decision
- Communication with proponent

---

### **3. Approved Collection** (`submissions_approved`)
**Purpose**: Store approved protocols during active research phase.

**Status**: `approved`, `in_progress`, `awaiting_progress_report`, `awaiting_final_report`  
**Trigger**: When protocol receives final approval  
**Duration**: Until final report is submitted and accepted  

**Document Structure**:
```typescript
interface ApprovedSubmission {
  applicationID: string;
  spupRecCode: string;
  title: string;
  submitBy: string;
  approvedAt: Timestamp;          // Approval date
  approvalValidUntil: Timestamp;  // Research end date
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: "approved" | "in_progress" | "awaiting_progress_report" | "awaiting_final_report";
  information: InformationType;
  documents: DocumentsType[];
  approvalDocuments: DocumentsType[]; // Certificates, approval letters
  progressReports?: ProgressReport[]; // Progress reports submitted
  finalReport?: FinalReport;          // Final report
  renewalRequests?: RenewalRequest[]; // If study needs extension
}
```

**Proponent Actions**:
- Submit progress reports
- Submit final report
- Request protocol amendments
- Request study extensions

---

### **4. Archived Collection** (`submissions_archived`)
**Purpose**: Store completed research protocols for record-keeping.

**Status**: `completed`, `terminated`, `expired`  
**Trigger**: When final report is approved or study is terminated  
**Duration**: Permanent record keeping  

**Document Structure**:
```typescript
interface ArchivedSubmission {
  applicationID: string;
  spupRecCode: string;
  title: string;
  submitBy: string;
  approvedAt: Timestamp;
  completedAt: Timestamp;         // When moved to archive
  createdAt: Timestamp;           // Original submission
  status: "completed" | "terminated" | "expired";
  information: InformationType;
  documents: DocumentsType[];
  approvalDocuments: DocumentsType[];
  progressReports: ProgressReport[];
  finalReport: FinalReport;
  archiveReason: "completed" | "terminated_by_researcher" | "terminated_by_rec" | "expired";
  finalNotes?: string;           // Final REC notes
}
```

**Available Actions**:
- View only (read-only)
- Generate completion certificates
- Export for institutional records

---

## 🔄 Collection Movement Flow

```
[Proponent Submission] 
        ↓
[submissions_pending] 
        ↓ (Chair assigns SPUP Code)
[submissions_accepted] 
        ↓ (Approval decision)
[submissions_approved] 
        ↓ (Final report approved)
[submissions_archived]
```

## 🔐 Access Permissions

### **Proponent Access**:
- **Pending**: Read-only (view submission status)
- **Accepted**: Read + limited write (respond to revision requests)
- **Approved**: Read + write (submit reports)
- **Archived**: Read-only

### **REC Chair Access**:
- **All collections**: Full read/write access
- **Special actions**: Move between collections, assign codes

### **Reviewer Access**:
- **Accepted**: Read + write (review forms, comments)
- **Others**: No access (unless specifically granted)

## 📊 Reporting & Analytics

Each collection enables specific reporting:
- **Pending**: Submission queue, processing times
- **Accepted**: Review workload, reviewer assignments
- **Approved**: Active research tracking, report compliance
- **Archived**: Institutional research statistics, completion rates

## 🔍 Search & Indexing

**Recommended Firestore indexes**:
```
submissions_pending: [status, createdAt]
submissions_accepted: [status, assignedReviewers, reviewType]
submissions_approved: [status, approvalValidUntil, submitBy]
submissions_archived: [completedAt, archiveReason]
```

## 📅 Future Considerations

- **Data retention policies** for archived submissions
- **Migration scripts** for moving data between collections
- **Backup strategies** for each collection
- **Performance optimization** as collections grow
- **Audit trails** for tracking collection movements 