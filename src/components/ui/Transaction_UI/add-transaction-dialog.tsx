// src/components/ui/Transaction_UI/add-transaction-dialog.tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import { IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/Dashboard_UI/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select, SelectContent, SelectItem, SelectSeparator,
  SelectTrigger, SelectValue,
} from "@/components/ui/Dashboard_UI/select"
import type { Transaction } from "@/components/hooks/use-transactions"

type TransactionInput = Omit<Transaction, "id" | "firebase_uid" | "created_at">

const BASE_CATEGORIES = [
  "Income", "Subscription", "Food", "Shopping",
  "Utilities", "Transport", "Health", "Entertainment", "Other",
]
const METHODS = [
  "Bank Transfer", "Credit Card", "Debit Card", "UPI", "Cash", "Net Banking",
]

const emptyForm = {
  transaction: "",
  category: "",
  amount: "",
  date: undefined as Date | undefined,
  type: "",
  method: "",
  status: "Completed",
}

interface Props {
  onAdd:              (t: TransactionInput) => Promise<void>
  budgetCategories?:  string[]   // categories that already have a budget
  onAddBudget?:       (b: { category: string; amount: number; duration: string }) => Promise<{ error?: string } | undefined>
}

export function AddTransactionDialog({ onAdd, budgetCategories = [], onAddBudget }: Props) {
  const [open,   setOpen]   = React.useState(false)
  const [form,   setForm]   = React.useState(emptyForm)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)

  // Split categories: budgeted ones pinned to top, rest below
  const budgetedInList   = BASE_CATEGORIES.filter((c) => budgetCategories.includes(c))
  const unbудgetedInList = BASE_CATEGORIES.filter((c) => !budgetCategories.includes(c))
  const customBudgeted   = budgetCategories.filter((c) => !BASE_CATEGORIES.includes(c))

  // Is the selected category one that has NO budget yet?
  const isUnlistedCategory = form.category && !budgetCategories.includes(form.category)

  const update = (key: keyof typeof emptyForm, value: string | Date | undefined) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.transaction.trim()) e.transaction = "Required"
    if (!form.category)           e.category    = "Required"
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = "Enter a valid amount"
    if (!form.date)   e.date   = "Required"
    if (!form.type)   e.type   = "Required"
    if (!form.method) e.method = "Required"
    return e
  }

  const handleSubmit = async () => {
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setSaving(true)
    try {
      await onAdd({
        transaction: form.transaction.trim(),
        category:    form.category,
        amount:      Number(form.amount),
        date:        format(form.date!, "yyyy-MM-dd"),
        type:        form.type,
        method:      form.method,
        status:      form.status,
      })

      // Auto-add to budget if category has no budget and a budget handler exists
      if (isUnlistedCategory && onAddBudget) {
        await onAddBudget({
          category: form.category,
          amount:   Number(form.amount),  // seed with transaction amount
          duration: "monthly",
        })
      }

      setForm(emptyForm); setErrors({}); setOpen(false)
    } catch (err) {
      console.error("Failed to add transaction:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) { setForm(emptyForm); setErrors({}) }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IconPlus className="size-4 mr-1" />Add Transaction
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>Fill in the details below to record a new transaction.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">

          {/* Transaction Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transaction">Transaction Name</Label>
            <Input
              id="transaction"
              placeholder="e.g. Salary Credit"
              value={form.transaction}
              onChange={(e) => update("transaction", e.target.value)}
            />
            {errors.transaction && <p className="text-xs text-red-400">{errors.transaction}</p>}
          </div>

          {/* Category + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>

                  {/* Budgeted categories pinned first */}
                  {(budgetedInList.length > 0 || customBudgeted.length > 0) && (
                    <>
                      <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wide">
                        Budgeted
                      </div>
                      {customBudgeted.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      {budgetedInList.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      <SelectSeparator />
                    </>
                  )}

                  {/* Rest */}
                  {unbудgetedInList.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-400">{errors.category}</p>}

              {/* Auto-budget hint */}
              {isUnlistedCategory && onAddBudget && (
                <p className="text-[11px] text-amber-400/80 leading-tight">
                  No budget for "{form.category}" — one will be created automatically.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Debit / Credit" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Debit">Debit</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-red-400">{errors.type}</p>}
            </div>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g. 5000"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
              />
              {errors.amount && <p className="text-xs text-red-400">{errors.amount}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {form.date ? format(form.date, "dd MMM yyyy") : <span className="text-muted-foreground">Pick a date</span>}
                    <ChevronDownIcon className="size-4 opacity-60" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" avoidCollisions={false} className="w-auto p-0 z-50">
                  <Calendar mode="single" selected={form.date} onSelect={(d) => update("date", d)} defaultMonth={form.date} />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-xs text-red-400">{errors.date}</p>}
            </div>
          </div>

          {/* Method + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Payment Method</Label>
              <Select value={form.method} onValueChange={(v) => update("method", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.method && <p className="text-xs text-red-400">{errors.method}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>

        <DialogFooter showCloseButton>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Add Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}