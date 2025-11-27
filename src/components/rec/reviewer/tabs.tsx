import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReviewerTable from './table'

interface ReviewerTabsProps {
  assignedProtocols: any[];
  onProtocolAction: (protocolId: string, action: string) => void;
}

export default function ReviewerTabs({ assignedProtocols, onProtocolAction }: ReviewerTabsProps) {
  // Ensure assignedProtocols is always an array to prevent filter errors
  const protocols = assignedProtocols || [];
  
  // Categorize protocols by status
  // "Submitted Protocols" = protocols that need review (not started or in progress)
  const submittedProtocols = protocols.filter(p => 
    p.status === 'pending' || p.status === 'draft' || !p.status
  );
  const reSubmittedProtocols = protocols.filter(p => p.status === 'resubmitted');
  const returnedProtocols = protocols.filter(p => p.status === 'returned');
  // "Reviewed Protocols" = protocols with completed/submitted assessments
  const reviewedProtocols = protocols.filter(p => 
    p.status === 'completed' || p.status === 'submitted'
  );
  const approvedProtocols = protocols.filter(p => p.status === 'approved');
  const reassignedProtocols = protocols.filter(p => p.status === 'reassigned');

  const tabs = [
    {
      name: 'Submitted Protocols',
      value: 'submittedProtocols',
      count: submittedProtocols.length,
      protocols: submittedProtocols,
    },
    {
      name: 'Returned Reviews',
      value: 'returnedProtocols',
      count: returnedProtocols.length,
      protocols: returnedProtocols,
    },
    {
      name: 'Re-Submitted Protocols',
      value: 'reSubmittedProtocols',
      count: reSubmittedProtocols.length,
      protocols: reSubmittedProtocols,
    },
    {
      name: 'Reviewed Protocols',
      value: 'reviewedProtocols',
      count: reviewedProtocols.length,
      protocols: reviewedProtocols,
    },
    {
      name: 'Approved Protocols',
      value: 'approvedProtocols',
      count: approvedProtocols.length,
      protocols: approvedProtocols,
    },
    {
      name: 'Reassigned',
      value: 'reassignedProtocols',
      count: reassignedProtocols.length,
      protocols: reassignedProtocols,
    },
  ]

  return (
    <div className='w-full'>
      <Tabs defaultValue='submittedProtocols' className='flex-row'>
        <TabsList className='h-full flex-col gap-1.5 bg-muted border-[#036635]/10 dark:border-[#FECC07]/20'>
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='flex w-full items-center justify-start gap-1.5 px-2.5 sm:px-3 data-[state=active]:bg-[#036635]/10 dark:data-[state=active]:bg-[#FECC07]/20 data-[state=active]:text-[#036635] dark:data-[state=active]:text-[#FECC07] data-[state=active]:border-[#036635] dark:data-[state=active]:border-[#FECC07] hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 hover:text-[#036635] dark:hover:text-[#FECC07]'
            >
              {tab.name}
              <Badge className='h-5 min-w-5 rounded-full px-1 tabular-nums bg-[#036635]/10 dark:bg-[#FECC07]/20 text-[#036635] dark:text-[#FECC07] border-[#036635]/20 dark:border-[#FECC07]/30'>{tab.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="flex flex-col gap-4 w-full">    
            <ReviewerTable 
              protocols={tab.protocols} 
              tabType={tab.value}
              onProtocolAction={onProtocolAction}
            />
          </TabsContent>
        ))}

      </Tabs>
    </div>
  )
}
