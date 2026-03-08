// src/components/ui/Budget_UI/add-budget-dialog.tsx
"use client"

import * as React from "react"
import { IconPlus } from "@tabler/icons-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

const CATEGORIES = [
  "Food", "Shopping", "Transport", "Utilities",
  "Health", "Entertainment", "Subscription", "Other",
]

interface Props {
  onAdd: (b: { category: string; amount: number }) => Promise<{ error?: string } | undefined>
}

export function AddBudgetDialog({ onAdd }: Props) {
  const [open,     setOpen]     = React.useState(false)
  const [category, setCategory] = React.useState("")
  const [amount,   setAmount]   = React.useState("")
  const [saving,   setSaving]   = React.useState(false)
  const [errors,   setErrors]   = React.useState<Record<string, string>>({})

  const reset = () => { setCategory(""); setAmount(""); setErrors({}) }

  const handleSubmit = async () => {
    const e: Record<string, string> = {}
    if (!category) e.category = "Required"
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = "Enter a valid amount"
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    const result = await onAdd({ category, amount: Number(amount) })
    setSaving(false)

    if (result?.error) {
      setErrors({ form: result.error })
    } else {
      reset()
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm"><IconPlus className="size-4 mr-1" />Set Budget</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Set Budget</DialogTitle>
          <DialogDescription>Set a monthly spending limit for a category.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setErrors((p) => ({ ...p, category: "" })) }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-400">{errors.category}</p>}
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <Label>Monthly Limit (₹)</Label>
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })) }}
            />
            {errors.amount && <p className="text-xs text-red-400">{errors.amount}</p>}
          </div>

          {errors.form && <p className="text-xs text-red-400">{errors.form}</p>}
        </div>

        <DialogFooter showCloseButton>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Set Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}