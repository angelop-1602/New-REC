/**
 * Export Service
 * Handles exporting protocol data to CSV, Excel, and PDF formats
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProtocolExportData, EXTRACTION_FIELDS, ReportData, ReportPeriod } from '@/types/extraction.types';
import { saveAs } from 'file-saver';

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: ProtocolExportData[],
  fields: string[],
  filename: string = 'protocol-export'
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get field labels
  const fieldMap = new Map(EXTRACTION_FIELDS.map(f => [f.id, f.label]));
  
  // Create headers
  const headers = fields.map(fieldId => fieldMap.get(fieldId) || fieldId);
  
  // Create rows
  const rows = data.map(item => {
    return fields.map(fieldId => {
      const value = item[fieldId];
      if (value === null || value === undefined) return '';
      // Escape commas and quotes in CSV
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Add BOM for UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

/**
 * Export data to Excel format
 */
export function exportToExcel(
  data: ProtocolExportData[],
  fields: string[],
  filename: string = 'protocol-export'
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get field labels
  const fieldMap = new Map(EXTRACTION_FIELDS.map(f => [f.id, f.label]));
  
  // Create headers
  const headers = fields.map(fieldId => fieldMap.get(fieldId) || fieldId);
  
  // Create rows
  const rows = data.map(item => {
    return fields.map(fieldId => {
      const value = item[fieldId];
      return value === null || value === undefined ? '' : value;
    });
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Set column widths
  const colWidths = fields.map((fieldId, idx) => {
    const header = headers[idx];
    const maxLength = Math.max(
      header.length,
      ...rows.map(row => String(row[idx] || '').length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Protocol Data');
  
  // Create additional sheets for categorized data
  const categories = ['basic', 'pi', 'research', 'funding', 'administrative', 'financial'];
  
  categories.forEach(category => {
    const categoryFields = fields.filter(fieldId => {
      const field = EXTRACTION_FIELDS.find(f => f.id === fieldId);
      return field?.category === category;
    });
    
    if (categoryFields.length > 0) {
      const categoryHeaders = categoryFields.map(fieldId => fieldMap.get(fieldId) || fieldId);
      const categoryRows = data.map(item => {
        return categoryFields.map(fieldId => {
          const value = item[fieldId];
          return value === null || value === undefined ? '' : value;
        });
      });
      
      const categoryWs = XLSX.utils.aoa_to_sheet([categoryHeaders, ...categoryRows]);
      const categoryColWidths = categoryFields.map((fieldId, idx) => {
        const header = categoryHeaders[idx];
        const maxLength = Math.max(
          header.length,
          ...categoryRows.map(row => String(row[idx] || '').length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      categoryWs['!cols'] = categoryColWidths;
      
      const sheetName = category.charAt(0).toUpperCase() + category.slice(1);
      XLSX.utils.book_append_sheet(wb, categoryWs, sheetName);
    }
  });
  
  // Write file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export data to PDF format
 */
export function exportToPDF(
  data: ProtocolExportData[],
  fields: string[],
  filename: string = 'protocol-export'
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get field labels
  const fieldMap = new Map(EXTRACTION_FIELDS.map(f => [f.id, f.label]));
  
  // Create headers
  const headers = fields.map(fieldId => fieldMap.get(fieldId) || fieldId);
  
  // Create rows
  const rows = data.map(item => {
    return fields.map(fieldId => {
      const value = item[fieldId];
      return value === null || value === undefined ? '' : String(value);
    });
  });

  // Create PDF
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Add header
  doc.setFontSize(18);
  doc.setTextColor(3, 102, 53); // SPUP green
  doc.text('SPUP REC Protocol Data Export', 14, 15);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  doc.text(`Total Records: ${data.length}`, 14, 27);
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 32,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    headStyles: {
      fillColor: [3, 102, 53], // SPUP green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 32, left: 14, right: 14 },
    tableWidth: 'wrap',
  });
  
  // Add footer
  const pageCount2 = (doc as any).internal.getNumberOfPages();
  const pageWidth2 = doc.internal.pageSize.getWidth();
  const pageHeight2 = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount2; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount2}`,
      pageWidth2 / 2,
      pageHeight2 - 8,
      { align: 'center' }
    );
  }
  
  // Save PDF
  doc.save(`${filename}.pdf`);
}

// ============================================================================
// REPORT EXPORT FUNCTIONS (REC Format)
// ============================================================================

/**
 * Report column headers in exact order
 * Note: Some headers are split into multiple lines for PDF display
 */
const REPORT_COLUMNS = [
  'Protocol Code',
  'Protocol Title',
  'Names of Researcher(s)/\nInvestigator(s)',
  'Funding',
  'Research Type',
  'Date Received',
  'Review Type',
  'Date of Meeting where Protocol is First Discussed',
  'Name of Primary Reviewer',
  'Decision',
  'Date of First Decision Letter to the PI / Researcher',
  'Status'
];

/**
 * Export report data to CSV format
 */
export function exportReportToCSV(
  data: ReportData[],
  period: ReportPeriod,
  filename?: string
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Create rows
  const rows = data.map(item => [
    item.protocolCode || '',
    item.protocolTitle || '',
    item.researcherNames || '',
    item.funding || '',
    item.researchType || '',
    item.dateReceived || '',
    item.reviewType || '',
    item.meetingDate || '',
    item.primaryReviewerName || '',
    item.decision || '',
    item.decisionDate || '',
    item.status || ''
  ]);

  // Combine headers and rows
  const csvContent = [
    REPORT_COLUMNS.join(','),
    ...rows.map(row => {
      return row.map(cell => {
        const stringValue = String(cell);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    })
  ].join('\n');

  // Add BOM for UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const defaultFilename = period.type === 'monthly' && period.month
    ? `rec-report-${period.year}-${String(period.month).padStart(2, '0')}`
    : `rec-report-${period.year}`;
  
  saveAs(blob, `${filename || defaultFilename}.csv`);
}

/**
 * Export report data to Excel format
 */
export function exportReportToExcel(
  data: ReportData[],
  period: ReportPeriod,
  filename?: string
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Create rows
  const rows = data.map(item => [
    item.protocolCode || '',
    item.protocolTitle || '',
    item.researcherNames || '',
    item.funding || '',
    item.researchType || '',
    item.dateReceived || '',
    item.reviewType || '',
    item.meetingDate || '',
    item.primaryReviewerName || '',
    item.decision || '',
    item.decisionDate || '',
    item.status || ''
  ]);

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([REPORT_COLUMNS, ...rows]);
  
  // Set column widths
  const colWidths = REPORT_COLUMNS.map((header, idx) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map(row => String(row[idx] || '').length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });
  ws['!cols'] = colWidths;
  
  // Freeze first row
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'REC Report');
  
  // Write file
  const defaultFilename = period.type === 'monthly' && period.month
    ? `rec-report-${period.year}-${String(period.month).padStart(2, '0')}`
    : `rec-report-${period.year}`;
  
  XLSX.writeFile(wb, `${filename || defaultFilename}.xlsx`);
}

/**
 * Calculate summary statistics from report data
 */
export function calculateReportSummary(data: ReportData[]) {
  const summary = {
    totalProtocols: data.length,
    byFunding: {
      R: data.filter(d => d.funding === 'R').length,
      I: data.filter(d => d.funding === 'I').length,
      A: data.filter(d => d.funding === 'A').length,
      D: data.filter(d => d.funding === 'D').length,
      O: data.filter(d => d.funding === 'O').length,
    },
    byResearchType: {} as Record<string, number>,
    byStudyLevel: {} as Record<string, number>,
    byReviewType: {
      FR: data.filter(d => d.reviewType === 'FR').length,
      ER: data.filter(d => d.reviewType === 'ER').length,
      EX: data.filter(d => d.reviewType === 'EX').length,
    },
    byDecision: {
      A: data.filter(d => d.decision === 'A').length,
      MN: data.filter(d => d.decision === 'MN').length,
      MJ: data.filter(d => d.decision === 'MJ').length,
      D: data.filter(d => d.decision === 'D').length,
      NoDecision: data.filter(d => !d.decision).length,
    },
    byStatus: {
      OR: data.filter(d => d.status === 'OR').length,
      A: data.filter(d => d.status === 'A').length,
      C: data.filter(d => d.status === 'C').length,
      T: data.filter(d => d.status === 'T').length,
      W: data.filter(d => d.status === 'W').length,
    },
    withMeetingDate: data.filter(d => d.meetingDate).length,
    withReviewer: data.filter(d => d.primaryReviewerName).length,
  };

  // Count by research type
  data.forEach(item => {
    if (item.researchType) {
      summary.byResearchType[item.researchType] = (summary.byResearchType[item.researchType] || 0) + 1;
    }

    if (item.studyLevel) {
      summary.byStudyLevel[item.studyLevel] = (summary.byStudyLevel[item.studyLevel] || 0) + 1;
    }
  });

  return summary;
}

/**
 * Export report data to PDF format with larger page size and summary
 */
export function exportReportToPDF(
  data: ReportData[],
  period: ReportPeriod,
  filename?: string
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Calculate summary
  const summary = calculateReportSummary(data);

  // Create rows
  const rows = data.map(item => [
    item.protocolCode || '',
    item.protocolTitle || '',
    item.researcherNames || '',
    item.funding || '',
    item.researchType || '',
    item.dateReceived || '',
    item.reviewType || '',
    item.meetingDate || '',
    item.primaryReviewerName || '',
    item.decision || '',
    item.decisionDate || '',
    item.status || ''
  ]);

  // Create PDF with Letter size landscape (8.5" x 11" = 279.4mm x 215.9mm)
  const doc = new jsPDF('landscape', 'mm', 'letter');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10; // Reduced margin for more space
  const availableWidth = pageWidth - (margin * 2);
  
  let startY = 15;
  
  // Add header
  doc.setFontSize(14);
  doc.setTextColor(3, 102, 53); // SPUP green
  const reportTitle = period.type === 'monthly' && period.month
    ? `SPUP REC Monthly Report - ${new Date(period.year, period.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`
    : `SPUP REC Yearly Report - ${period.year}`;
  doc.text(reportTitle, margin, startY);
  
  startY += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, startY);
  
  startY += 4;
  
  // Add Summary Section
  doc.setFontSize(11);
  doc.setTextColor(3, 102, 53);
  doc.text('Summary', margin, startY);
  
  startY += 5;
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  
  // Summary table data - split into 2 columns
  const leftColumn = [
    ['Total Protocols', summary.totalProtocols.toString()],
    ['', ''],
    ['By Funding:', ''],
    ['  Researcher-funded (R)', summary.byFunding.R.toString()],
    ['  Institution-funded (I)', summary.byFunding.I.toString()],
    ['  Agency other than institution (A)', summary.byFunding.A.toString()],
    ['  Pharmaceutical companies (D)', summary.byFunding.D.toString()],
    ['  Others (O)', summary.byFunding.O.toString()],
    ['', ''],
    ['By Review Type:', ''],
    ['  Full Review (FR)', summary.byReviewType.FR.toString()],
    ['  Expedited Review (ER)', summary.byReviewType.ER.toString()],
    ['  Exempt from Review (EX)', summary.byReviewType.EX.toString()],
    ['', ''],
    ['With Meeting Date', summary.withMeetingDate.toString()],
    ['With Primary Reviewer', summary.withReviewer.toString()],
  ];

  const rightColumn = [
    ['By Decision:', ''],
    ['  Approved (A)', summary.byDecision.A.toString()],
    ['  Minor Modification (MN)', summary.byDecision.MN.toString()],
    ['  Major Modification (MJ)', summary.byDecision.MJ.toString()],
    ['  Disapproved (D)', summary.byDecision.D.toString()],
    ['  No Decision', summary.byDecision.NoDecision.toString()],
    ['', ''],
    ['By Status:', ''],
    ['  On-going Review (OR)', summary.byStatus.OR.toString()],
    ['  Approved and On-going (A)', summary.byStatus.A.toString()],
    ['  Completed (C)', summary.byStatus.C.toString()],
    ['  Terminated (T)', summary.byStatus.T.toString()],
    ['  Withdrawn (W)', summary.byStatus.W.toString()],
  ];

  // Add research type breakdown to right column
  if (Object.keys(summary.byResearchType).length > 0) {
    rightColumn.push(['', '']);
    rightColumn.push(['By Research Type:', '']);
    Object.entries(summary.byResearchType).forEach(([type, count]) => {
      rightColumn.push([`  ${type}`, count.toString()]);
    });
  }

  // Add study level breakdown to right column
  if (Object.keys(summary.byStudyLevel).length > 0) {
    rightColumn.push(['', '']);
    rightColumn.push(['By Study Level:', '']);
    Object.entries(summary.byStudyLevel).forEach(([level, count]) => {
      rightColumn.push([`  ${level}`, count.toString()]);
    });
  }

  // Calculate max rows for alignment
  const maxRows = Math.max(leftColumn.length, rightColumn.length);
  
  // Pad shorter column with empty rows
  while (leftColumn.length < maxRows) {
    leftColumn.push(['', '']);
  }
  while (rightColumn.length < maxRows) {
    rightColumn.push(['', '']);
  }

  // Combine into 2-column layout
  const summaryRows = leftColumn.map((row, idx) => [
    row[0],
    row[1],
    rightColumn[idx][0],
    rightColumn[idx][1]
  ]);

  // Add summary table with 2 columns
  autoTable(doc, {
    body: summaryRows,
    startY: startY,
    styles: {
      fontSize: 7,
      cellPadding: 1,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [3, 102, 53],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: 'bold' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 90, fontStyle: 'bold' },
      3: { cellWidth: 30, halign: 'right' },
    },
    margin: { top: startY, left: margin, right: margin },
    theme: 'plain',
  });

  // Get the final Y position after summary table
  const finalY = (doc as any).lastAutoTable.finalY || startY + (summaryRows.length * 4);
  startY = finalY + 6;
  
  // Check if we have enough space for the main table header
  const minHeaderHeight = 12; // Minimum space needed for header row
  if (startY + minHeaderHeight > pageHeight - 15) {
    doc.addPage();
    startY = 15;
  }
  
  // Prepare headers with line breaks for long headers
  // jspdf-autotable supports multi-line headers using newline characters
  const pdfHeaders = [
    'Protocol\nCode',
    'Protocol\nTitle',
    'Names of Researcher(s)/\nInvestigator(s)',
    'Funding',
    'Research\nType',
    'Date\nReceived',
    'Review\nType',
    'Date of Meeting where\nProtocol is First Discussed',
    'Name of Primary\nReviewer',
    'Decision',
    'Date of First Decision\nLetter to the PI / Researcher',
    'Status'
  ];

  // Calculate optimal column widths based on available space
  // Letter landscape: 279.4mm width, with 10mm margins = 259.4mm available
  // Distribute widths proportionally - total should be ~259mm
  const columnWidths = [
    25,  // Protocol Code
    40,  // Protocol Title (needs more space for wrapping)
    30,  // Researcher Names
    11,  // Funding
    26,  // Research Type
    17,  // Date Received
    15,  // Review Type
    26,  // Meeting Date
    20,  // Primary Reviewer
    11,  // Decision
    26,  // Decision Date
    10   // Status
  ];
  // Total: 248mm (leaves some buffer for borders/padding)
  const tableWidth = availableWidth;

  // Add main data table with text wrapping
  autoTable(doc, {
    head: [pdfHeaders],
    body: rows,
    startY: startY,
    styles: {
      fontSize: 5,
      cellPadding: 0.8,
      overflow: 'linebreak',
      valign: 'middle',
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [3, 102, 53], // SPUP green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 5.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 1,
    },
    columnStyles: columnWidths.reduce((acc, width, index) => {
      acc[index] = { 
        cellWidth: width, 
        overflow: 'linebreak',
        halign: index === 0 || index === 3 || index === 5 || index === 6 || index === 8 || index === 9 || index === 11 ? 'center' : 'left'
      };
      return acc;
    }, {} as Record<number, any>),
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { top: startY, left: margin, right: margin, bottom: 15 },
    tableWidth: tableWidth,
    showHead: 'everyPage',
    didParseCell: function(data: any) {
      // Ensure all cells can wrap text
      if (data.cell.text && data.cell.text.length > 0) {
        data.cell.styles.overflow = 'linebreak';
      }
    },
  });
  
  // Add footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }
  
  // Save PDF
  const defaultFilename = period.type === 'monthly' && period.month
    ? `rec-report-${period.year}-${String(period.month).padStart(2, '0')}`
    : `rec-report-${period.year}`;
  
  doc.save(`${filename || defaultFilename}.pdf`);
}
