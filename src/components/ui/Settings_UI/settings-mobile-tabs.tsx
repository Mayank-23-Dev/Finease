// src/components/ui/Settings_UI/settings-mobile-tabs.tsx
"use client"

import { NAV_ITEMS, type TabId } from "./settings-sidebar"

interface SettingsMobileTabsProps {
  activeTab:   TabId
  onTabChange: (id: TabId) => void
}

export function SettingsMobileTabs({ activeTab, onTabChange }: SettingsMobileTabsProps) {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.06]
      bg-black/95 backdrop-blur-xl">
      <div className="flex">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button key={id} onClick={() => onTabChange(id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 cursor-pointer transition-all">
              <div className={`p-1.5 rounded-lg transition-all ${active ? "bg-white/[0.08]" : ""}`}>
                <Icon className={`size-4 ${active ? "text-white" : "text-white/30"}`} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wide
                ${active ? "text-white/80" : "text-white/25"}`}>
                {label.split(" ")[0]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}