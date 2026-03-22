// src/components/ui/Budget_UI/edit-budget-dialog.tsx
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import { Label }  from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/Dashboard_UI/select"

import type { Budget } from "@/components/hooks/use-budgets"

const CATEGORIES = [
  "Food", "Shopping", "Transport", "Utilities",
  "Health", "Entertainment", "Subscription", "Other",
]

interface Props {
  budget:       Budget
  open:         boolean
  onOpenChange: (open: boolean) => void
  onSave:       (id: string, updates: { category: string; amount: number }) => Promise<{ error?: string } | undefined>
}

export function EditBudgetDialog({ budget, open, onOpenChange, onSave }: Props) {
  const [category, setCategory] = React.useState(budget.category)
  const [amount,   setAmount]   = React.useState(String(budget.amount))
  const [saving,   setSaving]   = React.useState(false)
  const [errors,   setErrors]   = React.useState<Record<string, string>>({})

  // Sync form when a different budget row is opened
  React.useEffect(() => {
    setCategory(budget.category)
    setAmount(String(budget.amount))
    setErrors({})
  }, [budget])

  const handleSubmit = async () => {
    const e: Record<string, string> = {}
    if (!category) e.category = "Required"
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = "Enter a valid amount"
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    const result = await onSave(budget.id, { category, amount: Number(amount) })
    setSaving(false)

    if (result?.error) {
      setErrors({ form: result.error })
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Update the spending limit for this category.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => { setCategory(v); setErrors((p) => ({ ...p, category: "" })) }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}