"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import { IconPlus } from "@tabler/icons-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/Dashboard_UI/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Dashboard_UI/select"

import { schema } from "@/components/ui/Transaction_UI/data-table"

type Transaction = z.infer<typeof schema>

interface AddTransactionDialogProps {
  onAdd: (transaction: Transaction) => void
}

const CATEGORIES = [
  "Income", "Subscription", "Food", "Shopping",
  "Utilities", "Transport", "Health", "Entertainment", "Other"
]
const METHODS = [
  "Bank Transfer", "Credit Card", "Debit Card",
  "UPI", "Cash", "Net Banking"
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

export function AddTransactionDialog({ onAdd }: AddTransactionDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const update = (key: keyof typeof emptyForm, value: string | Date | undefined) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.transaction.trim()) e.transaction = "Required"
    if (!form.category) e.category = "Required"
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = "Enter a valid amount"
    if (!form.date) e.date = "Required"
    if (!form.type) e.type = "Required"
    if (!form.method) e.method = "Required"
    return e
  }

  const handleSubmit = () => {
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onAdd({
      id: Date.now(),
      transaction: form.transaction.trim(),
      category: form.category,
      amount: Number(form.amount),
      date: format(form.date!, "yyyy-MM-dd"),
      type: form.type,
      method: form.method,
      status: form.status,
    })

    setForm(emptyForm)
    setErrors({})
    setOpen(false)
  }

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) {
      setForm(emptyForm)
      setErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IconPlus className="size-4 mr-1" />
          Add Transaction
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Fill in the details below to record a new transaction.
          </DialogDescription>
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
            {errors.transaction && (
              <p className="text-xs text-red-400">{errors.transaction}</p>
            )}
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
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-red-400">{errors.category}</p>
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
              {errors.type && (
                <p className="text-xs text-red-400">{errors.type}</p>
              )}
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
              {errors.amount && (
                <p className="text-xs text-red-400">{errors.amount}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!form.date}
                    className="w-full justify-between font-normal data-[empty=true]:text-muted-foreground"
                  >
                    {form.date ? format(form.date, "dd MMM yyyy") : <span>Pick a date</span>}
                    <ChevronDownIcon className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date}
                    onSelect={(d) => update("date", d)}
                    defaultMonth={form.date}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-xs text-red-400">{errors.date}</p>
              )}
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
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.method && (
                <p className="text-xs text-red-400">{errors.method}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>

        {/* Footer — uses built-in showCloseButton from your dialog.tsx */}
        <DialogFooter showCloseButton>
          <Button onClick={handleSubmit}>
            Add Transaction
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}