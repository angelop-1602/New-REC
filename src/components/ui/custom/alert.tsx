import { CheckCircleIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface CustomAlertProps {
  title: string
  description: string
  variant:  'warning' | 'info' | 'success'
  className?: string
  icon?: React.ReactNode
}

export const CustomAlert = ({ title, description, variant, className, icon }: CustomAlertProps) => {
  return (
    <Alert className={cn(className, variant === 'warning' ? 'bg-destructive/10 text-destructive border-none' : variant === 'info' ? 'border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400' : variant === 'success' ? 'border-none bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400' : '')}>
      {icon === 'warning' && <TriangleAlertIcon />}
      {icon === 'info' && <InfoIcon />}
      {icon === 'success' && <CheckCircleIcon />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className='text-destructive/80'>
        {description}
      </AlertDescription>
    </Alert>
  )
}
