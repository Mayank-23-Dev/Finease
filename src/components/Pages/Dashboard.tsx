import { AppSidebar } from "@/components/ui/Dashboard_UI/app-sidebar"
import { ChartAreaInteractive } from "@/components/ui/Dashboard_UI/chart-area-interactive"
import { DataTable } from "@/components/ui/Dashboard_UI/data-table"
import { SectionCards } from "@/components/ui/Dashboard_UI/section-cards"
import { SiteHeader } from "@/components/ui/Dashboard_UI/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/Dashboard_UI/sidebar"

import data from "@/app/dashboard/data.json"

export default function DashboardPage() {
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
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <SectionCards />
                            <div className="px-4 lg:px-6">
                                <ChartAreaInteractive />
                            </div>
                            <DataTable data={data} />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
