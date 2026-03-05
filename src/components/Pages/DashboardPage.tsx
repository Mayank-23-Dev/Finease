"use client"

import React from "react"
import { Outlet, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

import { AppSidebar } from "@/components/ui/Dashboard_UI/app-sidebar"
import { SiteHeader } from "@/components/ui/Dashboard_UI/site-header"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/Dashboard_UI/sidebar"

export default function DashboardPage() {

  const location = useLocation()

  const isSettings = location.pathname.includes("/dashboard/settings")

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />

      <SidebarInset>

        <SiteHeader />

        <div className="flex flex-1 flex-col overflow-hidden">

          {isSettings ? (
            // ❌ No animation for settings
            <Outlet />
          ) : (
            // ✅ Animated pages
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-1 flex-col"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          )}

        </div>

      </SidebarInset>

    </SidebarProvider>
  )
}