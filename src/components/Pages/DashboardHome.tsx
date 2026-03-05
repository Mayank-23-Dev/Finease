"use client"

import { ChartAreaInteractive } from "@/components/ui/Dashboard_UI/chart-area-interactive"
import { DataTable } from "@/components/ui/Dashboard_UI/data-table"
import { SectionCards } from "@/components/ui/Dashboard_UI/section-cards"
import { useTransactions } from "@/components/hooks/use-transactions"
import { getRunningBalance, calculateBalance } from "@/lib/finance-analytics"

export default function DashboardHome() {
  const { transactions, loading } = useTransactions()

  const { income, expense, balance } = calculateBalance(transactions)
  const balanceData = getRunningBalance(transactions)

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 py-20 text-muted-foreground text-sm">
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

        <SectionCards
          income={income}
          expense={expense}
          balance={balance}
        />

        <div className="px-4 lg:px-6">
          <ChartAreaInteractive data={balanceData} />
        </div>

        {/* Show only last 10 transactions with a "View all" link */}
        <DataTable data={transactions} limit={10} showViewAll={true} />

      </div>
    </div>
  )
}