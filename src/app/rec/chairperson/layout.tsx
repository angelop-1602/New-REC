import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/rec/chairperson/components/navbar/app-sidebar"
import { AppTopbar } from "@/components/rec/chairperson/components/navbar/app-topbar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
        
      <main className="flex flex-col w-full">
        <AppTopbar />
        <div className="flex-1 p-4 bg-zinc-100">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}