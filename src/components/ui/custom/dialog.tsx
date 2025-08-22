import {
  Dialog,
  DialogContent,
  DialogTrigger
} from '@/components/ui/dialog'

interface CustomDialogProps {
  title: string
  description: string
  children: React.ReactNode
  trigger: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const CustomDialog = ({ children, trigger, open, onOpenChange }: CustomDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className='data-[state=open]:!zoom-in-0 data-[state=open]:duration-600 sm:max-w-[425px]'>
          {children}
        </DialogContent>
      </form>
    </Dialog>
  )
}
