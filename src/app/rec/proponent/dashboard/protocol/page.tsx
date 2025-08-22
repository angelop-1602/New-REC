"use client";
import CustomBreadcrumbs from "@/components/ui/custom/breadcrum";
import CustomBanner from "@/components/rec/proponent/application/components/protocol/banner";
import ProtocolInformation from "@/components/rec/proponent/application/components/protocol/information";
import ProtocolDocument from "@/components/rec/proponent/application/components/protocol/document";
import ProtocolDecision from "@/components/rec/proponent/application/components/protocol/decision";
import { ProtocolReports } from "@/components/rec/proponent/application/components/protocol/report";
import Footer from "@/components/rec/proponent/application/footer";

export default function Page() {
  const progressReports = [
    {
      reportDate: new Date(),
      formUrl: "/downloads/progress-report-1.pdf",
      status: "pending" as const,
    },
  ];
  const finalReport = {
    submittedDate: new Date(),
    formUrl: "/downloads/final-report.pdf",
    status: "pending" as const,
  };
  const archiving = {
    date: new Date(),
    notificationUrl: "/downloads/archiving-notification.pdf",
  };
  const isApproved = false;
  const isCompleted = false;

  return (
    <div className="min-h-screen pt-16 lg:pt-20 w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-10">
      {/* Breadcrumbs */}
      <div className="w-full max-w-7xl mb-4">
        <CustomBreadcrumbs />
      </div>

      {/* Protocol Banner */}
      <div className="w-full max-w-7xl mb-6">
        <CustomBanner />
      </div>

      {/* Decision Alert (if any) */}
      <div className="w-full max-w-7xl mb-6">
        <ProtocolDecision />
      </div>
      <div className="w-full max-w-7xl mb-6">
        <ProtocolReports
          progressReports={progressReports}
          finalReport={finalReport}
          archiving={archiving}
          onSubmitProgressReport={() => {}}
          onSubmitFinalReport={() => {}}
          isApproved={isApproved}
          isCompleted={isCompleted}
        />
      </div>
      {/* Main Content Grid */}
      <div className="w-full max-w-7xl space-y-6">
        {/* Information and Documents - Two Column Layout on Large Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ProtocolInformation />
          </div>
          <div className="space-y-6">
            <ProtocolDocument />
          </div>
        </div>
      </div>
    </div>
  );
}
