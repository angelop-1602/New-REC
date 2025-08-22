import { SectionCards } from '@/components/rec/chairperson/components/cards';
import { ChartAreaInteractive } from '@/components/rec/chairperson/components/chart';
import { ProtocolCharts } from '@/components/rec/chairperson/components/protocol';
import { DataTable } from '@/components/rec/chairperson/components/table';
import data from "./data.json"
export default async function Dashboard() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProtocolCharts />
            <ChartAreaInteractive />
          </div>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  );
}
