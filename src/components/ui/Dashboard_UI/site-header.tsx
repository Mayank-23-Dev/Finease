"use client"

import { useLocation } from "react-router-dom"
import { Separator } from "@/components/ui/Dashboard_UI/separator"
import { SidebarTrigger } from "@/components/ui/Dashboard_UI/sidebar"

export function SiteHeader() {
  const location = useLocation()

  const path = location.pathname

  let title = "Dashboard"

  if (path.includes("/dashboard/settings")) {
    title = "Settings"
  } else if (path.includes("/dashboard/transaction")) {
    title = "Transaction"
  } else if (path.includes("/dashboard/budget")) {
    title = "Budget"
  } else if (path.includes("/dashboard/reports")) {
    title = "Reports"
  } else if (path.includes("/dashboard/ai")) {
    title = "AI Assistant"
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

        <div className="ml-auto flex items-center gap-2"></div>

      </div>
    </header>
  )
}