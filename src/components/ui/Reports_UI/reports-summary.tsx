// src/components/ui/Reports_UI/reports-summary.tsx
"use client"

import type { Transaction } from "@/components/hooks/use-transactions"

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)

export function ReportsSummary({ transactions }: { transactions: Transaction[] }) {
  const income  = transactions.filter((t) => t.type === "Credit").reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === "Debit").reduce((s, t) => s + t.amount, 0)
  const net     = income - expense
  const count   = transactions.length
  const avgTx   = count > 0 ? expense / count : 0

  return (
    <div className="px-4 lg:px-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: "Total Income",   value: fmt(income),  color: "text-green-400"  },
        { label: "Total Expenses", value: fmt(expense), color: "text-red-400"    },
        { label: "Net Savings",    value: fmt(net),     color: net >= 0 ? "text-green-400" : "text-red-400" },
        { label: "Avg Transaction",value: fmt(avgTx),   color: "text-foreground" },
      ].map(({ label, value, color }) => (
        <div key={label} className="rounded-lg border bg-card p-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-semibold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}