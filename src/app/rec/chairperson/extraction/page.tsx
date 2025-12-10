"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/ui/loading';
import { Download, Filter, FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import { ExtractionFilters, ExtractionStats } from '@/types/extraction.types';
import { fetchProtocolsForExtraction, getExtractionStatistics, transformProtocolToExportData } from '@/lib/services/extraction/dataExtractionService';
import { ChairpersonProtocol } from '@/types';
import { customToast } from '@/components/ui/custom/toast';

export default function ExtractionPage() {
  const [loading, setLoading] = useState(true);
  const [protocols, setProtocols] = useState<ChairpersonProtocol[]>([]);
  const [stats, setStats] = useState<ExtractionStats | null>(null);
  const [filters, setFilters] = useState<ExtractionFilters>(() => {
    // Default: Last 3 months
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    return {
      dateRange: {
        start,
        end,
        field: 'submission',
      },
    };
  });

  // Load data when filters change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [protocolsData, statsData] = await Promise.all([
          fetchProtocolsForExtraction(filters),
          getExtractionStatistics(filters),
        ]);
        setProtocols(protocolsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading extraction data:', error);
        customToast.error('Error', 'Failed to load protocol data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    customToast.info('Coming Soon', `Export to ${format.toUpperCase()} will be available in Phase 2`);
  };

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
              Data Extraction
            </h1>
            <p className="text-muted-foreground mt-2">
              Extract protocol data in various formats for reporting and analysis
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Protocols
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
                {stats.totalProtocols}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With OR Number
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
                {stats.withOrNumber}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
                {stats.byStatus.approved}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#036635] dark:text-[#FECC07]">
                {stats.byStatus.pending}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        {/* Filters Panel - Placeholder */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#036635] dark:text-[#FECC07]" />
              Filters
            </CardTitle>
            <CardDescription>
              Configure extraction filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Filter panel will be implemented in the next step.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Currently showing: {protocols.length} protocols
            </p>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-[#036635] dark:text-[#FECC07]" />
              Export Options
            </CardTitle>
            <CardDescription>
              Choose export format and configure options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <button
                onClick={() => handleExport('csv')}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-[#036635] dark:hover:border-[#FECC07] hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all cursor-pointer"
              >
                <FileText className="h-8 w-8 text-[#036635] dark:text-[#FECC07] mb-2" />
                <span className="font-medium">CSV</span>
                <span className="text-xs text-muted-foreground">Comma-separated values</span>
              </button>
              
              <button
                onClick={() => handleExport('excel')}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-[#036635] dark:hover:border-[#FECC07] hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-8 w-8 text-[#036635] dark:text-[#FECC07] mb-2" />
                <span className="font-medium">Excel</span>
                <span className="text-xs text-muted-foreground">.xlsx format</span>
              </button>
              
              <button
                onClick={() => handleExport('pdf')}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-[#036635] dark:hover:border-[#FECC07] hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all cursor-pointer"
              >
                <FileDown className="h-8 w-8 text-[#036635] dark:text-[#FECC07] mb-2" />
                <span className="font-medium">PDF</span>
                <span className="text-xs text-muted-foreground">Formatted report</span>
              </button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Export functionality will be fully implemented in Phase 2.
                Currently, you can view the filtered data and statistics above.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table - Placeholder */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-450">
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>
            Preview of protocols that will be exported ({protocols.length} protocols)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {protocols.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No protocols found matching the current filters.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Preview table will be implemented in the next step.
              </p>
              <div className="text-xs text-muted-foreground">
                Sample: {protocols.slice(0, 3).map(p => p.title || 'Untitled').join(', ')}
                {protocols.length > 3 && ` ... and ${protocols.length - 3} more`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

