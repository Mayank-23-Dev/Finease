// src/components/ui/Settings_UI/settings-sidebar.tsx
"use client"

import { User, Wallet, Shield, AlertTriangle, Download, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

export const NAV_ITEMS = [
    { id: "profile",   label: "Profile",      icon: User          },
    { id: "financial", label: "Financial",    icon: Wallet        },
    { id: "security",  label: "Security",     icon: Shield        },
    { id: "danger",    label: "Danger Zone",  icon: AlertTriangle },
] as const

export type TabId = (typeof NAV_ITEMS)[number]["id"]

// ---------------------------------------------------------------------------
// Install button hook — works for both sidebar and profile panel
// ---------------------------------------------------------------------------
export function useInstallPrompt() {
    const [prompt,    setPrompt]    = useState<any>(null)
    const [installed, setInstalled] = useState(false)
    const [isIOS,     setIsIOS]     = useState(false)

    useEffect(() => {
        // Already running as installed PWA
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setInstalled(true)
            return
        }

        // Detect iOS (no beforeinstallprompt support)
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
        setIsIOS(ios)

        const handler = (e: Event) => {
            e.preventDefault()
            setPrompt(e)
        }
        window.addEventListener("beforeinstallprompt", handler)
        window.addEventListener("appinstalled", () => setInstalled(true))
        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const install = async () => {
        if (!prompt) return
        prompt.prompt()
        const { outcome } = await prompt.userChoice
        if (outcome === "accepted") setInstalled(true)
        setPrompt(null)
    }

    return {
        canInstall: !!prompt && !installed,   // Chrome/Android native prompt ready
        installed,
        isIOS,                                 // show manual iOS instructions
        showButton: !installed,                // always show unless already installed
        install,
    }
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
interface SettingsSidebarProps {
    activeTab:    TabId
    onTabChange:  (id: TabId) => void
    displayName?: string
    email?:       string
    avatarUrl?:   string
    initials?:    string
}

export function SettingsSidebar({
    activeTab, onTabChange, displayName, email, avatarUrl, initials,
}: SettingsSidebarProps) {
    const { canInstall, installed, isIOS, showButton, install } = useInstallPrompt()

    return (
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-white/[0.06] py-8 px-3 gap-0.5">

            <div className="px-3 mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">Account</p>
            </div>

            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const active   = activeTab === id
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
                            }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-all shrink-0
                            ${active
                                ? isDanger ? "bg-red-500/20" : "bg-white/[0.10]"
                                : isDanger ? "bg-transparent group-hover:bg-red-500/[0.08]" : "bg-transparent group-hover:bg-white/[0.05]"
                            }`}
                        >
                            <Icon className={`size-3.5
                                ${active
                                    ? isDanger ? "text-red-400" : "text-white"
                                    : isDanger ? "text-red-400/60 group-hover:text-red-400" : "text-white/40"
                                }`}
                            />
                        </div>

                        <span className="font-medium">{label}</span>

                        {active && (
                            <div className={`ml-auto size-1.5 rounded-full ${isDanger ? "bg-red-400" : "bg-white/40"}`} />
                        )}
                    </button>
                )
            })}

            {/* ── Install App button — always visible unless already installed ── */}
            {showButton && (
                <div className="mt-auto pt-6 px-1">
                    <div className="h-px bg-white/[0.06] mb-4" />

                    {canInstall ? (
                        /* Chrome/Edge/Android: native one-click install */
                        <button
                            onClick={install}
                            className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                bg-white/[0.04] border border-white/[0.08]
                                hover:bg-white/[0.08] hover:border-white/[0.16]
                                transition-all duration-150 cursor-pointer text-left"
                        >
                            <div className="p-1.5 rounded-lg bg-white/[0.06] group-hover:bg-white/[0.12] transition-all shrink-0">
                                <Download className="size-3.5 text-white/50 group-hover:text-white/80 transition-colors" />
                            </div>
                            <div>
                                <p className="text-[12px] font-semibold text-white/70 group-hover:text-white transition-colors">Install App</p>
                                <p className="text-[10px] text-white/30 leading-tight">Add to home screen</p>
                            </div>
                        </button>
                    ) : isIOS ? (
                        /* iOS Safari: manual instructions */
                        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <Download className="size-3.5 text-white/30 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[12px] font-semibold text-white/50">Install App</p>
                                <p className="text-[10px] text-white/25 leading-snug mt-0.5">
                                    Tap Share then<br />"Add to Home Screen"
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Chrome: prompt not fired yet — show disabled state */
                        <button
                            onClick={() => {
                                // Fallback: open browser's install menu via keyboard shortcut hint
                                alert("To install: click the install icon (⊕) in your browser address bar, or use browser menu → Install FinEase")
                            }}
                            className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                bg-white/[0.03] border border-white/[0.06]
                                hover:bg-white/[0.05] hover:border-white/[0.10]
                                transition-all duration-150 cursor-pointer text-left"
                        >
                            <div className="p-1.5 rounded-lg bg-white/[0.04] shrink-0">
                                <Download className="size-3.5 text-white/30" />
                            </div>
                            <div>
                                <p className="text-[12px] font-semibold text-white/40">Install App</p>
                                <p className="text-[10px] text-white/20 leading-tight">Click ⊕ in address bar</p>
                            </div>
                        </button>
                    )}
                </div>
            )}

            {/* Already installed state */}
            {installed && (
                <div className="mt-auto pt-6 px-1">
                    <div className="h-px bg-white/[0.06] mb-4" />
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/[0.15]">
                        <CheckCircle className="size-3.5 text-emerald-400 shrink-0" />
                        <div>
                            <p className="text-[12px] font-semibold text-emerald-400">App Installed</p>
                            <p className="text-[10px] text-white/30 leading-tight">FinEase is on your device</p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    )
}