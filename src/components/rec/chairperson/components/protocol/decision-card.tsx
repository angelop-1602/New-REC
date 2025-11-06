import { DecisionCard } from "@/components/ui/decision-card";

interface ChairpersonDecisionCardProps {
  protocolId: string;
  collection?: 'accepted' | 'approved';
  className?: string;
  onDecisionUpdate?: () => void;
}

export function ChairpersonDecisionCard({ 
  protocolId, 
  collection = 'accepted',
  className,
  onDecisionUpdate
}: ChairpersonDecisionCardProps) {
  return (
    <DecisionCard 
      protocolId={protocolId}
      collection={collection}
      userRole="chairperson"
      className={className}
      onDecisionUpdate={onDecisionUpdate}
    />
  );
}
