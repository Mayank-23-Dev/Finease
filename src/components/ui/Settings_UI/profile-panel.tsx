// src/components/ui/Settings_UI/profile-panel.tsx
"use client"

import * as React from "react"
import { Camera, Sparkles, User, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import { Card, FieldRow, Toast, type StatusMsg } from "./settings-ui"

interface ProfilePanelProps {
  displayName:    string
  email:          string
  avatarPreview:  string | null
  initials:       string
  avatarFile:     File | null
  avatarSaving:   boolean
  avatarMsg:      StatusMsg
  avatarInputRef: React.RefObject<HTMLInputElement | null>
  onAvatarPick:   (e: React.ChangeEvent<HTMLInputElement>) => void
  onSaveAvatar:   () => void
  nameSaving:     boolean
  nameMsg:        StatusMsg
  setDisplayName: (v: string) => void
  setNameMsg:     (v: StatusMsg) => void
  onSaveName:     () => void
}

export function ProfilePanel({
  displayName, email, avatarPreview, initials,
  avatarFile, avatarSaving, avatarMsg, avatarInputRef,
  onAvatarPick, onSaveAvatar,
  nameSaving, nameMsg, setDisplayName, setNameMsg, onSaveName,
}: ProfilePanelProps) {
  return (
    <div className="space-y-4">

      {/* ── Avatar hero card ──────────────────────────────────────────── */}
      <Card>
        {/* Banner — subtle grid, no color */}
        <div className="relative h-24 bg-white/[0.02] overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pg" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pg)" />
          </svg>
        </div>

        <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="size-20 rounded-2xl overflow-hidden border-4 border-[#0a0a0a] shadow-2xl">
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="size-full object-cover" />
                : <div className="size-full bg-white/[0.08] flex items-center justify-center
                    text-2xl font-black text-white/60">
                    {initials}
                  </div>
              }
            </div>
            <button onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/70 opacity-0 group-hover:opacity-100
                transition-all flex items-center justify-center cursor-pointer backdrop-blur-sm">
              <Camera className="size-5 text-white" />
            </button>
            {avatarFile && (
              <div className="absolute -inset-1 rounded-[18px] border-2 border-white/40 animate-pulse" />
            )}
          </div>

          <input ref={avatarInputRef} type="file" accept="image/*"
            className="hidden" onChange={onAvatarPick} />

          <div className="flex flex-col gap-2 sm:pb-1 flex-1">
            <div>
              <p className="text-base font-bold text-white leading-tight">{displayName || "Your Name"}</p>
              <p className="text-xs text-white/35 flex items-center gap-1.5 mt-0.5">
                <span className="size-1.5 rounded-full bg-white/40 inline-block" />
                {email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="outline" size="sm"
                onClick={() => avatarInputRef.current?.click()}
                className="cursor-pointer bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08]
                  text-white/60 gap-1.5 h-8 text-xs">
                <Camera className="size-3" /> Change photo
              </Button>
              {avatarFile && (
                <Button size="sm" onClick={onSaveAvatar} disabled={avatarSaving}
                  className="cursor-pointer gap-1.5 h-8 text-xs bg-white text-black
                    hover:bg-white/90 border-0 font-semibold">
                  {avatarSaving
                    ? <><span className="size-3 rounded-full border-2 border-black/20 border-t-black animate-spin" /> Uploading…</>
                    : <><Check className="size-3" /> Save photo</>
                  }
                </Button>
              )}
              <Toast msg={avatarMsg} />
            </div>
            <p className="text-[10px] text-white/20">JPG, PNG or GIF · Max 2 MB</p>
          </div>
        </div>
      </Card>

      {/* ── Name + email fields ────────────────────────────────────────── */}
      <Card>
        <FieldRow icon={Sparkles} label="Display Name" description="Shown across the entire app. 32 characters max.">
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setNameMsg(null) }}
                placeholder="Your name" maxLength={32}
                className="h-10 bg-white/[0.04] border-white/[0.08] hover:border-white/20
                  focus:border-white/30 text-white placeholder:text-white/20 transition-all"
              />
              <Button size="sm" onClick={onSaveName}
                disabled={nameSaving || !displayName.trim()}
                className="cursor-pointer h-10 px-4 shrink-0 bg-white text-black
                  hover:bg-white/90 border-0 font-semibold text-sm">
                {nameSaving
                  ? <span className="size-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  : "Save"
                }
              </Button>
            </div>
            <Toast msg={nameMsg} />
          </div>
        </FieldRow>

        <FieldRow icon={User} label="Email Address" description="Your login email. Contact support to change it.">
          <Input value={email} disabled
            className="h-10 opacity-25 cursor-not-allowed bg-white/[0.02] border-white/[0.05] text-white" />
        </FieldRow>
      </Card>

    </div>
  )
}