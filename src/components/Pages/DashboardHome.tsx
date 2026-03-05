"use client"

import { ChartAreaInteractive } from "@/components/ui/Dashboard_UI/chart-area-interactive"
import { DataTable } from "@/components/ui/Dashboard_UI/data-table"
import { SectionCards } from "@/components/ui/Dashboard_UI/section-cards"

import { getRunningBalance, calculateBalance } from "@/lib/finance-analytics"
import data from "@/app/dashboard/data.json"

export default function DashboardHome() {
  const { income, expense, balance } = calculateBalance(data)
  const balanceData = getRunningBalance(data)

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

        <DataTable data={data} />

      </div>

    </div>
  )
}