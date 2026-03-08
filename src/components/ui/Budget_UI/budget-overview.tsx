// src/components/ui/Budget_UI/budget-overview.tsx
"use client"

import type { Budget } from "@/components/hooks/use-budgets"

interface Props { budgets: Budget[] }

export function BudgetOverview({ budgets }: Props) {
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent  = budgets.reduce((s, b) => s + b.spent,  0)
  const remaining   = totalBudget - totalSpent
  const overBudget  = budgets.filter((b) => b.spent > b.amount).length

  const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const barColor = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-green-500"

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)

  return (
    <div className="px-4 lg:px-6 flex flex-col gap-4">

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Budget",  value: fmt(totalBudget), color: "text-foreground" },
          { label: "Total Spent",   value: fmt(totalSpent),  color: "text-red-400"    },
          { label: "Remaining",     value: fmt(remaining),   color: remaining >= 0 ? "text-green-400" : "text-red-400" },
          { label: "Over Budget",   value: `${overBudget} categor${overBudget === 1 ? "y" : "ies"}`, color: overBudget > 0 ? "text-yellow-400" : "text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border bg-card p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      {totalBudget > 0 && (
        <div className="rounded-lg border bg-card p-4 flex flex-col gap-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Overall spending</span>
            <span>{pct.toFixed(1)}% used</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}