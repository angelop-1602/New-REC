'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, Upload, Archive, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React from "react";

const reportTabs = [
  { name: "Progress Reports", value: "progress", icon: Clock },
  { name: "Final Report", value: "final", icon: FileCheck },
  { name: "Archive", value: "archive", icon: Archive },
];

interface ReportsSectionProps {
  progressReports: Array<{
    reportDate: Date;
    formUrl: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  finalReport?: {
    submittedDate: Date;
    formUrl: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  archiving?: {
    date: Date;
    notificationUrl: string;
  };
  onSubmitProgressReport: () => void;
  onSubmitFinalReport: () => void;
  isApproved: boolean; // Whether the protocol is approved and can accept progress reports
  isCompleted: boolean; // Whether all research activities are completed
  isChairpersonView?: boolean; // Whether this is being viewed by chairperson (view-only)
  onGenerateArchiveNotification?: () => void; // Chairperson: generate archiving notification
  onUploadArchiveNotification?: (file: File) => void; // Chairperson: upload archiving notification
  onDownloadProgressForm?: () => void; // Download blank progress report form
  onDownloadFinalForm?: () => void; // Download blank final report form
}

function getStatusBadge(status: 'pending' | 'approved' | 'rejected') {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
    case 'approved':
      return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Needs Revision</Badge>;
  }
}

export function ProtocolReports({
  progressReports,
  finalReport,
  archiving,
  onSubmitProgressReport,
  onSubmitFinalReport,
  isApproved,
  isCompleted,
  isChairpersonView = false,
  onGenerateArchiveNotification,
  onUploadArchiveNotification,
  onDownloadProgressForm,
  onDownloadFinalForm,
}: ReportsSectionProps) {
  return (
    <Card className="w-full mx-auto shadow-sm border border-muted-foreground/10 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold text-primary">Research Reports</CardTitle>
      </CardHeader>
      
      <CardContent className="max-h-[450px] sm:max-h-[500px] lg:max-h-[550px] overflow-y-auto">
        <Tabs defaultValue="progress" className="w-full" orientation="horizontal">
          {/* Mobile-friendly tabs */}
          <TabsList className="grid grid-cols-3 mb-4 bg-background w-full h-auto p-1">
            {reportTabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 py-2 sm:px-3 text-xs sm:text-sm"
              >
                <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden text-[10px] leading-tight text-center">{tab.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Progress Reports */}
          <TabsContent value="progress" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h3 className="text-base sm:text-lg font-semibold">Progress Reports</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                {onDownloadProgressForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={onDownloadProgressForm}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download Form
                  </Button>
                )}
                {isApproved && !isCompleted && !isChairpersonView && (
                  <Button 
                    onClick={onSubmitProgressReport}
                    className="w-full sm:w-auto"
                    size="sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Progress Report
                  </Button>
                )}
              </div>
            </div>
            
            {progressReports.length > 0 ? (
              <div className="space-y-3">
                {progressReports.map((report, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">Progress Report #{index + 1}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Submitted on {report.reportDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                      {getStatusBadge(report.status)}
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                        <a href={report.formUrl} target="_blank" rel="noopener noreferrer">
                          <FileCheck className="w-4 h-4 mr-2" />
                          View Report
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No progress reports submitted yet.</p>
              </div>
            )}
          </TabsContent>

          {/* Final Report */}
          <TabsContent value="final" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h3 className="text-base sm:text-lg font-semibold">Final Report</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                {onDownloadFinalForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={onDownloadFinalForm}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download Form
                  </Button>
                )}
                {isApproved && !finalReport && !isChairpersonView && (
                  <Button 
                    onClick={onSubmitFinalReport}
                    className="w-full sm:w-auto"
                    size="sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Final Report
                  </Button>
                )}
              </div>
            </div>
            
            {finalReport ? (
              <div className="p-3 sm:p-4 border rounded-lg bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base">Final Research Report</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Submitted on {finalReport.submittedDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    {getStatusBadge(finalReport.status)}
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                      <a href={finalReport.formUrl} target="_blank" rel="noopener noreferrer">
                        <FileCheck className="w-4 h-4 mr-2" />
                        View Report
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No final report submitted yet.</p>
              </div>
            )}
          </TabsContent>

          {/* Archive */}
          <TabsContent value="archive" className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Archive Status</h3>
            {archiving ? (
              <div className="p-3 sm:p-4 border rounded-lg bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base">Protocol Archived</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Archived on {archiving.date.toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <a href={archiving.notificationUrl} target="_blank" rel="noopener noreferrer">
                      <Archive className="w-4 h-4 mr-2" />
                      View Archive Notification
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm text-center">
                  {finalReport?.status === 'approved'
                    ? 'Waiting for archive notification from REC Chair'
                    : 'Protocol will be archived after final report approval'}
                </p>
                {isChairpersonView && finalReport?.status === 'approved' && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                    <Button size="sm" onClick={onGenerateArchiveNotification} className="w-full sm:w-auto">
                      <FileCheck className="w-4 h-4 mr-2" />
                      Generate Archiving Notification
                    </Button>
                    <label className="w-full sm:w-auto">
                      <input
                        type="file"
                        accept=".doc,.docx,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && onUploadArchiveNotification) onUploadArchiveNotification(file);
                          e.currentTarget.value = '';
                        }}
                      />
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                        <span>
                          <Upload className="w-4 h-4 mr-2" /> Upload Notification
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
