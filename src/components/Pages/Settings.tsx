"use client"

import { Separator } from "@/components/ui/Dashboard_UI/separator"
import AccountSettings from "@/components/ui/Settings_UI/account-settings"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-4xl">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your FinEase account.
        </p>
      </div>

      <Separator />

      {/* Settings Sections */}
      <AccountSettings />

    </div>
  )
}