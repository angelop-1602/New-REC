import { DecisionCard } from "@/components/ui/decision-card";

interface ReviewerDecisionCardProps {
  protocolId: string;
  collection?: 'accepted' | 'approved';
  className?: string;
}

export function ReviewerDecisionCard({ 
  protocolId, 
  collection = 'accepted',
  className
}: ReviewerDecisionCardProps) {
  return (
    <DecisionCard 
      protocolId={protocolId}
      collection={collection}
      userRole="reviewer"
      className={className}
    />
  );
}
