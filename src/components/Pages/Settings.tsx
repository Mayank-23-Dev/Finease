"use client"

import { Separator } from "@/components/ui/Dashboard_UI/separator"
import  AccountSettings from "@/components/ui/Settings_UI/account-settings"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-2 p-6 max-w-4xl">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground">
          Manage your FinEase account.
        </p>
      </div>

      <Separator />

      {/* Account Settings Section */}
      <AccountSettings />

    </div>
  )
}