import * as React from "react"
import {
  IconChartPie,
  IconDashboard,
  IconWallet,
  IconReport,
  IconSettings,
  IconRobot,
} from "@tabler/icons-react"
import { Link } from "react-router-dom"
import { NavMain } from "@/components/ui/Dashboard_UI/nav-main"
import { NavSecondary } from "@/components/ui/Dashboard_UI/nav-secondary"
import { NavUser } from "@/components/ui/Dashboard_UI/nav-user"

import logo from "@/assets/Logo_white.png"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/Dashboard_UI/sidebar"

import { useAuth } from "@/components/hooks/use-auth"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const data = {
    user: {
      name: user?.displayName || "User",
      email: user?.email || "",
      avatar:
        user?.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user?.displayName || user?.email || "User"
        )}&background=000&color=fff`
    },

    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Transaction",
        url: "/dashboard/transactions",
        icon: IconWallet,
      },
      {
        title: "Budget",
        url: "/dashboard/budget",
        icon: IconChartPie,
      },
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: IconReport,
      },
      {
        title: "AI Assistant",
        url: "/dashboard/ai",
        icon: IconRobot,
      },
    ],

    navSecondary: [
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: IconSettings,
      },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="p-1.5">
              <Link to="/dashboard" className="flex items-center gap-2">
                <img
                  src={logo}
                  className="w-9 h-9"
                  alt="FinEase Logo"
                />

                <span className="text-xl font-bold">
                  Fin<span className="font-semibold text-white/60">Ease</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
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