// src/components/ui/Settings_UI/financial-panel.tsx
"use client"

import { Check, User, Globe, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import {
  Card, FieldRow, SectionLabel, SelectDropdown, Toast, type StatusMsg,
} from "./settings-ui"
import type { ProfileForm } from "@/components/hooks/use-settings"

const COUNTRIES   = ["India","United States","United Kingdom","Canada","Australia","Germany","France","Japan","Other"]
const CURRENCIES  = ["INR","USD","EUR","GBP","JPY","CAD","AUD"]

interface FinancialPanelProps {
  form:           ProfileForm
  setField:       (key: keyof ProfileForm) => (val: string) => void
  profileLoading: boolean
  profileSaving:  boolean
  profileMsg:     StatusMsg
  onSave:         () => void
}

export function FinancialPanel({
  form, setField, profileLoading, profileSaving, profileMsg, onSave,
}: FinancialPanelProps) {

  if (profileLoading) {
    return (
      <Card className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-white/30">
          <div className="size-7 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
          <p className="text-sm">Loading financial profile…</p>
        </div>
      </Card>
    )
  }

  const inputCls = "h-10 bg-white/[0.04] border-white/[0.08] hover:border-white/20 focus:border-white/30 text-white placeholder:text-white/20 transition-all"

  return (
    <div className="space-y-4">
      <Card>
        <SectionLabel>Identity</SectionLabel>

        <FieldRow icon={User} label="Full Name" description="Used in reports and exports.">
          <Input
            value={form.full_name}
            onChange={(e) => setField("full_name")(e.target.value)}
            placeholder="Full name"
            className={inputCls}
          />
        </FieldRow>

        <FieldRow icon={Globe} label="Country" description="Localises insights for your region.">
          <SelectDropdown value={form.country} options={COUNTRIES} onChange={setField("country")} />
        </FieldRow>

        <FieldRow icon={CreditCard} label="Currency" description="Your preferred display currency.">
          <SelectDropdown value={form.currency} options={CURRENCIES} onChange={setField("currency")} />
        </FieldRow>

        {/* DOB removed — now lives in Profile panel */}
      </Card>

      <div className="flex items-center gap-3 pt-1">
        <Button
          onClick={onSave}
          disabled={profileSaving}
          className="cursor-pointer h-10 px-8 bg-white text-black hover:bg-white/90 border-0 font-semibold"
        >
          {profileSaving
            ? <><span className="size-4 rounded-full border-2 border-black/20 border-t-black animate-spin mr-2" />Saving…</>
            : <><Check className="size-4 mr-2" />Save Changes</>
          }
        </Button>
        <Toast msg={profileMsg} />
      </div>
    </div>
  )
}