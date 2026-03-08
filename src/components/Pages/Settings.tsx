// src/components/ui/Settings_UI/account-settings.tsx
"use client"

import * as React from "react"
import { useAuth } from "@/components/hooks/use-auth"
import { updateUserName, deleteAccount, logout } from "@/firebase/auth"
import { updateUserProfile, getUserProfile, type UserProfile } from "@/firebase/user"
import { uploadAvatar } from "@/firebase/storage"

// ── UI components from your Transaction_UI folder ──────────────
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Label }     from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// ── Types ──────────────────────────────────────────────────────
type ProfileForm = {
  full_name: string
  country:   string
  currency:  string
  dob:       string
}

type StatusMsg = { type: "success" | "error"; text: string } | null

function Msg({ msg }: { msg: StatusMsg }) {
  if (!msg) return null
  return (
    <p className={`text-xs mt-1.5 ${msg.type === "success" ? "text-green-500" : "text-red-400"}`}>
      {msg.text}
    </p>
  )
}

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada",
  "Australia", "Germany", "France", "Japan", "Other",
]
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "CAD", "AUD"]

export default function AccountSettings() {
  const { user } = useAuth()

  // ── Avatar ─────────────────────────────────────────────────
  const [avatarFile,    setAvatarFile]    = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const [avatarSaving,  setAvatarSaving]  = React.useState(false)
  const [avatarMsg,     setAvatarMsg]     = React.useState<StatusMsg>(null)

  // ── Display name ───────────────────────────────────────────
  const [displayName, setDisplayName] = React.useState("")
  const [nameMsg,     setNameMsg]     = React.useState<StatusMsg>(null)
  const [nameSaving,  setNameSaving]  = React.useState(false)

  // ── Financial profile ──────────────────────────────────────
  const [form,        setForm]        = React.useState<ProfileForm>({
    full_name: "", country: "India", currency: "INR", dob: "",
  })
  const [profileMsg,     setProfileMsg]     = React.useState<StatusMsg>(null)
  const [profileSaving,  setProfileSaving]  = React.useState(false)
  const [profileLoading, setProfileLoading] = React.useState(true)

  // ── Load on mount ──────────────────────────────────────────
  React.useEffect(() => {
    if (!user) return
    setDisplayName(user.displayName ?? "")
    setAvatarPreview(user.photoURL ?? null)

    getUserProfile().then((p) => {
      if (p) {
        setForm({
          full_name: p.full_name  ?? "",
          country:   p.country    ?? "India",
          currency:  p.currency   ?? "INR",
          dob:       p.dob        ?? "",
        })
      }
      setProfileLoading(false)
    })
  }, [user])

  // ── Avatar handlers ────────────────────────────────────────
  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarMsg(null)
  }

  const handleSaveAvatar = async () => {
    if (!avatarFile) return
    setAvatarSaving(true)
    try {
      await uploadAvatar(avatarFile)
      setAvatarMsg({ type: "success", text: "Photo saved!" })
      setAvatarFile(null)
    } catch {
      setAvatarMsg({ type: "error", text: "Upload failed. Check Firebase Storage rules." })
    } finally {
      setAvatarSaving(false)
    }
  }

  // ── Name handler ───────────────────────────────────────────
  const handleSaveName = async () => {
    if (!displayName.trim()) return
    setNameSaving(true)
    try {
      await updateUserName(displayName.trim())
      setNameMsg({ type: "success", text: "Name updated!" })
    } catch {
      setNameMsg({ type: "error", text: "Failed to update name." })
    } finally {
      setNameSaving(false)
    }
  }

  // ── Profile save ───────────────────────────────────────────
  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      await updateUserProfile({
        full_name: form.full_name || null,
        country:   form.country   || null,
        currency:  form.currency  || null,
        dob:       form.dob       || null,
      })
      setProfileMsg({ type: "success", text: "Profile saved!" })
    } catch {
      setProfileMsg({ type: "error", text: "Failed to save profile." })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount()
    } catch {
      alert("Re-login required before deleting account.")
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col gap-10 max-w-xl">

      {/* ── Profile Photo ──────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Profile Photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload a photo for your account.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Avatar circle */}
          <div className="size-14 rounded-full overflow-hidden bg-muted border shrink-0">
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" className="size-full object-cover" />
              : <div className="size-full flex items-center justify-center text-xl font-semibold text-muted-foreground">
                  {user.displayName?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"}
                </div>
            }
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarPick}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("avatar-input")?.click()}
              >
                Choose Photo
              </Button>

              {avatarFile && (
                <Button size="sm" onClick={handleSaveAvatar} disabled={avatarSaving}>
                  {avatarSaving ? "Saving..." : "Save Photo"}
                </Button>
              )}
            </div>
            <Msg msg={avatarMsg} />
          </div>
        </div>

        <Separator />
      </div>

      {/* ── Display Name ───────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Display Name</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This is the name shown across your account.
          </p>
        </div>

        <div className="flex gap-2 max-w-sm">
          <Input
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setNameMsg(null) }}
            placeholder="Your name"
          />
          <Button onClick={handleSaveName} disabled={nameSaving}>
            {nameSaving ? "Saving..." : "Save"}
          </Button>
        </div>
        <Msg msg={nameMsg} />
        <Separator />
      </div>

      {/* ── Email (read-only) ───────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Email Address</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your login email. Cannot be changed here.
          </p>
        </div>
        <Input value={user.email ?? ""} disabled className="max-w-sm opacity-60 cursor-not-allowed" />
        <Separator />
      </div>

      {/* ── Financial Profile ──────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium">Financial Profile</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Used to personalise your dashboard and insights.
          </p>
        </div>

        {profileLoading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : (
          <div className="flex flex-col gap-4 max-w-sm">

            {/* Country */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Currency */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
              />
            </div>

          </div>
        )}

        {/* Single Save button for entire profile section */}
        <div>
          <Button onClick={handleSaveProfile} disabled={profileSaving || profileLoading}>
            {profileSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Msg msg={profileMsg} />
        </div>

        <Separator />
      </div>

      {/* ── Danger Zone ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-red-500">Danger Zone</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            These actions are permanent and cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => logout()}>
            Sign Out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your Firebase account and all your Supabase data
                  including transactions and budgets. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel />
                <AlertDialogAction onClick={handleDeleteAccount}>
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

    </div>
  )
}