/**
 * CENTRALIZED TEMPLATE DATA MAPPER
 * 
 * This file contains ALL placeholder mappings and data extraction logic in ONE place.
 * If any placeholder shows wrong data (like Institution = N/A), fix it here!
 * 
 * All template placeholders and their data sources are defined here.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// TEMPLATE PLACEHOLDER TYPES
// ============================================================================

export interface TemplateData {
  // Auto-Generated Values
  DATE: string;
  INITIAL_DATE?: string;
  DURATION_DATE?: string;
  
  // Protocol Information
  SPUP_REC_CODE: string;
  PROTOCOL_TITLE: string;
  PRINCIPAL_INVESTIGATOR: string;
  INSTITUTION: string;
  ADDRESS: string;
  CONTACT_NUMBER: string;
  E_MAIL: string;
  ADVISER?: string;
  APPROVED_DATE?: string;
  INITIAL_REVIEW_DATE?: string; // When reviewers were assigned
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely extract a nested value from an object
 */
function getNestedValue(obj: any, path: string, fallback: string = 'N/A'): string {
  try {
    const value = path.split('.').reduce((current, key) => current?.[key], obj);
    return value || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Format Firestore Timestamp to readable date string
 */
function formatFirestoreDate(timestamp: any): string {
  try {
    if (!timestamp) return '';
    
    // Handle Firestore Timestamp
    if (timestamp.toDate) {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Handle regular Date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Handle ISO string
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return '';
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format today's date
 */
function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate duration date (1 year from a given date)
 */
function calculateDurationDate(fromDate?: any): string {
  try {
    let startDate: Date;
    
    if (fromDate?.toDate) {
      startDate = fromDate.toDate();
    } else if (fromDate instanceof Date) {
      startDate = fromDate;
    } else if (typeof fromDate === 'string') {
      startDate = new Date(fromDate);
    } else {
      startDate = new Date();
    }
    
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    const startFormatted = startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const endFormatted = endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    console.error('Error calculating duration date:', error);
    return '';
  }
}

// ============================================================================
// MAIN DATA MAPPING FUNCTION
// ============================================================================

/**
 * Extract all template data from submission
 * 
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL PLACEHOLDER MAPPINGS!
 * 
 * If any field shows wrong data, update the mapping here.
 */
export function extractTemplateData(
  submissionData: any,
  chairpersonName?: string
): TemplateData {
  console.log('📋 Extracting template data from submission:', submissionData.id || submissionData.spupCode);
  
  // ============================================================================
  // STEP 1: Extract nested objects for easier access
  // ============================================================================
  
  const information = submissionData.information || {};
  const generalInfo = information.general_information || {};
  const principalInvestigator = generalInfo.principal_investigator || {};
  const adviser = generalInfo.adviser || {};
  
  console.log('👤 Principal Investigator data:', principalInvestigator);
  console.log('🏢 Institution value:', principalInvestigator.position_institution);
  
  // ============================================================================
  // STEP 2: Extract dates from Firestore
  // ============================================================================
  
  // Approved Date - USE DATABASE VALUE, NOT AUTO-GENERATED!
  const approvedDate = submissionData.approvedAt 
    ? formatFirestoreDate(submissionData.approvedAt)
    : formatToday(); // Fallback to today only if no approvedAt exists
  
  console.log('📅 Approved Date:', approvedDate);
  
  // Initial Review Date - When reviewers were assigned
  const initialReviewDate = submissionData.assignedAt 
    ? formatFirestoreDate(submissionData.assignedAt)
    : '';
  
  console.log('📅 Initial Review Date (assignedAt):', initialReviewDate);
  
  // ============================================================================
  // STEP 3: Build the template data object
  // ============================================================================
  
  const templateData: TemplateData = {
    // =========================================
    // AUTO-GENERATED VALUES
    // =========================================
    DATE: formatToday(),
    INITIAL_DATE: initialReviewDate || approvedDate, // Use assignedAt or fallback to approvedAt
    DURATION_DATE: calculateDurationDate(submissionData.approvedAt),
    
    // =========================================
    // PROTOCOL INFORMATION
    // =========================================
    SPUP_REC_CODE: submissionData.spupCode || submissionData.tempProtocolCode || 'PENDING',
    PROTOCOL_TITLE: generalInfo.protocol_title || 'Untitled Protocol',
    
    // =========================================
    // PRINCIPAL INVESTIGATOR
    // =========================================
    PRINCIPAL_INVESTIGATOR: principalInvestigator.name || 'Unknown',
    
    // 🏢 INSTITUTION - THIS IS WHERE THE ISSUE USUALLY IS!
    INSTITUTION: principalInvestigator.position_institution || 'St. Paul University Philippines',
    
    ADDRESS: principalInvestigator.address || 'N/A',
    CONTACT_NUMBER: principalInvestigator.contact_number || 'N/A',
    E_MAIL: principalInvestigator.email || 'N/A',
    
    // =========================================
    // ADVISER
    // =========================================
    ADVISER: adviser.name || 'N/A',
    
    // =========================================
    // DATES
    // =========================================
    APPROVED_DATE: approvedDate, // ✅ FROM DATABASE, NOT AUTO-GENERATED!
    INITIAL_REVIEW_DATE: initialReviewDate, // ✅ NEW FIELD - When reviewers assigned
    
    // =========================================
    // OTHER FIELDS
    // =========================================
    TYPE_SUBMISSION: submissionData.submissionType || 'Initial Review',
    VERSION: '02',
    Chairperson: chairpersonName || 'REC Chairperson',
    
    // =========================================
    // LEGACY FIELDS (for old templates)
    // =========================================
    CONTACT: principalInvestigator.contact_number || 'N/A',
    EMAIL: principalInvestigator.email || 'N/A',
    REVIEW_TYPE: submissionData.reviewType === 'EX' ? 'Expedited Review' : 'Full Board Review',
    SUBMISSION_TYPE: submissionData.submissionType || 'Initial Submission',
    DECISION: submissionData.decision || '',
    DECISION_DETAILS: submissionData.decisionDetails || '',
    TIMELINE: submissionData.timeline || '',
  };
  
  // ============================================================================
  // STEP 4: Debug logging
  // ============================================================================
  
  console.log('✅ Template data extracted:');
  console.log('   SPUP_REC_CODE:', templateData.SPUP_REC_CODE);
  console.log('   PROTOCOL_TITLE:', templateData.PROTOCOL_TITLE);
  console.log('   PRINCIPAL_INVESTIGATOR:', templateData.PRINCIPAL_INVESTIGATOR);
  console.log('   🏢 INSTITUTION:', templateData.INSTITUTION, '← CHECK THIS!');
  console.log('   APPROVED_DATE:', templateData.APPROVED_DATE);
  console.log('   INITIAL_REVIEW_DATE:', templateData.INITIAL_REVIEW_DATE);
  
  return templateData;
}

// ============================================================================
// PLACEHOLDER VALIDATION
// ============================================================================

/**
 * Validate that all required placeholders have values
 */
export function validateTemplateData(data: TemplateData): { valid: boolean; missing: string[] } {
  const requiredFields: (keyof TemplateData)[] = [
    'SPUP_REC_CODE',
    'PROTOCOL_TITLE',
    'PRINCIPAL_INVESTIGATOR',
    'INSTITUTION'
  ];
  
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field] === 'N/A' || data[field] === 'Unknown' || data[field] === 'PENDING') {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// ============================================================================
// FORMAT DATA FOR DOCXTEMPLATER
// ============================================================================

/**
 * Format template data to ensure all placeholders have string values
 */
export function formatTemplateData(data: TemplateData): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      formatted[key] = '';
    } else {
      formatted[key] = value.toString();
    }
  });
  
  return formatted;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  extractTemplateData,
  validateTemplateData,
  formatTemplateData,
  formatFirestoreDate,
  calculateDurationDate
};

