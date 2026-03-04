"use client"

import { type Icon } from "@tabler/icons-react"
import { useLocation, Link } from "react-router-dom"

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/Dashboard_UI/sidebar"

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: Icon
    }[]
}) {

    const location = useLocation()

    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">

                <SidebarMenu>
                    {items.map((item) => {

                        const isActive = location.pathname === item.url

                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>

                                    <Link
                                        to={item.url}
                                        className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                      ${isActive
                                                ? "bg-[#6E6E6E] text-white"
                                                : "text-white/60 hover:bg-[#6E6E6E]/60"
                                            }
                    `}
                                    >

                                        {item.icon && <item.icon className="w-5 h-5" />}

                                        <span className="text-base font-medium">
                                            {item.title}
                                        </span>

                                    </Link>

                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>

            </SidebarGroupContent>
        </SidebarGroup>
    )
}