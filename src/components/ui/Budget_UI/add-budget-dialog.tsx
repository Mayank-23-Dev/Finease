// src/components/ui/Budget_UI/add-budget-dialog.tsx
"use client"

import * as React from "react"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import { Label }  from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/Dashboard_UI/select"

const CATEGORIES = [
  "Food", "Shopping", "Transport", "Utilities",
  "Health", "Entertainment", "Subscription", "Other",
]

interface Props {
  onAdd: (b: { category: string; amount: number }) => Promise<{ error?: string } | undefined>
}

export function AddBudgetDialog({ onAdd }: Props) {
  const [open,       setOpen]       = React.useState(false)
  const [category,   setCategory]   = React.useState("")
  const [customName, setCustomName] = React.useState("") // ← NEW
  const [amount,     setAmount]     = React.useState("")
  const [saving,     setSaving]     = React.useState(false)
  const [errors,     setErrors]     = React.useState<Record<string, string>>({})

  const isOther = category === "Other" // ← NEW

  const reset = () => {
    setCategory("")
    setCustomName("") // ← NEW
    setAmount("")
    setErrors({})
  }

  const handleSubmit = async () => {
    const e: Record<string, string> = {}
    if (!category) e.category = "Required"

    // ← NEW: validate custom name when Other is selected
    if (isOther && !customName.trim()) e.customName = "Please enter a name for this category"

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = "Enter a valid amount"
    if (Object.keys(e).length) { setErrors(e); return }

    // ← NEW: use customName as the actual category if Other
    const finalCategory = isOther ? customName.trim() : category

    setSaving(true)
    const result = await onAdd({ category: finalCategory, amount: Number(amount) })
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
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v)
                setCustomName("") // ← NEW: reset custom name on category change
                setErrors((p) => ({ ...p, category: "", customName: "" }))
              }}
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

          {/* ← NEW: Custom name field, only shown when Other is selected */}
          {isOther && (
            <div className="flex flex-col gap-1.5">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g. Gym, Pet Care, Travel..."
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value)
                  setErrors((p) => ({ ...p, customName: "" }))
                }}
                autoFocus
              />
              {errors.customName && <p className="text-xs text-red-400">{errors.customName}</p>}
            </div>
          )}

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