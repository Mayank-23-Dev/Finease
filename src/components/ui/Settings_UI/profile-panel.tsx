// src/components/ui/Settings_UI/profile-panel.tsx
"use client"

import * as React from "react"
import { Camera, Sparkles, User, Calendar as CalendarIcon, Download, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, FieldRow, DateField, Toast, type StatusMsg } from "./settings-ui"
import { useInstallPrompt } from "./settings-sidebar"

interface ProfilePanelProps {
    displayName: string
    email: string
    avatarPreview: string | null
    initials: string
    avatarFile: File | null
    avatarSaving: boolean
    avatarLoading: boolean
    avatarMsg: StatusMsg
    avatarInputRef: React.RefObject<HTMLInputElement | null>
    onAvatarPick: (e: React.ChangeEvent<HTMLInputElement>) => void
    onSaveAvatar: () => void
    onCancelAvatar: () => void
    onRemoveAvatar: () => void
    nameSaving: boolean
    nameMsg: StatusMsg
    setDisplayName: (v: string) => void
    setNameMsg: (v: StatusMsg) => void
    onSaveName: () => void
    dob: string
    onDobChange: (v: string) => void
    onSaveProfile: () => void
    profileSaving: boolean
    profileMsg: StatusMsg
}

export function ProfilePanel({
    displayName, email, avatarPreview, initials,
    avatarFile, avatarSaving, avatarLoading, avatarMsg,
    avatarInputRef, onAvatarPick, onSaveAvatar, onCancelAvatar,
    onRemoveAvatar,
    nameSaving, nameMsg, setDisplayName, setNameMsg, onSaveName,
    dob, onDobChange, onSaveProfile, profileSaving, profileMsg,
}: ProfilePanelProps) {

    const [showToast, setShowToast] = React.useState(false)
    const { canInstall, installed, isIOS, showButton, install } = useInstallPrompt()

    React.useEffect(() => {
        if (avatarMsg) {
            setShowToast(true)
            const t1 = setTimeout(() => setShowToast(false), 1800)
            return () => clearTimeout(t1)
        }
    }, [avatarMsg])

    return (
        <div className="space-y-4 w-full">

            {/* ── Avatar Card ── */}
            <Card className="relative overflow-hidden">

                {/* Banner */}
                <div className="relative h-20 bg-[#111111] overflow-hidden rounded-t-xl">
                    <svg className="absolute inset-0 w-full h-full opacity-[0.12]">
                        <defs>
                            <pattern id="pg" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.6" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#pg)" />
                    </svg>
                </div>

                {avatarMsg && (
                    <div className={`
                        absolute top-4 left-1/2 -translate-x-1/2 z-50
                        transition-all duration-300
                        ${showToast
                            ? "animate-in fade-in slide-in-from-top-2"
                            : "animate-out fade-out slide-out-to-top-2"}
                    `}>
                        <Toast msg={avatarMsg} />
                    </div>
                )}

                {/* Content */}
                <div className="px-4 sm:px-6 py-5 flex items-center gap-4 sm:gap-5">

                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div className="size-[68px] sm:size-[78px] rounded-2xl overflow-hidden
                            ring-2 ring-white/[0.10] ring-offset-2 ring-offset-[#111] shadow-md">
                            {avatarLoading ? (
                                <div className="size-full bg-white/[0.06] animate-pulse flex items-center justify-center">
                                    <Camera className="size-5 text-white/20" />
                                </div>
                            ) : avatarPreview ? (
                                <img src={avatarPreview} className="size-full object-cover" />
                            ) : (
                                <div className="size-full bg-[#1c1c1c] flex items-center justify-center text-2xl font-black text-white/40">
                                    {initials}
                                </div>
                            )}
                        </div>

                        <span className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-emerald-500 border-2 border-[#111]" />

                        {!avatarSaving && !avatarLoading && (
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100
                                    transition flex items-center justify-center cursor-pointer"
                            >
                                <Camera className="size-5 text-white" />
                            </button>
                        )}
                    </div>

                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden cursor-pointer"
                        onChange={onAvatarPick}
                    />

                    {/* Info */}
                    <div className="flex flex-col justify-center min-w-0 flex-1 py-1">
                        <p className="text-[18px] sm:text-[22px] font-extrabold tracking-tight leading-snug truncate
                            bg-gradient-to-r from-white via-white/95 to-white/70 bg-clip-text text-transparent
                            drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                            {displayName || "Your Name"}
                        </p>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[12px] sm:text-[13px] text-white/60 truncate font-medium">{email}</span>
                            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                            <span className="text-[11px] sm:text-[12px] text-emerald-400 font-semibold">Verified</span>
                        </div>

                        <div className="flex gap-2 mt-3 flex-wrap items-center">
                            {!avatarFile && !avatarSaving && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="h-8 px-3 sm:px-4 rounded-lg text-[12px] sm:text-[12.5px] font-medium
                                            bg-white/[0.04] border border-white/[0.12]
                                            text-white/80 hover:bg-white/[0.10] hover:border-white/[0.25]
                                            hover:text-white active:scale-[0.97] transition-all duration-150 shadow-sm cursor-pointer"
                                    >
                                        Change photo
                                    </Button>

                                    {avatarPreview && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={onRemoveAvatar}
                                            className="h-8 px-3 sm:px-4 rounded-lg text-[12px] sm:text-[12.5px] font-medium
                                                bg-red-500/[0.08] border border-red-500/[0.25]
                                                text-red-400 hover:bg-red-500/[0.18]
                                                hover:border-red-500/[0.4] hover:text-red-300
                                                active:scale-[0.97] transition-all duration-150 shadow-sm cursor-pointer"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </>
                            )}

                            {avatarFile && (
                                <div className="flex gap-2 items-center">
                                    <Button
                                        size="sm"
                                        onClick={onSaveAvatar}
                                        disabled={avatarSaving}
                                        className="h-8 px-4 rounded-lg text-[12.5px] font-semibold
                                            bg-white text-black shadow-sm hover:bg-white/90
                                            active:scale-[0.97] transition-all duration-150
                                            disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {avatarSaving ? "Uploading..." : "Save photo"}
                                    </Button>

                                    {!avatarSaving && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={onCancelAvatar}
                                            className="h-8 px-4 rounded-lg text-[12.5px] font-medium
                                                bg-white/[0.04] border border-white/[0.12]
                                                text-white/70 hover:bg-white/[0.08]
                                                hover:text-white active:scale-[0.97]
                                                transition-all duration-150 cursor-pointer"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="text-[11px] text-white/30 mt-2 font-medium tracking-wide">
                            JPG · PNG · GIF · WebP · Max 2 MB
                        </p>
                    </div>
                </div>
            </Card>

            {/* ── Install App Card — mobile only (sidebar shows it on desktop) ── */}
            <div className="lg:hidden">
                {installed ? (
                    <Card>
                        <div className="px-5 py-4 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/[0.10] shrink-0">
                                <CheckCircle className="size-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-white/80">App Installed</p>
                                <p className="text-[11px] text-white/35">FinEase is on your home screen</p>
                            </div>
                        </div>
                    </Card>
                ) : canInstall ? (
                    /* Chrome/Android: native prompt */
                    <Card>
                        <button
                            onClick={install}
                            className="w-full px-5 py-4 flex items-center gap-3 cursor-pointer
                                hover:bg-white/[0.03] transition-colors rounded-xl text-left"
                        >
                            <div className="p-2 rounded-xl bg-white/[0.06] shrink-0">
                                <Download className="size-4 text-white/60" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-white/80">Install FinEase</p>
                                <p className="text-[11px] text-white/35">Add to home screen for quick access</p>
                            </div>
                            <div className="shrink-0 px-3 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.10]">
                                <span className="text-[11px] font-semibold text-white/60">Install</span>
                            </div>
                        </button>
                    </Card>
                ) : isIOS ? (
                    /* iOS Safari: manual steps */
                    <Card>
                        <div className="px-5 py-4 flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-white/[0.04] shrink-0">
                                <Download className="size-4 text-white/30" />
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-white/60">Install FinEase</p>
                                <p className="text-[11px] text-white/30 leading-snug mt-0.5">
                                    Tap the Share button, then choose<br />"Add to Home Screen"
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    /* Chrome: prompt not triggered yet — show hint */
                    <Card>
                        <button
                            onClick={() => alert("To install: look for the install icon (⊕) in your browser address bar, or go to browser menu → Install FinEase")}
                            className="w-full px-5 py-4 flex items-center gap-3 cursor-pointer
                                hover:bg-white/[0.03] transition-colors rounded-xl text-left"
                        >
                            <div className="p-2 rounded-xl bg-white/[0.04] shrink-0">
                                <Download className="size-4 text-white/30" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-white/50">Install FinEase</p>
                                <p className="text-[11px] text-white/25 leading-snug">
                                    Tap ⊕ in your browser address bar
                                </p>
                            </div>
                        </button>
                    </Card>
                )}
            </div>

            {/* ── Name + Email + DOB Card ── */}
            <Card>
                <FieldRow icon={Sparkles} label="Display Name" description="Shown across the entire app. 32 characters max.">
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                value={displayName}
                                onChange={(e) => {
                                    setDisplayName(e.target.value)
                                    setNameMsg(null)
                                }}
                                maxLength={32}
                                className="h-10 text-[14px] font-semibold bg-white/[0.05] border-white/[0.10] text-white/90 rounded-lg"
                            />
                            <Button size="sm" onClick={onSaveName} disabled={nameSaving || !displayName.trim()}
                                className="h-10 px-5 text-[13px] font-bold rounded-lg bg-white text-black">
                                {nameSaving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                        <Toast msg={nameMsg} />
                    </div>
                </FieldRow>

                <div className="h-px bg-white/[0.06] mx-6" />

                <FieldRow icon={User} label="Email Address" description="Your login email.">
                    <Input value={email} disabled className="h-10 text-[14px] font-medium opacity-30 bg-white/[0.02] rounded-lg" />
                </FieldRow>

                <div className="h-px bg-white/[0.06] mx-6" />

                <FieldRow
                    icon={CalendarIcon}
                    label="Date of Birth"
                    description="Private — used for age-based insights only."
                >
                    <DateField value={dob} onChange={onDobChange} />
                </FieldRow>
            </Card>

            {/* Save profile button */}
            {dob && (
                <div className="flex items-center gap-3 pt-1">
                    <Button
                        onClick={onSaveProfile}
                        disabled={profileSaving}
                        className="cursor-pointer h-10 px-8 bg-white text-black hover:bg-white/90 border-0 font-semibold"
                    >
                        {profileSaving
                            ? <><span className="size-4 rounded-full border-2 border-black/20 border-t-black animate-spin mr-2" />Saving…</>
                            : <>Save Profile</>
                        }
                    </Button>
                    <Toast msg={profileMsg} />
                </div>
            )}

        </div>
    )
}