import * as React from "react"
import { usePage } from "@inertiajs/react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }) {
  // get auth user with roles from Laravel share
  const { auth } = usePage().props
  const user = auth?.user
  const roles = user?.roles || []

  // role-based nav
  const navMain = []

  if (roles.includes("admin")) {
    navMain.push({
      title: "Admin Dashboard",
      url: route("admin.dashboard"), // use your named Laravel route
      icon: SquareTerminal,
      items: [
        { title: "Users", url: route("admin.view_users") },
        { title: "Settings", url: route("admin.requesting") },
      ],
    })
  }

  if (roles.includes("manager")) {
    navMain.push({
      title: "Manager Panel",
      url: route("manager.dashboard"),
      icon: Bot,
      items: [
        { title: "Reports", url: route("manager.reports") },
        { title: "Approvals", url: route("manager.approvals") },
      ],
    })
  }

  if (roles.includes("user")) {
    navMain.push({
      title: "User Dashboard",
      url: route("user.dashboard"),
      icon: BookOpen,
      items: [
        { title: "Profile", url: route("user.profile") },
        { title: "Orders", url: route("user.orders") },
      ],
    })
  }

  const navSecondary = [
    { title: "Support", url: "#", icon: LifeBuoy },
    { title: "Feedback", url: "#", icon: Send },
  ]

  const projects = [
    { name: "Design Engineering", url: "#", icon: Frame },
    { name: "Sales & Marketing", url: "#", icon: PieChart },
    { name: "Travel", url: "#", icon: Map },
  ]

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center bg-indigo-700 rounded-lg text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs">{roles.join(", ")}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
