"use client"

import { SectionCards } from '@/components/rec/chairperson/components/cards';
import { ChartAreaInteractive } from '@/components/rec/chairperson/components/chart';
import { ProtocolCharts } from '@/components/rec/chairperson/components/protocol';
import { DataTable } from '@/components/rec/chairperson/components/table';

export default function Dashboard() {
  return (
    <div className="flex flex-col w-full h-full overflow-y-auto p-2 sm:p-4 md:p-6">
      <div className="@container/main flex flex-col gap-3 sm:gap-4 md:gap-6 w-full max-w-full">
        {/* Cards with fade-in animation */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <SectionCards />
        </div>
        
        {/* Charts with staggered animation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-150 min-w-0">
            <ProtocolCharts />
          </div>
          <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-300 min-w-0">
            <ChartAreaInteractive />
          </div>
        </div>
        
        {/* Table with fade-in animation */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-450 min-w-0">
          <DataTable />
        </div>
      </div>
    </div>
  );
}
