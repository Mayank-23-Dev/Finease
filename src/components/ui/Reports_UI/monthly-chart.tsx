// src/components/ui/Reports_UI/monthly-chart.tsx
"use client"

import type { Transaction } from "@/components/hooks/use-transactions"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export function MonthlyChart({ transactions }: { transactions: Transaction[] }) {
  // Build 12-month map
  const map: Record<string, { month: string; income: number; expense: number }> = {}

  transactions.forEach((t) => {
    const d   = new Date(t.date)
    const key = MONTH_NAMES[d.getMonth()]
    if (!map[key]) map[key] = { month: key, income: 0, expense: 0 }
    if (t.type === "Credit") map[key].income  += t.amount
    else                     map[key].expense += t.amount
  })

  const data = MONTH_NAMES
    .filter((m) => map[m])
    .map((m) => map[m])

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 flex items-center justify-center h-64 text-sm text-muted-foreground">
        No data for chart
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <p className="text-sm font-medium">Monthly Overview</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))"
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
          <Tooltip
            formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]}
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
          />
          <Legend />
          <Bar dataKey="income"  name="Income"  fill="#4ade80" radius={[4,4,0,0]} />
          <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}