// src/components/ui/Settings_UI/settings-ui.tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronDownIcon, Check, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu, DropdownMenuTrigger,
  DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

// ── Toast ─────────────────────────────────────────────────────────────────────
export type StatusMsg = { type: "success" | "error"; text: string } | null

export function Toast({ msg }: { msg: StatusMsg }) {
  if (!msg) return null
  return (
    <div className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium border
      ${msg.type === "success"
        ? "bg-white/[0.08] text-white border-white/20"
        : "bg-white/[0.04] text-white/50 border-white/10"
      }`}>
      {msg.type === "success"
        ? <Check className="size-3 text-white" />
        : <AlertTriangle className="size-3 text-white/50" />}
      {msg.text}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({
  children, className = "", danger = false,
}: {
  children: React.ReactNode; className?: string; danger?: boolean
}) {
  return (
    <div className={`relative rounded-2xl border overflow-hidden
      ${danger ? "border-white/[0.10] bg-white/[0.02]" : "border-white/[0.08] bg-white/[0.03]"}
      ${className}`}>
      {children}
    </div>
  )
}

// ── FieldRow (FIXED ONLY THIS) ────────────────────────────────────────────────
export function FieldRow({
  icon: Icon, label, description, children,
}: {
  icon: React.ElementType; label: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5
      border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors">

      {/* LEFT */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-lg bg-white/[0.06] text-white/40">
          <Icon className="size-3.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/80 leading-tight">{label}</p>
          {description && (
            <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center">
        {children}
      </div>

    </div>
  )
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pt-4 pb-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">{children}</p>
    </div>
  )
}

// ── SelectDropdown ────────────────────────────────────────────────────────────
export function SelectDropdown({
  value, options, onChange, placeholder,
}: {
  value: string; options: string[]; onChange: (val: string) => void; placeholder?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline"
          className="w-full justify-between font-normal cursor-pointer h-10
            bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/20
            text-white/70 transition-all">
          {value || placeholder || "Select..."}
          <ChevronDownIcon className="size-4 opacity-30" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[340px] bg-[#111] border-white/[0.08]">
        {options.map((opt) => (
          <DropdownMenuItem key={opt} onClick={() => onChange(opt)}
            className={`cursor-pointer text-white/50 hover:text-white focus:text-white
              ${value === opt ? "font-semibold text-white" : ""}`}>
            {opt}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── DateField ─────────────────────────────────────────────────────────────────
export function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = value ? new Date(value) : undefined
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" data-empty={!date}
          className="w-full justify-between font-normal cursor-pointer h-10
            bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/20
            text-white/70 data-[empty=true]:text-white/25 transition-all">
          {date ? format(date, "PPP") : "Pick a date"}
          <ChevronDownIcon className="size-4 opacity-30" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date}
          onSelect={(d) => onChange(d ? d.toISOString().split("T")[0] : "")}
          defaultMonth={date} captionLayout="dropdown" />
      </PopoverContent>
    </Popover>
  )
}

// ── PasswordInput ─────────────────────────────────────────────────────────────
export function PasswordInput({
  value, onChange, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 bg-white/[0.04] border-white/[0.08] hover:border-white/20
          focus:border-white/30 text-white placeholder:text-white/20 pr-10 transition-all"
      />
      <button type="button" onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25
          hover:text-white/60 transition-colors cursor-pointer">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

// ── PasswordStrength ──────────────────────────────────────────────────────────
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score  = checks.filter(Boolean).length
  const fill   = ["bg-white/20", "bg-white/40", "bg-white/65", "bg-white/90"]
  const labels = ["Weak", "Fair", "Good", "Strong"]
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300
            ${i <= score ? fill[score - 1] : "bg-white/[0.07]"}`} />
        ))}
      </div>
      <p className="text-[11px] text-white/30">
        Strength: <span className="text-white/60 font-medium">{labels[score - 1] ?? "Weak"}</span>
      </p>
    </div>
  )
}