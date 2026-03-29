"use client"

import * as React from "react"
import { useAuth } from "@/components/hooks/use-auth"
import { updateUserName, deleteAccount, logout, changePassword, reauthenticate } from "@/firebase/auth"
import { updateUserProfile, getUserProfile } from "@/firebase/user"
import { uploadAvatar } from "@/firebase/storage"

// ── Types ─────────────────────────────────────────────────────────────────────
export type StatusMsg = { type: "success" | "error"; text: string } | null

export type ProfileForm = {
  full_name:            string
  country:              string
  currency:             string
  dob:                  string
  monthly_income:       string
  income_source:        string
  savings_goal:         string
  financial_experience: string
}

export const DEFAULT_FORM: ProfileForm = {
  full_name:            "",
  country:              "India",
  currency:             "INR",
  dob:                  "",
  monthly_income:       "",
  income_source:        "Salary",
  savings_goal:         "",
  financial_experience: "Beginner",
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSettings() {
  const { user } = useAuth()

  // ── Avatar ────────────────────────────────────────────────────────────────
  const avatarInputRef                      = React.useRef<HTMLInputElement>(null)
  const [avatarFile,    setAvatarFile]      = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview]   = React.useState<string | null>(null)
  const [avatarSaving,  setAvatarSaving]    = React.useState(false)
  const [avatarMsg,     setAvatarMsg]       = React.useState<StatusMsg>(null)

  // ── Display name ──────────────────────────────────────────────────────────
  const [displayName, setDisplayName]       = React.useState("")
  const [nameSaving,  setNameSaving]        = React.useState(false)
  const [nameMsg,     setNameMsg]           = React.useState<StatusMsg>(null)

  // ── Password ──────────────────────────────────────────────────────────────
  const [currentPassword,  setCurrentPassword]  = React.useState("")
  const [newPassword,      setNewPassword]      = React.useState("")
  const [confirmPassword,  setConfirmPassword]  = React.useState("")
  const [passwordSaving,   setPasswordSaving]   = React.useState(false)
  const [passwordMsg,      setPasswordMsg]      = React.useState<StatusMsg>(null)

  // ── Financial profile ─────────────────────────────────────────────────────
  const [form,            setForm]          = React.useState<ProfileForm>(DEFAULT_FORM)
  const [profileSaving,   setProfileSaving] = React.useState(false)
  const [profileLoading,  setProfileLoading]= React.useState(true)
  const [profileMsg,      setProfileMsg]    = React.useState<StatusMsg>(null)

  // ── Load on mount ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!user) return
    setDisplayName(user.displayName ?? "")
    setAvatarPreview(user.photoURL ?? null)
    getUserProfile().then((p) => {
      if (p) {
        setForm({
          full_name:            p.full_name            ?? "",
          country:              p.country              ?? "India",
          currency:             p.currency             ?? "INR",
          dob:                  p.dob                  ?? "",
          monthly_income:       p.monthly_income       != null ? String(p.monthly_income) : "",
          income_source:        p.income_source        ?? "Salary",
          savings_goal:         p.savings_goal         != null ? String(p.savings_goal)   : "",
          financial_experience: p.financial_experience ?? "Beginner",
        })
      }
      setProfileLoading(false)
    })
  }, [user])

  // ── Derived ───────────────────────────────────────────────────────────────
  const initials = (user?.displayName ?? user?.email ?? "?")
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()

  const setField = (key: keyof ProfileForm) => (val: string) =>
    setForm((p) => ({ ...p, [key]: val }))

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ type: "error", text: "File too large. Max 2 MB." })
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarMsg(null)
  }

  const handleSaveAvatar = async () => {
    if (!avatarFile) return
    setAvatarSaving(true)
    try {
      const url = await uploadAvatar(avatarFile)
      setAvatarPreview(url)
      setAvatarMsg({ type: "success", text: "Photo updated!" })
      setAvatarFile(null)
    } catch {
      setAvatarMsg({ type: "error", text: "Upload failed. Check Firebase Storage rules." })
    } finally {
      setAvatarSaving(false)
    }
  }

  const handleSaveName = async () => {
    if (!displayName.trim()) return
    setNameSaving(true)
    setNameMsg(null)
    try {
      await updateUserName(displayName.trim())
      setNameMsg({ type: "success", text: "Name updated!" })
    } catch {
      setNameMsg({ type: "error", text: "Failed to update name." })
    } finally {
      setNameSaving(false)
    }
  }

  const handleSavePassword = async () => {
    setPasswordMsg(null)

    if (!currentPassword) {
      setPasswordMsg({ type: "error", text: "Please enter your current password." })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters." })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." })
      return
    }

    setPasswordSaving(true)
    try {
      // Re-authenticate with current password before changing
      await reauthenticate(currentPassword)
      await changePassword(newPassword)
      setPasswordMsg({ type: "success", text: "Password updated successfully!" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      const code = err?.code ?? ""
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setPasswordMsg({ type: "error", text: "Current password is incorrect." })
      } else if (code === "auth/requires-recent-login") {
        setPasswordMsg({ type: "error", text: "Session expired — please sign out and log in again." })
      } else {
        setPasswordMsg({ type: "error", text: "Failed to update password." })
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      await updateUserProfile({
        full_name:            form.full_name            || null,
        country:              form.country              || null,
        currency:             form.currency             || null,
        dob:                  form.dob                  || null,
        monthly_income:       form.monthly_income       ? parseFloat(form.monthly_income) : null,
        income_source:        form.income_source        || null,
        savings_goal:         form.savings_goal         ? parseFloat(form.savings_goal)   : null,
        financial_experience: form.financial_experience || null,
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

  const handleLogout = () => logout()

  return {
    user,
    initials,

    avatarInputRef,
    avatarFile,
    avatarPreview,
    avatarSaving,
    avatarMsg,
    handleAvatarPick,
    handleSaveAvatar,

    displayName,
    setDisplayName,
    nameSaving,
    nameMsg,
    setNameMsg,
    handleSaveName,

    currentPassword,  setCurrentPassword,
    newPassword,      setNewPassword,
    confirmPassword,  setConfirmPassword,
    passwordSaving,
    passwordMsg,
    setPasswordMsg,
    handleSavePassword,

    form,
    setField,
    profileSaving,
    profileLoading,
    profileMsg,
    handleSaveProfile,

    handleDeleteAccount,
    handleLogout,
  }
}