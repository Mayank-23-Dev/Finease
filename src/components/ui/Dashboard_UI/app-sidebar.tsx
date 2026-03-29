// src/components/ui/Dashboard_UI/app-sidebar.tsx
import * as React from "react"
import {
  IconChartPie, IconDashboard, IconWallet,
  IconReport, IconSettings, IconRobot,
} from "@tabler/icons-react"
import { Link }          from "react-router-dom"
import { NavMain }       from "@/components/ui/Dashboard_UI/nav-main"
import { NavSecondary }  from "@/components/ui/Dashboard_UI/nav-secondary"
import { NavUser }       from "@/components/ui/Dashboard_UI/nav-user"
import logo              from "@/assets/Logo_white.png"
import {
  Sidebar, SidebarContent, SidebarFooter,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/Dashboard_UI/sidebar"
import { useAuth }        from "@/components/hooks/use-auth"
import { getUserProfile } from "@/firebase/user"
import { hasCustomAvatar, getAvatarPublicUrl } from "@/lib/avatar"
import { avatarEvents }   from "@/lib/avatarEvents"  // ← new

// ── Hook: resolves avatar with priority + listens for live updates ─────────────
function useResolvedAvatar() {
  const { user } = useAuth()

  const fallback = user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.displayName || user?.email || "U"
    )}&background=000&color=fff`

  const [avatar, setAvatar] = React.useState<string>(fallback)

  // Core fetch function — runs on mount AND whenever avatarEvents fires
  const fetchAvatar = React.useCallback(async () => {
    if (!user) return
    try {
      // 1. Supabase DB (profile_pic column) — fastest source of truth
      const profile = await getUserProfile()
      if (profile?.profile_pic) {
        // Add cache-bust so browser doesn't show stale image after re-upload
        setAvatar(`${profile.profile_pic}?t=${Date.now()}`)
        return
      }

      // 2. Supabase Storage direct check
      const hasOwn = await hasCustomAvatar(user.uid)
      if (hasOwn) {
        setAvatar(getAvatarPublicUrl(user.uid))
        return
      }

      // 3. Firebase / Google
      if (user.photoURL) {
        setAvatar(user.photoURL)
        return
      }

      // 4. Generated initials
      setAvatar(
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.displayName || user.email || "U"
        )}&background=000&color=fff`
      )
    } catch {
      // Keep whatever is currently shown on failure
    }
  }, [user?.uid, user?.photoURL])

  // Run on mount / user change
  React.useEffect(() => {
    fetchAvatar()
  }, [fetchAvatar])

  // Re-run instantly when Settings finishes an upload — no reload needed
  React.useEffect(() => {
    return avatarEvents.on(fetchAvatar)
  }, [fetchAvatar])

  return avatar
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const avatar   = useResolvedAvatar()

  const data = {
    user: {
      name:   user?.displayName || "User",
      email:  user?.email       || "",
      avatar,
    },
    navMain: [
      { title: "Dashboard",    url: "/dashboard",              icon: IconDashboard },
      { title: "Transaction",  url: "/dashboard/transactions", icon: IconWallet    },
      { title: "Budget",       url: "/dashboard/budget",       icon: IconChartPie  },
      { title: "Reports",      url: "/dashboard/reports",      icon: IconReport    },
      { title: "AI Assistant", url: "/dashboard/ai-assistant", icon: IconRobot     },
    ],
    navSecondary: [
      { title: "Settings", url: "/dashboard/settings", icon: IconSettings },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="p-1.5 cursor-pointer">
              <Link to="/dashboard" className="flex items-center gap-2">
                <img src={logo} className="w-9 h-9" alt="FinEase Logo" />
                <span className="text-xl font-bold">
                  Fin<span className="font-semibold text-white/60">Ease</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain      items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}