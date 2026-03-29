// src/components/ui/Settings_UI/financial-panel.tsx
"use client"

import { Check, User, Globe, CreditCard, Calendar as CalendarIcon,
         TrendingUp, Briefcase, Target, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import {
  Card, FieldRow, SectionLabel, SelectDropdown, DateField, Toast, type StatusMsg,
} from "./settings-ui"
import type { ProfileForm } from "@/components/hooks/use-settings"

const COUNTRIES      = ["India","United States","United Kingdom","Canada","Australia","Germany","France","Japan","Other"]
const CURRENCIES     = ["INR","USD","EUR","GBP","JPY","CAD","AUD"]
const EXPERIENCES    = ["Beginner","Intermediate","Advanced"]
const INCOME_SOURCES = ["Salary","Freelance","Business","Investments","Other"]

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

      {/* Identity */}
      <Card >
        <SectionLabel>Identity</SectionLabel>
        <FieldRow icon={User} label="Full Name" description="Used in reports and exports.">
          <Input value={form.full_name} onChange={(e) => setField("full_name")(e.target.value)}
            placeholder="Full name" className={inputCls} />
        </FieldRow>
        <FieldRow icon={Globe} label="Country" description="Localises insights for your region.">
          <SelectDropdown value={form.country} options={COUNTRIES} onChange={setField("country")} />
        </FieldRow>
        <FieldRow icon={CreditCard} label="Currency" description="Your preferred display currency.">
          <SelectDropdown value={form.currency} options={CURRENCIES} onChange={setField("currency")} />
        </FieldRow>
        <FieldRow icon={CalendarIcon} label="Date of Birth" description="Private — used for age-based insights only.">
          <DateField value={form.dob} onChange={setField("dob")} />
        </FieldRow>
      </Card>

      {/* Income & Goals
      <Card>
        <SectionLabel>Income &amp; Goals</SectionLabel>
        <FieldRow icon={TrendingUp} label="Monthly Income" description="Approximate gross monthly income.">
          <Input type="number" value={form.monthly_income}
            onChange={(e) => setField("monthly_income")(e.target.value)}
            placeholder="e.g. 50000" min={0} className={inputCls} />
        </FieldRow>
        <FieldRow icon={Briefcase} label="Income Source" description="Your primary source of income.">
          <SelectDropdown value={form.income_source} options={INCOME_SOURCES} onChange={setField("income_source")} />
        </FieldRow>
        <FieldRow icon={Target} label="Monthly Savings Goal" description="Target amount to save each month.">
          <Input type="number" value={form.savings_goal}
            onChange={(e) => setField("savings_goal")(e.target.value)}
            placeholder="e.g. 10000" min={0} className={inputCls} />
        </FieldRow>
        <FieldRow icon={GraduationCap} label="Financial Experience" description="Personalises AI-powered suggestions.">
          <SelectDropdown value={form.financial_experience} options={EXPERIENCES} onChange={setField("financial_experience")} />
        </FieldRow>
      </Card> */}

      {/* Save */}
      <div className="flex items-center gap-3 pt-1">
        <Button onClick={onSave} disabled={profileSaving}
          className="cursor-pointer h-10 px-8 bg-white text-black hover:bg-white/90 border-0 font-semibold">
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