// src/components/Pages/ReportsPage.tsx
"use client"

import { useTransactions } from "@/components/hooks/use-transactions"
import { MonthlyChart }     from "@/components/ui/Reports_UI/monthly-chart"
import { CategoryChart }    from "@/components/ui/Reports_UI/category-chart"
import { ReportsSummary }   from "@/components/ui/Reports_UI/reports-summary"
import { MonthPicker }      from "@/components/ui/Reports_UI/month-picker"
import * as React from "react"

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default function ReportsPage() {
  const { transactions, loading } = useTransactions()
  const [month, setMonth] = React.useState(getCurrentMonth())

  // Filter by selected month
  const filtered = React.useMemo(() =>
    transactions.filter((t) => t.date.startsWith(month)),
    [transactions, month]
  )

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Financial overview and analytics
            </p>
          </div>
          <MonthPicker value={month} onChange={setMonth} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Loading reports...
          </div>
        ) : (
          <>
            <ReportsSummary transactions={filtered} />
            <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 lg:grid-cols-2">
              <MonthlyChart  transactions={transactions} />
              <CategoryChart transactions={filtered} />
            </div>
          </>
        )}

      </div>
    </div>
  )
}