import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { getCurrentChairName } from '../core/recSettingsService';
import { extractTemplateData, formatTemplateData, type TemplateData } from './templateDataMapper';

// Document template types
export type DocumentTemplate = 
  | 'certificate_approval_full'
  | 'certificate_approval_expedited'
  | 'certificate_exemption'
  | 'notice_decision'
  | 'protocol_resubmission'
  | 'progress_report'
  | 'final_report'
  | 'archiving_notification'
  | 'appeal_form';

// Re-export TemplateData from centralized mapper
export type { TemplateData } from './templateDataMapper';

// Template file mapping
const TEMPLATE_FILES: Record<DocumentTemplate, string> = {
  certificate_approval_full: '/templates/certificates/Form 08C Certificate of Approval.docx',
  certificate_approval_expedited: '/templates/certificates/Form 08C Certificate of Approval.docx',
  certificate_exemption: '/templates/certificates/Form 04B Certificate of Exemption from review.docx',
  notice_decision: '/templates/Form 08B Notification of SPUP REC Decision.docx',
  protocol_resubmission: '/templates/Form 08A Protocol Resubmission Form.docx',
  progress_report: '/templates/post-documents/Form 09B Progress Report Application Form.docx',
  final_report: '/templates/post-documents/Form 14A Final Report Form .docx',
  archiving_notification: '/templates/post-documents/Form 14B Archivng Notification.docx',
  appeal_form: '/templates/Form 16 Appeal Report Form.docx',
};

// Document generation configurations based on decision
export const DECISION_DOCUMENTS: Record<string, { templates: DocumentTemplate[], timeline?: number }> = {
  'approved': {
    templates: [
      'certificate_approval_full',
      'notice_decision',
      'protocol_resubmission',
      'archiving_notification'
    ]
  },
  'approved_minor_revisions': {
    templates: [
      'notice_decision',
      'protocol_resubmission'
    ],
    timeline: 3 // 3 days
  },
  'major_revisions_deferred': {
    templates: [
      'notice_decision',
      'protocol_resubmission'
    ],
    timeline: 7 // 7 days
  },
  'disapproved': {
    templates: ['notice_decision']
  }
};

