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
}

export default function DashboardCard({ title, status, date, buttonText, onViewDetails }: DashboardCardProps) {
  return (
    <Card className="w-full shadow-sm border border-muted-foreground/10 bg-white hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle className="text-base sm:text-lg font-semibold text-primary">
            {title}
          </CardTitle>
          <CardDescription>
            <Badge variant="outline" className="text-xs font-medium">
              {status}
            </Badge>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span className="font-medium">{date}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full sm:w-auto hover:bg-primary hover:text-white transition-colors"
            onClick={onViewDetails}
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
