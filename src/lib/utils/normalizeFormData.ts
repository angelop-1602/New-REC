/**
 * Normalize form data by setting empty optional fields to "N/A"
 * 
 * Fields that should be normalized to "N/A" if empty:
 * - general_information.principal_investigator.institution
 * - general_information.principal_investigator.position
 * - general_information.adviser.name
 */

import { InformationType } from '@/types/information.types';

/**
 * Normalize empty optional fields to "N/A"
 */
export function normalizeFormData(information: InformationType): InformationType {
  const normalized = JSON.parse(JSON.stringify(information)); // Deep clone

  // Ensure nested objects exist
  if (!normalized.general_information) {
    normalized.general_information = {} as any;
  }
  if (!normalized.general_information.principal_investigator) {
    normalized.general_information.principal_investigator = {} as any;
  }
  if (!normalized.general_information.adviser) {
    normalized.general_information.adviser = {} as any;
  }

  // Normalize institution
  const institution = normalized.general_information.principal_investigator.institution;
  if (!institution || (typeof institution === 'string' && institution.trim() === '')) {
    normalized.general_information.principal_investigator.institution = 'N/A';
  }

  // Normalize position
  const position = normalized.general_information.principal_investigator.position;
  if (!position || (typeof position === 'string' && position.trim() === '')) {
    normalized.general_information.principal_investigator.position = 'N/A';
  }

  // Normalize adviser name
  const adviserName = normalized.general_information.adviser.name;
  if (!adviserName || (typeof adviserName === 'string' && adviserName.trim() === '')) {
    normalized.general_information.adviser.name = 'N/A';
  }

  return normalized;
}

