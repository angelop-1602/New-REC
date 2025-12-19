"use client";

import React, { useState, useEffect } from 'react';
import { LoadingSkeleton } from '@/components/ui/loading';
import { FileText, FileSpreadsheet, FileDown, Loader2, Calendar } from 'lucide-react';
import { ReportType, ReportPeriod, ReportData } from '@/types/extraction.types';
import { fetchProtocolsForReport } from '@/lib/services/extraction/dataExtractionService';
import { transformProtocolsToReportData } from '@/lib/services/extraction/reportDataService';
import { exportReportToCSV, exportReportToExcel, exportReportToPDF } from '@/lib/services/extraction/exportService';
import { ChairpersonProtocol } from '@/types';
import { customToast } from '@/components/ui/custom/toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ExtractionPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'csv' | 'excel' | 'pdf' | null>(null);
  const [protocols, setProtocols] = useState<ChairpersonProtocol[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [reportType, setReportType] = useState<ReportType>('monthly');
  
  // Get current date for defaults
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  const [period, setPeriod] = useState<ReportPeriod>({
    type: 'monthly',
    month: currentMonth,
    year: currentYear,
  });

  // Load data when period changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const protocolsData = await fetchProtocolsForReport(period);
        setProtocols(protocolsData);
        
        // Transform to report data
        const transformedData = await transformProtocolsToReportData(protocolsData);
        setReportData(transformedData);
      } catch (error) {
        console.error('Error loading report data:', error);
        customToast.error('Error', 'Failed to load protocol data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  // Update period when report type changes
  useEffect(() => {
    if (reportType === 'monthly') {
      setPeriod(prev => ({ ...prev, type: 'monthly', month: currentMonth }));
    } else {
      setPeriod(prev => ({ type: 'yearly', year: currentYear }));
    }
  }, [reportType, currentMonth, currentYear]);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (reportData.length === 0) {
      customToast.error('Error', 'No data to export');
      return;
    }

    setExporting(format);
    try {
      switch (format) {
        case 'csv':
          exportReportToCSV(reportData, period);
          break;
        case 'excel':
          exportReportToExcel(reportData, period);
          break;
        case 'pdf':
          exportReportToPDF(reportData, period);
          break;
      }

      customToast.success('Success', `Report exported to ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Error exporting report:', error);
      customToast.error('Error', `Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
    }
  };

  // Report column headers
  const reportColumns = [
    'Protocol Code',
    'Protocol Title',
    'Names of Researcher(s)/Investigator(s)',
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

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6 space-y-6">
        <LoadingSkeleton className="h-10 w-64 rounded-md" />
        <div className="grid gap-4 md:grid-cols-2">
          <LoadingSkeleton className="h-64 w-full rounded-xl" />
          <LoadingSkeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
              REC Reports
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate monthly and yearly REC reports in various formats
            </p>
          </div>
        </div>
      </div>

      {/* Report Type and Period Selector with Export Buttons */}
      <div className="rounded-xl border border-[#036635]/10 dark:border-[#FECC07]/20 bg-gradient-to-br from-background to-[#036635]/5 dark:to-[#FECC07]/10 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <div className="space-y-4">
          {/* Report Type and Period in one row */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Report Type</Label>
              <Select
                value={reportType}
                onValueChange={(value) => setReportType(value as ReportType)}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="yearly">Yearly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === 'monthly' ? (
              <>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Month</Label>
                  <Select
                    value={period.month?.toString() || ''}
                    onValueChange={(value) => setPeriod(prev => ({ ...prev, month: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Year</Label>
                  <Select
                    value={period.year.toString()}
                    onValueChange={(value) => setPeriod(prev => ({ ...prev, year: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div>
                <Label className="text-sm font-medium mb-2 block">Year</Label>
                <Select
                  value={period.year.toString()}
                  onValueChange={(value) => setPeriod({ type: 'yearly', year: parseInt(value) })}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
              <Calendar className="h-4 w-4" />
              <span>
                Total: <span className="font-semibold text-foreground">{protocols.length}</span>
              </span>
            </div>
          </div>

          {/* Export Buttons - 3 columns */}
          <div className="pt-4 border-t border-[#036635]/10 dark:border-[#FECC07]/20">
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => handleExport('csv')}
                disabled={exporting !== null || reportData.length === 0}
                className="w-full justify-start"
                variant="outline"
              >
                {exporting === 'csv' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                CSV
              </Button>
              
              <Button
                onClick={() => handleExport('excel')}
                disabled={exporting !== null || reportData.length === 0}
                className="w-full justify-start"
                variant="outline"
              >
                {exporting === 'excel' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>
              
              <Button
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null || reportData.length === 0}
                className="w-full justify-start"
                variant="outline"
              >
                {exporting === 'pdf' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="rounded-xl border border-[#036635]/10 dark:border-[#FECC07]/20 bg-gradient-to-br from-background to-[#036635]/5 dark:to-[#FECC07]/10 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-1">Report Preview</h2>
          <p className="text-sm text-muted-foreground">
            Preview of protocols that will be exported ({reportData.length} protocols)
          </p>
        </div>
        {reportData.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No protocols found for the selected period.</p>
          </div>
        ) : (
          <div className="rounded-md border border-[#036635]/10 dark:border-[#FECC07]/20 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#036635]/5 dark:bg-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20">
                  {reportColumns.map((column, idx) => (
                    <TableHead key={idx} className="font-semibold text-[#036635] dark:text-[#FECC07] whitespace-nowrap">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.slice(0, 10).map((data, idx) => (
                  <TableRow key={idx} className="hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10">
                    <TableCell className="max-w-xs truncate">{data.protocolCode}</TableCell>
                    <TableCell className="max-w-xs truncate">{data.protocolTitle}</TableCell>
                    <TableCell className="max-w-xs truncate">{data.researcherNames}</TableCell>
                    <TableCell>{data.funding}</TableCell>
                    <TableCell className="max-w-xs truncate">{data.researchType}</TableCell>
                    <TableCell>{data.dateReceived}</TableCell>
                    <TableCell>{data.reviewType}</TableCell>
                    <TableCell>{data.meetingDate || ''}</TableCell>
                    <TableCell>{data.primaryReviewerName || ''}</TableCell>
                    <TableCell>{data.decision}</TableCell>
                    <TableCell>{data.decisionDate || ''}</TableCell>
                    <TableCell>{data.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {reportData.length > 10 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Showing first 10 of {reportData.length} protocols. All protocols will be included in the export.
          </p>
        )}
      </div>
    </div>
  );
}