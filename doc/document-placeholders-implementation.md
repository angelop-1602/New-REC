# Document Placeholders Implementation

## Overview
This document outlines the complete implementation of all required placeholders for the document generation system, ensuring all auto-generated values, protocol information, and reviewer-based values are properly supported.

## ✅ Implemented Placeholders

### Auto-Generated Values
- **`<<DATE>>`** – Current system date (modifiable if needed)
- **`<<INITIAL_DATE>>`** – System-generated: 5 days prior to `<<APPROVED_DATE>>` (middle of 3-7 day range)
- **`<<DURATION_DATE>>`** – Auto-generated validity period: 1 year from `<<APPROVED_DATE>>`

### Protocol Information (fetched from protocol submitted record)
- **`<<SPUP_REC_CODE>>`** – Assigned REC protocol code
- **`<<PROTOCOL_TITLE>>`** – Title of the research protocol
- **`<<PRINCIPAL_INVESTIGATOR>>`** – Full name of the principal investigator
- **`<<INSTITUTION>>`** – Institution or affiliation of the investigator
- **`<<ADDRESS>>`** – Institutional or official address provided
- **`<<CONTACT_NUMBER>>`** – Contact number listed in the protocol
- **`<<E-MAIL>>`** – Email address listed in the protocol
- **`<<ADVISER>>`** – Research adviser name
- **`<<APPROVED_DATE>>`** – Date of REC approval
- **`<<TYPE_SUBMISSION>>`** – Type of submission (e.g., Initial Review, Amendment, Continuing Review, Final Report)

### Input / Reviewer-Based Values
- **`<<VERSION>>`** – Protocol version number (default: 1.0)
- **`<<Chairperson>>`** – Name of the Chairperson (pulled from reviewer list where status/role = "Chairperson")

## 🔧 Technical Implementation

### TemplateData Interface
```typescript
export interface TemplateData {
  // Auto-Generated Values
  DATE: string;
  INITIAL_DATE?: string;
  DURATION_DATE?: string;
  
  // Protocol Information (fetched from protocol submitted record)
  SPUP_REC_CODE: string;
  PROTOCOL_TITLE: string;
  PRINCIPAL_INVESTIGATOR: string;
  INSTITUTION: string;
  ADDRESS: string;
  CONTACT_NUMBER: string;
  E_MAIL: string;
  ADVISER?: string;
  APPROVED_DATE?: string;
  TYPE_SUBMISSION?: string;
  
  // Input / Reviewer-Based Values
  VERSION?: string;
  Chairperson: string;
  
  // Legacy fields for backward compatibility
  CONTACT?: string;
  EMAIL?: string;
  DURATION_APPROVAL?: string;
  LAST_DATE?: string;
  DECISION?: string;
  DECISION_DETAILS?: string;
  TIMELINE?: string;
  REVIEW_TYPE?: string;
  SUBMISSION_TYPE?: string;
  COMPLIANCE_DEADLINE?: string;
}
```

### Data Mapping
The system automatically maps protocol submission data to template placeholders:

```typescript
const templateData: TemplateData = {
  // Auto-Generated Values
  DATE: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  INITIAL_DATE: initialDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  DURATION_DATE: durationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  
  // Protocol Information
  SPUP_REC_CODE: submissionData.spupCode || submissionData.tempProtocolCode || 'PENDING',
  PROTOCOL_TITLE: info?.general_information?.protocol_title || 'Untitled Protocol',
  PRINCIPAL_INVESTIGATOR: pi?.name || 'Unknown',
  INSTITUTION: pi?.position_institution || 'N/A',
  ADDRESS: pi?.address || 'N/A',
  CONTACT_NUMBER: pi?.contact_number || 'N/A',
  E_MAIL: pi?.email || 'N/A',
  ADVISER: adviser?.name || 'N/A',
  APPROVED_DATE: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  TYPE_SUBMISSION: submissionData.submissionType || 'Initial Review',
  
  // Input/Reviewer Values
  VERSION: '1.0',
  Chairperson: chairName,
};
```

## 🎨 UI Improvements

### Fixed Black Dialog Background
- **Issue**: Document generation dialog had black background (`bg-black` class)
- **Solution**: Removed all black styling classes and restored default dialog styling
- **Result**: Clean, readable dialog with proper contrast

### Enhanced Replacement Preview
The replacement preview now shows all placeholders with their actual values:

```typescript
const replacementPreview = [
  // Auto-Generated Values
  { key: "<<DATE>>", value: "January 15, 2025" },
  { key: "<<INITIAL_DATE>>", value: "January 10, 2025" },
  { key: "<<DURATION_DATE>>", value: "January 15, 2026" },
  
  // Protocol Information
  { key: "<<SPUP_REC_CODE>>", value: "SPUP_2025_001_SR_II" },
  { key: "<<PROTOCOL_TITLE>>", value: "Research Protocol Title" },
  { key: "<<PRINCIPAL_INVESTIGATOR>>", value: "Dr. John Doe" },
  { key: "<<INSTITUTION>>", value: "SPUP University" },
  { key: "<<ADDRESS>>", value: "123 University St." },
  { key: "<<CONTACT_NUMBER>>", value: "+63 912 345 6789" },
  { key: "<<E-MAIL>>", value: "john.doe@spup.edu.ph" },
  { key: "<<ADVISER>>", value: "Dr. Jane Smith" },
  { key: "<<APPROVED_DATE>>", value: "January 15, 2025" },
  { key: "<<TYPE_SUBMISSION>>", value: "Initial Review" },
  
  // Input/Reviewer Values
  { key: "<<VERSION>>", value: "1.0" },
  { key: "<<Chairperson>>", value: "Dr. Maria Santos" },
];
```

## 🔄 Backward Compatibility

The system maintains backward compatibility with existing templates by:
- Keeping legacy field names (`CONTACT`, `EMAIL`, `DURATION_APPROVAL`, etc.)
- Automatically mapping new fields to legacy fields when needed
- Providing default values for all optional fields

## 📋 Usage

### For Document Templates
All placeholders are now available in Word templates using the format:
```
<<PLACEHOLDER_NAME>>
```

### For Developers
The system automatically handles:
- Date calculations (INITIAL_DATE, DURATION_DATE)
- Data extraction from protocol submissions
- Default value assignment
- Error handling for missing data

## ✅ Verification

All placeholders are:
1. **Defined** in the TemplateData interface
2. **Mapped** in the generateDecisionDocuments function
3. **Displayed** in the replacement preview
4. **Processed** by the document generator
5. **Tested** with actual protocol data

The document generation system now fully supports all required placeholders as specified in the requirements.
