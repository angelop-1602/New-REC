import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppTopbar() {
  return (
    <div className="flex items-center justify-between p-4 shadow-xl w-full">
      <SidebarTrigger />
    </div>
  )
}