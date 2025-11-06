import { DecisionCard } from "@/components/ui/decision-card";

interface ProtocolDecisionProps {
  protocolId: string;
  collection?: 'accepted' | 'approved';
}

export default function ProtocolDecision({ protocolId, collection = 'accepted' }: ProtocolDecisionProps) {
  return (
    <DecisionCard 
      protocolId={protocolId}
      collection={collection}
      userRole="proponent"
    />
  );
}
