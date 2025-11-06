# Template Placeholders & Data Source Mapping

## Overview
This document provides a comprehensive mapping of all template placeholders used in document generation and their corresponding data sources from the Firestore database.

---

## 📋 Complete Template Placeholder Mapping

### 1. Auto-Generated Values

| Template Placeholder | Data Source | Example Value | Description |
|---------------------|-------------|---------------|-------------|
| `<<DATE>>` | Auto-generated (today) | "January 15, 2025" | Current date when document is generated |
| `<<INITIAL_DATE>>` | `submission.assignedAt` OR `submission.approvedAt` | "January 10, 2025" | Date when reviewers were assigned (fallback to approvedAt) |
| `<<INITIAL_REVIEW_DATE>>` | `submission.assignedAt` | "January 10, 2025" | Date when reviewers were assigned to the protocol |
| `<<DURATION_DATE>>` | Calculated from `submission.approvedAt` + 1 year | "January 15, 2025 - January 15, 2026" | 1-year approval duration from approval date |
| `<<APPROVED_DATE>>` | `submission.approvedAt` | "January 15, 2025" | **ACTUAL APPROVAL DATE FROM DATABASE (NOT AUTO-GENERATED!)** |

### 2. Protocol Information (from Firestore submission)

| Template Placeholder | Data Source Path | Fallback Value | Description |
|---------------------|------------------|----------------|-------------|
| `<<SPUP_REC_CODE>>` | `submission.spupCode` OR `submission.tempProtocolCode` | "PENDING" | Official SPUP REC protocol code |
| `<<PROTOCOL_TITLE>>` | `submission.information.general_information.protocol_title` | "Untitled Protocol" | Full title of the research protocol |
| `<<PRINCIPAL_INVESTIGATOR>>` | `submission.information.general_information.principal_investigator.name` | "Unknown" | Full name of the principal investigator |
| `<<INSTITUTION>>` | `submission.information.general_information.principal_investigator.position_institution` | "N/A" | Institution/Organization of the PI |
| `<<ADDRESS>>` | `submission.information.general_information.principal_investigator.address` | "N/A" | Complete address of the PI |
| `<<CONTACT_NUMBER>>` | `submission.information.general_information.principal_investigator.contact_number` | "N/A" | Contact phone number of the PI |
| `<<E_MAIL>>` | `submission.information.general_information.principal_investigator.email` | "N/A" | Email address of the PI |
| `<<ADVISER>>` | `submission.information.general_information.adviser.name` | "N/A" | Full name of the research adviser |
| `<<TYPE_SUBMISSION>>` | `submission.submissionType` | "Initial Review" | Type of submission (Initial/Resubmission) |

### 3. Input / Reviewer-Based Values

| Template Placeholder | Data Source | Example Value | Description |
|---------------------|-------------|---------------|-------------|
| `<<VERSION>>` | Hardcoded | "02" | Document version number |
| `<<Chairperson>>` | Parameter OR `recSettings.chairpersonName` | "REC Chairperson" | Name of the REC Chairperson |
| `<<DECISION>>` | Parameter (decision type) | "approved" | Decision type for the protocol |
| `<<DECISION_DETAILS>>` | `submission.decisionDetails` | "" | Additional details about the decision |
| `<<TIMELINE>>` | Calculated based on decision | "3 days" / "7 days" | Compliance timeline for revisions |
| `<<COMPLIANCE_DEADLINE>>` | Calculated (today + timeline) | "January 18, 2025" | Deadline date for compliance |

### 4. Legacy Fields (Backward Compatibility)

| Template Placeholder | Maps To | Data Source | Description |
|---------------------|---------|-------------|-------------|
| `<<CONTACT>>` | `CONTACT_NUMBER` | `principal_investigator.contact_number` | Legacy field name for contact |
| `<<EMAIL>>` | `E_MAIL` | `principal_investigator.email` | Legacy field name for email |
| `<<REVIEW_TYPE>>` | Hardcoded | "Expedited Review" | Legacy review type field |
| `<<SUBMISSION_TYPE>>` | `TYPE_SUBMISSION` | `submission.submissionType` | Legacy submission type field |
| `<<DURATION_APPROVAL>>` | `DURATION_DATE` | Auto-generated | Legacy duration field |
| `<<LAST_DATE>>` | `DURATION_DATE` (end date) | Auto-generated + 1 year | Legacy expiration date |

---

## 🗂️ Firestore Data Structure

