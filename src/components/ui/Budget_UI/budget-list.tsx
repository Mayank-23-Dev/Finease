// src/components/ui/Budget_UI/budget-list.tsx
"use client"

import * as React from "react"
import { IconTrash, IconPencil } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import type { Budget } from "@/components/hooks/use-budgets"
import { EditBudgetDialog }   from "@/components/ui/Budget_UI/edit-budget-dialog"
import { DeleteBudgetDialog } from "@/components/ui/Budget_UI/delete-budget-dialog"

const CATEGORY_COLORS: Record<string, string> = {
  Food:          "bg-orange-500",
  Shopping:      "bg-pink-500",
  Transport:     "bg-blue-500",
  Utilities:     "bg-yellow-500",
  Health:        "bg-green-500",
  Entertainment: "bg-purple-500",
  Subscription:  "bg-cyan-500",
  Other:         "bg-gray-500",
}

const DURATION_LABELS: Record<string, string> = {
  monthly:   "Monthly",
  "3months":  "3 Months",
  "6months":  "6 Months",
  "12months": "12 Months",
  timeless:  "Timeless",
}

interface Props {
  budgets:             Budget[]
  onDelete:            (id: string) => Promise<void>
  onEdit:              (id: string, updates: { category: string; amount: number; duration: string }) => Promise<{ error?: string } | undefined>
  existingCategories?: string[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n)

function BudgetRow({
  b, onEdit, onDelete, existingCategories = [],
}: {
  b:                   Budget
  onEdit:              Props["onEdit"]
  onDelete:            Props["onDelete"]
  existingCategories?: string[]
}) {
  const [editOpen,   setEditOpen]   = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const pct       = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0
  const isOver    = b.spent > b.amount
  const remaining = b.amount - b.spent
  const barColor  = isOver
    ? "bg-red-500"
    : pct > 75
      ? "bg-yellow-500"
      : (CATEGORY_COLORS[b.category] ?? "bg-primary")
  const dotColor  = CATEGORY_COLORS[b.category] ?? "bg-gray-500"
  const duration  = b.duration ?? "monthly"

  return (
    <>
      <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">

          {/* Left: dot + name + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`size-2.5 rounded-full ${dotColor}`} />
            <span className="text-sm font-medium">{b.category}</span>

            {/* Duration badge */}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
              {DURATION_LABELS[duration] ?? duration}
            </span>

            {isOver && (
              <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full">
                Over budget
              </span>
            )}
          </div>

          {/* Right: amounts + actions */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">
                {fmt(b.spent)} <span className="text-muted-foreground/50">of</span> {fmt(b.amount)}
              </p>
              <p className={`text-xs font-medium ${isOver ? "text-red-400" : "text-green-400"}`}>
                {isOver ? `${fmt(Math.abs(remaining))} over` : `${fmt(remaining)} left`}
              </p>
            </div>

            <Button
              variant="ghost" size="sm"
              className="size-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setEditOpen(true)}
            >
              <IconPencil className="size-3.5" />
            </Button>

            <Button
              variant="ghost" size="sm"
              className="size-7 p-0 text-muted-foreground hover:text-red-400"
              onClick={() => setDeleteOpen(true)}
            >
              <IconTrash className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar + define budget tooltip */}
        <div className="flex flex-col gap-1">
          <div className="relative group/bar h-1.5 w-full rounded-full bg-muted overflow-visible cursor-default">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />

            {/* Tooltip: shown when no spending recorded yet */}
            {b.spent === 0 && (
              <div className="absolute left-0 -top-9 hidden group-hover/bar:flex items-center gap-1.5 bg-popover border border-border rounded-md px-2.5 py-1.5 text-xs text-muted-foreground whitespace-nowrap shadow-md z-10 pointer-events-none">
                <span className="size-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                Budget defined at {fmt(b.amount)} — no spending recorded yet
              </div>
            )}
          </div>

          {/* Mobile: show spent + pct below bar */}
          <div className="flex justify-between text-xs text-muted-foreground sm:hidden">
            <span>{fmt(b.spent)} spent</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <EditBudgetDialog
        budget={b}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={onEdit}
        existingCategories={existingCategories}
      />
      <DeleteBudgetDialog
        budget={b}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={onDelete}
      />
    </>
  )
}

export function BudgetList({ budgets, onDelete, onEdit, existingCategories = [] }: Props) {
  if (budgets.length === 0) {
    return (
      <div className="px-4 lg:px-6">
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground text-sm">
          No budgets set for this month. Add one to get started.
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6 flex flex-col gap-3">
      {budgets.map((b) => (
        <BudgetRow
          key={b.id} b={b}
          onEdit={onEdit} onDelete={onDelete}
          existingCategories={existingCategories}
        />
      ))}
    </div>
  )
}