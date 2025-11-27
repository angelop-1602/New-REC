import { Calendar, Check, Home, Inbox, Archive, Settings, Users, Clock, FileSearch, UserCheck, MessageSquare, ChartColumn } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items organized by category
const menuCategories = [
  {
    label: "General",
    items: [
      {
        title: "Dashboard",
        url: "/rec/chairperson",
        icon: Home,
      },
      {
        title: "Analytics",
        url: "/rec/chairperson/analytics",
        icon: ChartColumn,
      },
      {
        title: "Messages",
        url: "/rec/chairperson/messages",
        icon: MessageSquare,
      },
      {
        title: "Calendar",
        url: "/rec/chairperson/calendar",
        icon: Calendar,
      },
      {
        title: "Reviewers",
        url: "/rec/chairperson/reviewers",
        icon: UserCheck,
      },
      {
        title: "Members",
        url: "/rec/chairperson/rec-members",
        icon: Users,
      },
    ],
  },
  {
    label: "Protocols",
    items: [
      {
        title: "Pending",
        url: "/rec/chairperson/pending-protocols",
        icon: Clock,
      },
      {
        title: "Accepted",
        url: "/rec/chairperson/accepted-protocols",
        icon: Inbox,
      },
      {
        title: "Under Review",
        url: "/rec/chairperson/under-review-protocols",
        icon: FileSearch,
      },
      {
        title: "Approved",
        url: "/rec/chairperson/approved-protocols",
        icon: Check,
      },
      {
        title: "Archived",
        url: "/rec/chairperson/archived-protocols",
        icon: Archive,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "Settings",
        url: "/rec/chairperson/settings",
        icon: Settings,
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-[#036635]/10 dark:border-[#FECC07]/20">
      <SidebarHeader className="flex flex-col items-center justify-center p-4 border-b border-[#036635]/10 dark:border-[#FECC07]/20 bg-gradient-to-b from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 animate-in fade-in slide-in-from-left-4 duration-500">
        <Image
          src="/SPUP-Logo-with-yellow.png"
          alt="SPUP Logo"
          width={220}
          height={220}
          priority
          className="w-auto h-40 object-contain animate-in fade-in zoom-in-95 duration-500 delay-150"
        />
        <div className="flex flex-col items-center gap-1 mt-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">SPUP</span>
          <span className="text-sm font-bold text-[#036635] dark:text-[#FECC07] text-center">Research Ethics Committee</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="animate-in fade-in slide-in-from-left-4 duration-500 delay-300">
        {menuCategories.map((category, categoryIndex) => (
          <SidebarGroup key={category.label} className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${(categoryIndex + 1) * 100}ms` }}>
            <SidebarGroupLabel className="text-[#036635] dark:text-[#FECC07] font-semibold px-2">
              {category.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item, itemIndex) => {
                  const isActive = pathname === item.url || (item.url !== "/rec/chairperson" && pathname.startsWith(item.url));
                  const Icon = item.icon;
                  
                  return (
                    <SidebarMenuItem key={item.title} className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${(categoryIndex * 100) + (itemIndex * 50)}ms` }}>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive}
                        className={`
                          transition-all duration-300 hover:scale-105
                          ${isActive 
                            ? 'bg-gradient-to-r from-[#036635]/10 to-[#036635]/5 dark:from-[#FECC07]/20 dark:to-[#FECC07]/10 border-l-4 border-[#036635] dark:border-[#FECC07] text-[#036635] dark:text-[#FECC07] font-semibold shadow-sm' 
                            : 'hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 text-muted-foreground hover:text-[#036635] dark:hover:text-[#FECC07]'
                          }
                        `}
                      >
                        <Link href={item.url} className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-[#036635] dark:text-[#FECC07]' : ''}`} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}