class DocumentGeneratorService {
  /**
   * Generate a document from a template
   */
  async generateDocument(
    templateType: DocumentTemplate,
    data: TemplateData
  ): Promise<Blob> {
    try {
      // Fetch the template file
      const templatePath = TEMPLATE_FILES[templateType];
      const response = await fetch(templatePath);
      
      if (!response.ok) {
        throw new Error(`Failed to load template: ${templatePath}`);
      }

      const templateBuffer = await response.arrayBuffer();
      
      // Load the docx file as binary
      const zip = new PizZip(templateBuffer);
      
      // Initialize docxtemplater
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '<<',
          end: '>>'
        }
      });

      // Format data - ensure all placeholders have values
      const formattedData = this.formatTemplateData(data);
      
      // Set the template variables
      doc.setData(formattedData);
      
      // Render the document
      doc.render();
      
      // Generate the document as a blob
      const generatedDoc = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      
      return generatedDoc;
    } catch (error) {
      console.error('Error generating document:', error);
      throw new Error(`Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate multiple documents based on decision
   */
  async generateDecisionDocuments(
    decision: string,
    data: TemplateData,
    reviewType: 'SR' | 'EX' = 'EX'
  ): Promise<{ template: DocumentTemplate; blob: Blob; fileName: string }[]> {
    const config = DECISION_DOCUMENTS[decision];
    
    if (!config) {
      throw new Error(`No document configuration for decision: ${decision}`);
    }

    const generatedDocs: { template: DocumentTemplate; blob: Blob; fileName: string }[] = [];
    
    // Add timeline to data if applicable
    if (config.timeline) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + config.timeline);
      data.COMPLIANCE_DEADLINE = deadline.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      data.TIMELINE = `${config.timeline} days`;
    }

    // Generate each document
    for (const templateType of config.templates) {
      try {
        // Select the appropriate certificate based on review type
        let actualTemplate = templateType;
        if (templateType === 'certificate_approval_full') {
          // SR (Standard Review) = Certificate of Approval (Full Board)
          // EX (Exemption) = Certificate of Exemption
          if (reviewType === 'EX') {
            actualTemplate = 'certificate_exemption';
          } else {
            // For SR, keep as full board certificate
            actualTemplate = 'certificate_approval_full';
          }
        }

        const blob = await this.generateDocument(actualTemplate as DocumentTemplate, data);
        const fileName = this.getFileName(actualTemplate as DocumentTemplate, data.SPUP_REC_CODE);
        
        generatedDocs.push({
          template: actualTemplate as DocumentTemplate,
          blob,
          fileName
        });
      } catch (error) {
        console.error(`Failed to generate ${templateType}:`, error);
      }
    }

    return generatedDocs;
  }

  /**
   * Download a generated document
   */
  downloadDocument(blob: Blob, fileName: string): void {
    saveAs(blob, fileName);
  }

  /**
   * Format template data to ensure all placeholders have values
   */
  private formatTemplateData(data: TemplateData): Record<string, string> {
    const formatted: Record<string, string> = {};
    
    // Set default values for optional fields
    const defaults: Partial<TemplateData> = {
      // Auto-Generated Values
      DATE: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      INITIAL_DATE: this.calculateInitialDate(),
      DURATION_DATE: this.calculateDurationDate(),
      
      // Protocol Information defaults
      INSTITUTION: 'N/A',
      ADDRESS: 'N/A',
      CONTACT_NUMBER: 'N/A',
      E_MAIL: 'N/A',
      ADVISER: 'N/A',
      APPROVED_DATE: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      TYPE_SUBMISSION: 'Initial Review',
      
          // Input/Reviewer defaults
    VERSION: '02',
      
      // Legacy compatibility
      CONTACT: 'N/A',
      EMAIL: 'N/A',
      DURATION_APPROVAL: '1 year',
      DECISION: '',
      DECISION_DETAILS: '',
      TIMELINE: '',
      REVIEW_TYPE: 'Expedited Review',
      SUBMISSION_TYPE: 'Initial Submission',
      COMPLIANCE_DEADLINE: ''
    };

    // Merge data with defaults
    const merged = { ...defaults, ...data };
    
    // Convert all values to strings and handle special cases
    Object.entries(merged).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        formatted[key] = '';
      } else {
        formatted[key] = value.toString();
      }
    });

    // Calculate DURATION_DATE (1 year from APPROVED_DATE)
    if (formatted.APPROVED_DATE && !formatted.DURATION_DATE) {
      const approvedDate = new Date(formatted.APPROVED_DATE);
      const durationDate = new Date(approvedDate);
      durationDate.setFullYear(durationDate.getFullYear() + 1);
      
      formatted.DURATION_DATE = durationDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Calculate LAST_DATE for legacy compatibility
    if (formatted.APPROVED_DATE && !formatted.LAST_DATE) {
      const approvedDate = new Date(formatted.APPROVED_DATE);
      approvedDate.setFullYear(approvedDate.getFullYear() + 1);
      
      formatted.LAST_DATE = approvedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Map legacy fields for backward compatibility
    if (!formatted.CONTACT && formatted.CONTACT_NUMBER) {
      formatted.CONTACT = formatted.CONTACT_NUMBER;
    }
    if (!formatted.EMAIL && formatted.E_MAIL) {
      formatted.EMAIL = formatted.E_MAIL;
    }

    return formatted;
  }

  /**
   * Calculate INITIAL_DATE (3-7 days prior to APPROVED_DATE)
   */
  private calculateInitialDate(): string {
    const today = new Date();
    const initialDate = new Date(today);
    // Subtract 5 days (middle of 3-7 range)
    initialDate.setDate(initialDate.getDate() - 5);
    
    return initialDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Calculate DURATION_DATE (1 year from APPROVED_DATE)
   */
  private calculateDurationDate(): string {
    const today = new Date();
    const durationDate = new Date(today);
    durationDate.setFullYear(durationDate.getFullYear() + 1);
    
    return durationDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Generate a filename for the document
   */
  private getFileName(template: DocumentTemplate, spupCode: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const templateNames: Record<DocumentTemplate, string> = {
      certificate_approval_full: 'Certificate_of_Approval_Full',
      certificate_approval_expedited: 'Certificate_of_Approval_Expedited', 
      certificate_exemption: 'Certificate_of_Exemption',
      notice_decision: 'Notice_of_Decision',
      protocol_resubmission: 'Protocol_Resubmission_Form',
      progress_report: 'Progress_Report_Form',
      final_report: 'Final_Report_Form',
      archiving_notification: 'Archiving_Notification',
      appeal_form: 'Form_16_Appeal_Application'
    };

    const baseName = templateNames[template] || 'Document';
    return `${spupCode}_${baseName}_${timestamp}.docx`;
  }

  /**
   * Get template requirements for a specific template
   */
  getTemplateRequirements(template: DocumentTemplate): (keyof TemplateData)[] {
    const baseRequirements: (keyof TemplateData)[] = [
      'DATE',
      'SPUP_REC_CODE',
      'PROTOCOL_TITLE',
      'PRINCIPAL_INVESTIGATOR',
      'Chairperson'
    ];

    const specificRequirements: Partial<Record<DocumentTemplate, (keyof TemplateData)[]>> = {
      certificate_approval_full: [
        ...baseRequirements,
        'APPROVED_DATE',
        'DURATION_APPROVAL',
        'LAST_DATE'
      ],
      certificate_approval_expedited: [
        ...baseRequirements,
        'APPROVED_DATE',
        'DURATION_APPROVAL',
        'LAST_DATE'
      ],
      notice_decision: [
        ...baseRequirements,
        'DECISION',
        'DECISION_DETAILS'
      ],
      protocol_resubmission: [
        ...baseRequirements,
        'TIMELINE',
        'COMPLIANCE_DEADLINE'
      ]
    };

    return specificRequirements[template] || baseRequirements;
  }

  /**
   * Upload generated document to Firebase Storage
   */
  async uploadToStorage(
    blob: Blob,
    fileName: string,
    submissionId: string
  ): Promise<{ storagePath: string; downloadUrl: string }> {
    try {
      // Import Firebase storage functions dynamically
      const firebaseApp = (await import('@/lib/firebaseConfig')).default;
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const storage = getStorage(firebaseApp);
      
      // Create storage path
      const storagePath = `generated-documents/${submissionId}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      // Upload the blob
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      return {
        storagePath,
        downloadUrl
      };
    } catch (error) {
      console.error('Error uploading document to storage:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const documentGenerator = new DocumentGeneratorService();

// Export utility function for easy access
export const generateDecisionDocuments = async (
  decision: string,
  submissionData: any,
  chairpersonName?: string,
  timeline?: string
): Promise<{ template: DocumentTemplate; blob: Blob; fileName: string }[]> => {
  // Get chairperson name from settings if not provided
  const chairName = chairpersonName || await getCurrentChairName();
  
  // ✅ USE CENTRALIZED DATA MAPPER - ALL PLACEHOLDER LOGIC IN ONE PLACE!
  const templateData = extractTemplateData(submissionData, chairName);
  
  // Add decision-specific fields
  templateData.DECISION = decision;
  templateData.TIMELINE = timeline || '';
  
  // Add compliance deadline if timeline is provided
  if (timeline) {
    const deadline = new Date();
    const days = parseInt(timeline.replace(/\D/g, ''));
    if (!isNaN(days)) {
      deadline.setDate(deadline.getDate() + days);
      templateData.COMPLIANCE_DEADLINE = deadline.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  // Extract research type from submission data (SR = Standard Review, EX = Exemption)
  const researchType = submissionData.researchType || submissionData.reviewType || 'SR';
  const reviewType: 'SR' | 'EX' = (researchType === 'EX' || researchType === 'Ex') ? 'EX' : 'SR';
  
  return documentGenerator.generateDecisionDocuments(
    decision,
    templateData,
    reviewType
  );
};
