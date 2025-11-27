import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays } from "lucide-react"

interface DashboardCardProps {
  title: string;
  status: string;
  date: string;
  buttonText: string;
  onViewDetails?: () => void;
  unreadCount?: number;
}

export default function DashboardCard({ title, status, date, buttonText, onViewDetails, unreadCount = 0 }: DashboardCardProps) {
  return (
    <Card className="w-full h-full flex flex-col shadow-sm border border-[#036635]/20 dark:border-[#FECC07]/30 bg-gradient-to-t from-[#036635]/5 to-card dark:from-[#FECC07]/10 dark:to-card hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group relative">
      {/* Unread Indicator - Red Dot */}
      {unreadCount > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          </div>
        </div>
      )}
      <CardHeader className="flex-shrink-0">
        <div className="space-y-3">
          <CardTitle 
            className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 group-hover:text-[#036635] dark:group-hover:text-[#FECC07] transition-colors pr-8"
            title={title}
          >
            {title}
          </CardTitle>
          <CardDescription>
            <Badge 
              variant="outline" 
              className="text-xs font-medium border-[#036635]/30 dark:border-[#FECC07]/40 bg-[#036635]/5 dark:bg-[#FECC07]/10"
            >
              {status}
            </Badge>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4 text-[#036635] dark:text-[#FECC07] flex-shrink-0" />
            <span className="font-medium truncate">{date}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full sm:w-auto border-[#036635]/30 dark:border-[#FECC07]/40 hover:bg-[#036635] hover:text-white dark:hover:bg-[#FECC07] dark:hover:text-[#036635] transition-all duration-300 flex-shrink-0"
            onClick={onViewDetails}
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
