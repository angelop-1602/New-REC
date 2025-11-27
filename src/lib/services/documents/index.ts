/**
 * Documents Services - Barrel Export
 * 
 * Centralized exports for all document-related services
 */

export { DocumentManagementService, documentManagementService } from './documentManagementService';
export { EnhancedDocumentManagementService, enhancedDocumentManagementService } from './enhancedDocumentManagementService';
export { documentGenerator, generateDecisionDocuments, type DocumentTemplate, type TemplateData } from './documentGenerator';
export { buildReviewerSummaryDocx } from './wordExportService';
export { extractTemplateData, formatTemplateData, validateTemplateData, type TemplateData as TemplateDataType } from './templateDataMapper';

