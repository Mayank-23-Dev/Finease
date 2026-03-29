// src/components/ui/Settings_UI/settings-sidebar.tsx
"use client"

import { User, Wallet, Shield, AlertTriangle } from "lucide-react"

export const NAV_ITEMS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "financial", label: "Financial", icon: Wallet },
    { id: "security", label: "Security", icon: Shield },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
] as const

export type TabId = (typeof NAV_ITEMS)[number]["id"]

interface SettingsSidebarProps {
    activeTab: TabId
    onTabChange: (id: TabId) => void
    displayName?: string
    email?: string
    avatarUrl?: string
    initials?: string
}

export function SettingsSidebar({
    activeTab, onTabChange, displayName, email, avatarUrl, initials,
}: SettingsSidebarProps) {
    return (
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-white/[0.06] py-8 px-3 gap-0.5">

            <div className="px-3 mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">Account</p>
            </div>

            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id
                const isDanger = id === "danger"

                return (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
        transition-all cursor-pointer w-full text-left

        ${active
                                ? isDanger
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-white/[0.07] text-white"
                                : isDanger
                                    ? "text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.05]"
                                    : "text-white/35 hover:text-white/70 hover:bg-white/[0.03]"
                            }
      `}
                    >
                        {/* Icon */}
                        <div
                            className={`p-1.5 rounded-lg transition-all shrink-0
          ${active
                                    ? isDanger
                                        ? "bg-red-500/20"
                                        : "bg-white/[0.10]"
                                    : isDanger
                                        ? "bg-transparent group-hover:bg-red-500/[0.08]"
                                        : "bg-transparent group-hover:bg-white/[0.05]"
                                }
        `}
                        >
                            <Icon
                                className={`size-3.5
            ${active
                                        ? isDanger
                                            ? "text-red-400"
                                            : "text-white"
                                        : isDanger
                                            ? "text-red-400/60 group-hover:text-red-400"
                                            : "text-white/40"
                                    }
          `}
                            />
                        </div>

                        {/* Label */}
                        <span className="font-medium">{label}</span>

                        {/* Active dot */}
                        {active && (
                            <div
                                className={`ml-auto size-1.5 rounded-full
            ${isDanger ? "bg-red-400" : "bg-white/40"}
          `}
                            />
                        )}
                    </button>
                )
            })}
        </aside>
    )
}