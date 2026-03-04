import * as React from "react"
import {
  IconChartPie,
  IconDashboard,
  IconWallet,
  IconReport,
  IconSettings,
  IconRobot,
} from "@tabler/icons-react"

import { NavMain } from "@/components/ui/Dashboard_UI/nav-main"
import { NavSecondary } from "@/components/ui/Dashboard_UI/nav-secondary"
import { NavUser } from "@/components/ui/Dashboard_UI/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/Dashboard_UI/sidebar"

const data = {
  user: {
    name: "Mayank Dev",
    email: "dmayank4545@gmail.com",
    avatar: "/src/assets/profile.jpg",
  },

  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Transaction",
      url: "/transaction",
      icon: IconWallet,
    },
    {
      title: "Budget",
      url: "/budget",
      icon: IconChartPie,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: IconReport,
    },
    {
      title: "AI Assistant",
      url: "/ai",
      icon: IconRobot,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="p-1.5">
              <a href="/dashboard" className="flex items-center gap-2">
                <img
                  src="/src/assets/Logo_white.png"
                  className="w-9 h-9"
                />

                <span className="text-xl font-bold">
                  Fin<span className="font-semibold text-white/60">Ease</span>
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      {/* User */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}