### Submission Document Path
```
submissions/{submissionId}
```

### Key Fields Structure
```javascript
{
  spupCode: "SPUP-REC-2025-001",
  tempProtocolCode: "TEMP-2025-001",
  submissionType: "Initial Review",
  researchType: "SR",  // or "EX"
  reviewType: "SR",    // or "Ex"
  status: "accepted",
  decisionDetails: "Approved with recommendations",
  approvedAt: Timestamp,  // ✨ ACTUAL APPROVAL DATE!
  assignedAt: Timestamp,  // ✨ WHEN REVIEWERS WERE ASSIGNED!
  
  information: {
    general_information: {
      protocol_title: "Study on...",
      
      principal_investigator: {
        name: "Dr. John Doe",
        position_institution: "St. Paul University Philippines",
        address: "123 Main St., Tuguegarao City",
        contact_number: "+63 912 345 6789",
        email: "john.doe@spup.edu.ph"
      },
      
      adviser: {
        name: "Dr. Jane Smith",
        position_institution: "St. Paul University Philippines",
        email: "jane.smith@spup.edu.ph"
      }
    },
    
    nature_and_type_of_study: {
      level: "Master's Thesis",
      type: "Social/Behavioral"
    }
  }
}
```

---

## 📄 Document Templates & Their Placeholders

### Certificate of Approval (Form 08C)
**File:** `/templates/certificates/Form 08C Certificate of Approval.docx`

**Required Placeholders:**
- `<<SPUP_REC_CODE>>`
- `<<PRINCIPAL_INVESTIGATOR>>`
- `<<PROTOCOL_TITLE>>`
- `<<INSTITUTION>>`
- `<<APPROVED_DATE>>`
- `<<DURATION_DATE>>`
- `<<Chairperson>>`
- `<<DATE>>`

### Certificate of Exemption (Form 04B)
**File:** `/templates/certificates/Form 04B Certificate of Exemption from review.docx`

**Required Placeholders:**
- `<<SPUP_REC_CODE>>`
- `<<PRINCIPAL_INVESTIGATOR>>`
- `<<PROTOCOL_TITLE>>`
- `<<INSTITUTION>>`
- `<<DATE>>`
- `<<Chairperson>>`

### Notification of SPUP REC Decision (Form 08B)
**File:** `/templates/Form 08B Notification of SPUP REC Decision.docx`

**Required Placeholders:**
- `<<DATE>>`
- `<<PRINCIPAL_INVESTIGATOR>>`
- `<<ADDRESS>>`
- `<<PROTOCOL_TITLE>>`
- `<<SPUP_REC_CODE>>`
- `<<DECISION>>`
- `<<DECISION_DETAILS>>`
- `<<Chairperson>>`

### Protocol Resubmission Form (Form 08A)
**File:** `/templates/Form 08A Protocol Resubmission Form.docx`

**Required Placeholders:**
- `<<DATE>>`
- `<<SPUP_REC_CODE>>`
- `<<PROTOCOL_TITLE>>`
- `<<PRINCIPAL_INVESTIGATOR>>`
- `<<CONTACT_NUMBER>>` or `<<CONTACT>>`
- `<<E_MAIL>>` or `<<EMAIL>>`
- `<<ADVISER>>`

### Archiving Notification (Form 14B)
**File:** `/templates/post-documents/Form 14B Archivng Notification.docx`

**Required Placeholders:**
- `<<DATE>>`
- `<<SPUP_REC_CODE>>`
- `<<PRINCIPAL_INVESTIGATOR>>`
- `<<INSTITUTION>>`
- `<<PROTOCOL_TITLE>>`
- `<<APPROVED_DATE>>`
- `<<Chairperson>>`

### Progress Report Form (Form 09B)
**File:** `/templates/post-documents/Form 09B Progress Report Application Form.docx`

**Required Placeholders:**
- `<<SPUP_REC_CODE>>`
- `<<PROTOCOL_TITLE>>`
- `<<PRINCIPAL_INVESTIGATOR>>`
- `<<INSTITUTION>>`
- `<<CONTACT_NUMBER>>`
- `<<E_MAIL>>`
- `<<ADVISER>>`
- `<<APPROVED_DATE>>`

### Final Report Form (Form 14A)
**File:** `/templates/post-documents/Form 14A Final Report Form .docx`

