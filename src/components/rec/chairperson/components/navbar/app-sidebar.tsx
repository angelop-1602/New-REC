import { Calendar, Check, Home, Inbox, Search, Settings, User2 } from "lucide-react"
import { UserAvatarProfile } from "./user-avatar-profile"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/rec/chairperson",
    icon: Home,
  },
  {
    title: "Submitted Protocols",
    url: "/rec/chairperson/submitted-protocols",
    icon: Inbox,
  },
  {
    title: "Approved Protocols",
    url: "/rec/chairperson/approved-protocols",
    icon: Check,
  },
  {
    title: "Archive Protocols",
    url: "/rec/chairperson/archive-protocols",
    icon: Search,
  },
  {
    title: "Settings",
    url: "/rec/chairperson/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> 
      </SidebarContent>
      <SidebarFooter>
        <UserAvatarProfile user={null} /> 
        </SidebarFooter> 
    </Sidebar>
  )
}