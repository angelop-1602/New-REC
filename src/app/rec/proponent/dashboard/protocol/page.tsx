"use client";
import CustomBanner from "@/components/rec/proponent/application/components/protocol/banner";
import ProtocolInformation from "@/components/rec/proponent/application/components/protocol/information";
// ProtocolDocument component removed - using ProtocolOverview instead
import ProtocolDecision from "@/components/rec/proponent/application/components/protocol/decision";
import { ProtocolReports } from "@/components/rec/proponent/application/components/protocol/report";
import Footer from "@/components/rec/proponent/application/footer";
import GlobalBackButton from "@/components/ui/global-back-button";

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
      {/* Global Back Button */}
      <div className="w-full max-w-7xl mb-4">
        <GlobalBackButton />
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
            {/* ProtocolDocument component removed - using ProtocolOverview in [id]/page.tsx instead */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-center">
                Document management is now handled in the individual protocol view.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
