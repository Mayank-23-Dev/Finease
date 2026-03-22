// src/components/ui/Budget_UI/delete-budget-dialog.tsx
"use client"

import * as React from "react"
import { IconAlertTriangle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

import type { Budget } from "@/components/hooks/use-budgets"

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n)

interface Props {
  budget:       Budget
  open:         boolean
  onOpenChange: (open: boolean) => void
  onConfirm:    (id: string) => Promise<void>
}

export function DeleteBudgetDialog({ budget, open, onOpenChange, onConfirm }: Props) {
  const [deleting, setDeleting] = React.useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm(budget.id)
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to delete budget:", err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-500/10">
              <IconAlertTriangle className="size-5 text-red-400" />
            </div>
            <div>
              <DialogTitle>Delete Budget</DialogTitle>
              <DialogDescription className="mt-0.5">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <p className="text-muted-foreground">You are about to permanently delete:</p>
          <p className="mt-1 font-semibold text-foreground">{budget.category}</p>
          <p className="text-muted-foreground">
            {fmt(budget.amount)} limit &middot; {fmt(budget.spent)} spent &middot; {budget.month}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}