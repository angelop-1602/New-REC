import { Calendar, Check, Home, Inbox, Archive, Settings, User2, Users } from "lucide-react"
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
    title: "Archived Protocols",
    url: "/rec/chairperson/archived-protocols",
    icon: Archive,
  },
  {
    title: "Members",
    url: "/rec/chairperson/members",
    icon: Users,
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