**Required Placeholders:**
- `<<SPUP_REC_CODE>>`
- `<<PROTOCOL_TITLE>>`
- `<<PRINCIPAL_INVESTIGATOR>>`
- `<<INSTITUTION>>`
- `<<CONTACT_NUMBER>>`
- `<<E_MAIL>>`
- `<<APPROVED_DATE>>`

---

## 🔧 Centralized Template Data Mapper

### ⭐ ALL PLACEHOLDER LOGIC IS NOW IN ONE FILE!

**Location:** `src/lib/services/templateDataMapper.ts`

This file contains:
- ✅ All placeholder mappings
- ✅ All data extraction logic
- ✅ Date formatting functions
- ✅ Extensive debug logging
- ✅ Validation functions

**Usage:**
```typescript
import { extractTemplateData } from '@/lib/services/templateDataMapper';

const templateData = extractTemplateData(submission, chairpersonName);
// All placeholders are now populated!
```

### Issue 1: Institution Not Showing
**Problem:** `<<INSTITUTION>>` placeholder showing "N/A"

**Data Source:**
```javascript
submission.information.general_information.principal_investigator.position_institution
```

**Solution:** 
1. Open browser console (F12) when generating documents
2. Look for log: `🏢 Institution value: ...`
3. If empty, the form submission isn't saving this field properly
4. Fallback is now "St. Paul University Philippines" instead of "N/A"
5. All fixes go in `src/lib/services/templateDataMapper.ts`

### Issue 2: Notice of Acceptance Not Generated
**Problem:** "Notification of SPUP REC Decision" document not appearing in downloads

**Current Configuration:**
- ✅ Included in `DECISION_DOCUMENTS.approved.templates` array
- ✅ Template file path is correct: `/templates/Form 08B Notification of SPUP REC Decision.docx`
- ❓ May be filtered out in the UI template selection

**Solution:** Check the template label matching in the filter:
```typescript
// In generate-documents/page.tsx
const filtered = docs.filter(doc => {
  const name = doc.fileName || "";
  return selectedTemplates.some(label => 
    name.toLowerCase().includes(label.toLowerCase().split(' ').join('_')) || 
    name.toLowerCase().includes(label.toLowerCase())
  );
});
```

The label "Notification of SPUP REC Decision" should match the fileName "Notice_of_Decision_..."

---

## 📊 Template Selection Logic

### Current Template Labels (for SR)
```javascript
[
  "Certificate of Approval",        // → certificate_approval_full
  "Notification of SPUP REC Decision", // → notice_decision
  "Protocol Resubmission Form",     // → protocol_resubmission
  "Archiving Notification"          // → archiving_notification
]
```

### Current Template Labels (for EX)
```javascript
[
  "Certificate of Exemption",       // → certificate_exemption
  "Notification of SPUP REC Decision", // → notice_decision
  "Protocol Resubmission Form",     // → protocol_resubmission
  "Archiving Notification"          // → archiving_notification
]
```

### File Name Mapping
```javascript
{
  certificate_approval_full: 'Certificate_of_Approval_Full_[CODE]_[DATE].docx',
  certificate_exemption: 'Certificate_of_Exemption_[CODE]_[DATE].docx',
  notice_decision: 'Notice_of_Decision_[CODE]_[DATE].docx',
  protocol_resubmission: 'Protocol_Resubmission_Form_[CODE]_[DATE].docx',
  archiving_notification: 'Archiving_Notification_[CODE]_[DATE].docx'
}
```

---

## 🧪 Testing Checklist

- [ ] Verify all placeholders in Word templates match the mapping above
- [ ] Check that `position_institution` field is saved during protocol submission
- [ ] Test document generation for SR (Standard Review) protocols
- [ ] Test document generation for EX (Exemption) protocols
- [ ] Verify "Notification of SPUP REC Decision" is generated and downloaded
- [ ] Confirm Institution field shows actual value (not "N/A")
- [ ] Test all 4 documents generate successfully for approved protocols

---

## 📝 Notes

1. **Date Format:** All dates use US locale format: "Month DD, YYYY" (e.g., "January 15, 2025")
2. **Certificate Selection:** Automatically determined by `researchType` or `reviewType` field:
   - `SR` = Certificate of Approval
   - `EX` or `Ex` = Certificate of Exemption
3. **Fallback Values:** All fields have fallback values to prevent template errors
4. **Legacy Compatibility:** Old template placeholders (`<<CONTACT>>`, `<<EMAIL>>`) are automatically mapped to new fields

---

**Last Updated:** January 2025  
**Version:** 1.0

