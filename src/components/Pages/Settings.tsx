"use client"

import * as React from "react"
import { useSettings } from "@/components/hooks/use-settings"
import {
  SettingsSidebar, SettingsMobileTabs,
  ProfilePanel, FinancialPanel, SecurityPanel, DangerPanel,
  type TabId,
} from "@/components/ui/Settings_UI"
import { NAV_ITEMS } from "@/components/ui/Settings_UI/settings-sidebar"

export default function SettingsPage() {
  const s = useSettings()
  const [activeTab, setActiveTab] = React.useState<TabId>("profile")

  if (!s.user) return null

  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab)!

  return (
    // ✅ Row layout (sidebar + content side-by-side)
    <div className="flex w-full bg-[#0a0a0a] text-white">

      {/* Sidebar */}
      <SettingsSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        displayName={s.user.displayName ?? ""}
        email={s.user.email ?? ""}
        avatarUrl={s.avatarPreview ?? undefined}
        initials={s.initials}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full max-w-2xl mx-auto px-5 sm:px-8 py-10 space-y-5">

          {/* Heading */}
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.06]">
              <activeNav.icon className="size-5 text-white/60" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {activeNav.label}
              </h1>
              <p className="text-sm text-white/30 mt-0.5">
                {activeTab === "profile"   && "Your identity across the platform."}
                {activeTab === "financial" && "Keep your financial data accurate for better insights."}
                {activeTab === "security"  && "Protect your account with a strong password."}
                {activeTab === "danger"    && "Destructive actions — proceed with extreme caution."}
              </p>
            </div>
          </div>

          {/* Panels */}
          {activeTab === "profile" && (
            <ProfilePanel
              displayName={s.displayName}
              email={s.user.email ?? ""}
              avatarPreview={s.avatarPreview}
              initials={s.initials}
              avatarFile={s.avatarFile}
              avatarSaving={s.avatarSaving}
              avatarMsg={s.avatarMsg}
              avatarInputRef={s.avatarInputRef}
              onAvatarPick={s.handleAvatarPick}
              onSaveAvatar={s.handleSaveAvatar}
              nameSaving={s.nameSaving}
              nameMsg={s.nameMsg}
              setDisplayName={s.setDisplayName}
              setNameMsg={s.setNameMsg}
              onSaveName={s.handleSaveName}
            />
          )}

          {activeTab === "financial" && (
            <FinancialPanel
              form={s.form}
              setField={s.setField}
              profileLoading={s.profileLoading}
              profileSaving={s.profileSaving}
              profileMsg={s.profileMsg}
              onSave={s.handleSaveProfile}
            />
          )}

          {activeTab === "security" && (
            <SecurityPanel
              currentPassword={s.currentPassword}
              newPassword={s.newPassword}
              confirmPassword={s.confirmPassword}
              setCurrentPassword={s.setCurrentPassword}
              setNewPassword={s.setNewPassword}
              setConfirmPassword={s.setConfirmPassword}
              setPasswordMsg={s.setPasswordMsg}
              passwordSaving={s.passwordSaving}
              passwordMsg={s.passwordMsg}
              onSavePassword={s.handleSavePassword}
              onLogout={s.handleLogout}
            />
          )}

          {activeTab === "danger" && (
            <DangerPanel onDeleteAccount={s.handleDeleteAccount} />
          )}

        </div>
      </main>

      <SettingsMobileTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}