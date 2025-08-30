# Protocol Decision Workflow

## Overview

The protocol review process has been restructured to separate **acceptance** from **decision-making**. This provides better control and clarity in the review workflow.

## 🔄 **New Workflow Process**

### **Stage 1: Submission** (`submissions_pending`)
```
Status: "pending"
Code: PENDING-YYYYMMDD-XXXXXX (Temporary)
Actions: Proponent submits → Waits for REC Chair review
```

### **Stage 2: Acceptance** (`submissions_accepted`) 
```
Status: "accepted" 
Code: SPUP_YYYY_00000_SR/EX_XX (Official)
Actions: Chair assigns SPUP code → Protocol ready for review
```

### **Stage 3: Decision** (`submissions_accepted` with decision)
```
Status: "accepted" + decision field
Code: Same SPUP code
Actions: Chair makes final decision after review
```

### **Stage 4: Final Status** (Various collections)
```
Approved → submissions_approved
Minor/Major Revisions → stays in submissions_accepted  
Disapproved → stays in submissions_accepted
```

## 🎯 **SPUP Code Implementation**

### **Format**: `SPUP_YYYY_00000_SR/EX_XX`

**Example**: `SPUP_2025_00437_SR_KS` for Kenneth Suilen

**Components**:
- `SPUP`: Fixed prefix
- `2025`: Current year
- `00437`: Sequential number (total accepted protocols + 1)
- `SR`: Review type (SR = Standard Review, EX = Expedited)
- `KS`: Principal Investigator initials (Kenneth Suilen)

### **Generation Logic**:
```typescript
const generateSpupCode = async (pi, reviewType) => {
  const year = new Date().getFullYear();
  const count = await getAcceptedProtocolsCount(year); // Counts all with SPUP codes
  const nextNumber = count + 1;
  const initials = extractInitials(pi.name); // First + Last name initials
  
  return `SPUP_${year}_${nextNumber.toString().padStart(5, '0')}_${reviewType}_${initials}`;
};
```

## 📋 **Decision Types & Actions**

### **1. Approved** ✅
- **Description**: The research may proceed as submitted
- **Action**: Move to `submissions_approved` collection
- **Status**: Changes to "approved"
- **Notification**: "Your protocol has been APPROVED!"

### **2. Approved with Minor Revisions** 🔄
- **Description**: Approval granted with minor revisions required
- **Action**: Stay in `submissions_accepted` with decision
- **Status**: Remains "accepted" 
- **Required**: Timeline for compliance
- **Notification**: "Approved with Minor Revisions. Timeline: [X]"

### **3. Major Revisions / Deferred** ⚠️
- **Description**: Significant ethical issues require major revision
- **Action**: Stay in `submissions_accepted` with decision
- **Status**: Remains "accepted"
- **Required**: Timeline for resubmission
- **Notification**: "Major Revisions Required. Timeline: [X]"

### **4. Disapproved** ❌
- **Description**: Unresolvable ethical concerns, high risk
- **Action**: Stay in `submissions_accepted` with decision
- **Status**: Remains "accepted" 
- **Notification**: "Protocol Disapproved. Reason: [X]"

## 🏗️ **UI Components**

### **Chairperson Actions Card**
```typescript
// Buttons shown based on status:
if (status === "pending") {
  - Accept Protocol (assigns SPUP code)
  - Reject Protocol
}

if (status === "accepted" && !decision) {
  - Make Decision (4 options)
  - Assign Reviewer
  - Upload Documents
}

if (status === "accepted" && decision) {
  - View Decision Details
  - Upload Additional Documents
}
```

### **Accept Protocol Dialog**
- **Protocol Information**: ID, title, PI, temp code
- **Review Type Selection**: Standard Review (SR) or Expedited (EX)
- **SPUP Code Generation**: Auto-generated based on PI name and count
- **Manual Override**: Chair can edit the generated code
- **Format Validation**: Ensures proper SPUP code format

### **Decision Dialog**
- **4 Decision Options**: Radio buttons with descriptions
- **Decision Details**: Required text area for explanation
- **Timeline Field**: Required for revision decisions
- **Document Upload**: Optional supporting documents
- **Color-coded Buttons**: Green (approved), Blue (minor), Yellow (major), Red (disapproved)

### **Banner Display**
```typescript
// For pending protocols:
PENDING-20250120-123456 (Temp)

// For accepted protocols:
SPUP_2025_00437_SR_KS

// Tooltip shows appropriate message
```

## 🔄 **Database Structure**

### **Pending Submission**:
```javascript
submissions_pending/REC_2025_ABC123 {
  applicationID: "REC_2025_ABC123",
  tempProtocolCode: "PENDING-20250120-123456",
  status: "pending",
  information: {...},
  // No spupCode yet
}
```

### **Accepted Submission**:
```javascript
submissions_accepted/REC_2025_ABC123 {
  applicationID: "REC_2025_ABC123", 
  spupCode: "SPUP_2025_00437_SR_KS",
  tempProtocolCode: null, // Cleared
  status: "accepted",
  acceptedBy: "chair_user_id",
  acceptedAt: Timestamp,
  information: {...},
  // No decision fields yet
}
```

### **Decided Submission**:
```javascript
submissions_accepted/REC_2025_ABC123 {
  // ... same as accepted
  decision: "approved_minor_revisions",
  decisionDetails: "Please clarify the consent process...",
  decisionDate: Timestamp,
  decisionBy: "chair_user_id",
  timeline: "30 days",
}
```

### **Approved Submission**:
```javascript
submissions_approved/REC_2025_ABC123 {
  // ... moved from accepted
  status: "approved",
  approvedAt: Timestamp,
  decision: "approved",
  // ... all other fields preserved
}
```

## 🎨 **User Experience**

### **For Proponents**:
1. **Submit Protocol** → Gets temporary code (`PENDING-...`)
2. **Wait for Acceptance** → Notification when SPUP code assigned
3. **Wait for Decision** → Decision section only appears after decision made
4. **View Decision** → See decision details, timeline, uploaded documents

### **For Chairperson**:
1. **Review Submission** → See temporary code in banner
2. **Accept Protocol** → Dialog with auto-generated SPUP code
3. **Assign Reviewer** → Optional step after acceptance
4. **Make Decision** → Comprehensive dialog with 4 options
5. **Upload Documents** → Supporting decision documents

## 🔐 **Security & Validation**

### **SPUP Code Validation**:
- **Format Check**: Regex validation for proper format
- **Uniqueness**: Checks existing codes to prevent duplicates
- **Sequential**: Automatic numbering based on year and count
- **Manual Override**: Chair can modify if needed

### **Decision Validation**:
- **Required Fields**: Decision details always required
- **Timeline**: Required for revision decisions
- **Authentication**: User must be logged in
- **Permissions**: Only chairperson can make decisions

## 📊 **Status Tracking**

### **Banner Status Display**:
```
pending → "Under Review" (Yellow)
accepted → "Under Review" (Blue) 
approved → "Approved" (Green)
archived → "Archived" (Gray)
```

### **Decision Status Display**:
```
No Decision → Decision section hidden
Has Decision → Decision details shown
```

## 🚀 **Benefits**

1. **Clear Separation**: Acceptance ≠ Decision
2. **SPUP Code Control**: Chair assigns official codes
3. **Flexible Decisions**: 4 comprehensive decision types
4. **Document Support**: Upload decision documents
5. **Timeline Management**: Required timelines for revisions
6. **Audit Trail**: Complete history of acceptance and decisions
7. **User Clarity**: Clear status progression for proponents

The system now provides a professional, comprehensive protocol review workflow that matches academic standards and provides clear accountability at each stage.
