// src/components/ui/Reports_UI/category-chart.tsx
"use client"

import type { Transaction } from "@/components/hooks/use-transactions"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const COLORS = ["#f87171","#fb923c","#facc15","#4ade80","#60a5fa","#c084fc","#f472b6","#94a3b8"]

export function CategoryChart({ transactions }: { transactions: Transaction[] }) {
  const map: Record<string, number> = {}
  transactions
    .filter((t) => t.type === "Debit")
    .forEach((t) => { map[t.category] = (map[t.category] ?? 0) + t.amount })

  const data = Object.entries(map).map(([name, value]) => ({ name, value }))

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 flex items-center justify-center h-64 text-sm text-muted-foreground">
        No expense data for this month
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <p className="text-sm font-medium">Expenses by Category</p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
            dataKey="value" nameKey="name" paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]}
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
          />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}