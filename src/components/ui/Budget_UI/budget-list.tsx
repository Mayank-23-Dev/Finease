// src/components/ui/Budget_UI/budget-list.tsx
"use client"

import * as React from "react"
import { IconTrash, IconPencil } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

import type { Budget } from "@/components/hooks/use-budgets"
import { EditBudgetDialog } from "@/components/ui/Budget_UI/edit-budget-dialog"
import { DeleteBudgetDialog } from "@/components/ui/Budget_UI/delete-budget-dialog"

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-500",
  Shopping: "bg-pink-500",
  Transport: "bg-blue-500",
  Utilities: "bg-yellow-500",
  Health: "bg-green-500",
  Entertainment: "bg-purple-500",
  Subscription: "bg-cyan-500",
  Other: "bg-gray-500",
}

interface Props {
  budgets: Budget[]
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, updates: { category: string; amount: number }) => Promise<{ error?: string } | undefined>
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n)

// ── Per-row component so each row has its own dialog state ──────────────────
function BudgetRow({
  b,
  onEdit,
  onDelete,
}: {
  b: Budget
  onEdit: Props["onEdit"]
  onDelete: Props["onDelete"]
}) {
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0
  const isOver = b.spent > b.amount
  const remaining = b.amount - b.spent
  const barColor = isOver
    ? "bg-red-500"
    : pct > 75
      ? "bg-yellow-500"
      : (CATEGORY_COLORS[b.category] ?? "bg-primary")

  return (
    <>
      <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${CATEGORY_COLORS[b.category] ?? "bg-gray-500"}`} />
            <span className="text-sm font-medium">{b.category}</span>
            {isOver && (
              <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full">
                Over budget
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">
                {fmt(b.spent)} <span className="text-muted-foreground/50">of</span> {fmt(b.amount)}
              </p>
              <p className={`text-xs font-medium ${isOver ? "text-red-400" : "text-green-400"}`}>
                {isOver ? `${fmt(Math.abs(remaining))} over` : `${fmt(remaining)} left`}
              </p>
            </div>

            {/* Edit button */}
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setEditOpen(true)}
            >
              <IconPencil className="size-3.5" />
            </Button>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0 text-muted-foreground hover:text-red-400"
              onClick={() => setDeleteOpen(true)}
            >
              <IconTrash className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
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

// ── List ────────────────────────────────────────────────────────────────────
export function BudgetList({ budgets, onDelete, onEdit }: Props) {
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
        <BudgetRow key={b.id} b={b} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}