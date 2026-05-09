"use client"

import { useLocation } from "react-router-dom"
import { Separator } from "@/components/ui/Dashboard_UI/separator"
import { SidebarTrigger } from "@/components/ui/Dashboard_UI/sidebar"
import { NotificationBell } from "@/components/ui/Notifications_UI/notification-bell"
import { useAuth } from "@/components/hooks/use-auth"

export function SiteHeader() {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname

  const routes: Record<string, string> = {
    "/dashboard/settings":     "Settings",
    "/dashboard/transactions":  "Transaction",
    "/dashboard/budget":       "Budget",
    "/dashboard/reports":      "Reports",
    "/dashboard/finvault":     "FinVault",
    "/dashboard/autopay":      "AutoFlow",
    "/dashboard/ai-assistant": "AI Assistant",
    "/dashboard/notifications":"Notifications",
  }

  let title = "Dashboard"
  for (const route in routes) {
    if (path.includes(route)) {
      title = routes[route]
      break
    }
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">

        <SidebarTrigger className="-ml-1" />

        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        <h1 className="text-base font-medium">{title}</h1>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell firebase_uid={user?.uid ?? ''} />
        </div>

      </div>
    </header>
  )
}