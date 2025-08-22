import { Badge } from "@/components/ui/badge";
import {
  FileClock,
  Upload,
  Search,
  AlertCircle,
  CornerUpLeft,
  CheckCircle2,
  XCircle,
  TimerOff,
  Archive,
  ShieldCheck,
} from "lucide-react";
import React from "react";

const BADGE_CONFIG = {
  "Pending Upload": {
    class: "bg-gray-100 text-gray-800 border border-gray-300",
    icon: FileClock,
  },
  "Submitted": {
    class: "bg-blue-100 text-blue-800 border border-blue-300",
    icon: Upload,
  },
  "Under Review": {
    class: "bg-indigo-100 text-indigo-800 border border-indigo-300",
    icon: Search,
  },
  "Needs Revision": {
    class: "bg-amber-100 text-amber-800 border border-amber-300",
    icon: AlertCircle,
  },
  "Resubmitted": {
    class: "bg-sky-100 text-sky-800 border border-sky-300",
    icon: CornerUpLeft,
  },
  "Approved": {
    class: "bg-green-100 text-green-800 border border-green-300",
    icon: CheckCircle2,
  },
  "Rejected": {
    class: "bg-red-100 text-red-800 border border-red-300",
    icon: XCircle,
  },
  "Expired": {
    class: "bg-rose-100 text-rose-800 border border-rose-300",
    icon: TimerOff,
  },
  "Archived": {
    class: "bg-gray-200 text-gray-800 border border-gray-300",
    icon: Archive,
  },
  "Exempted": {
    class: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    icon: ShieldCheck,
  },
} as const;

type BadgeStatus = keyof typeof BADGE_CONFIG;

interface CustomBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export const CustomBadge: React.FC<CustomBadgeProps> = ({
  status,
  className = "",
}) => {
  const config = BADGE_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      className={[
        "flex items-center gap-1 px-4 py-1 justify-center",
        "rounded-full",
        "uppercase font-bold",
        "text-xs tracking-wide",
        "shadow-md",
        config.class,
        className,
      ].join(" ")}
      title={status}
    >
      <Icon size={14} className="mr-1" />
      {status}
    </Badge>
  );
};
