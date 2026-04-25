// src/components/Pages/BudgetPage.tsx
"use client"

import { useBudgets } from "@/components/hooks/use-budgets"
import { BudgetOverview }  from "@/components/ui/Budget_UI/budget-overview"
import { BudgetList }      from "@/components/ui/Budget_UI/budget-list"
import { AddBudgetDialog } from "@/components/ui/Budget_UI/add-budget-dialog"
import { MonthPicker }     from "@/components/ui/Reports_UI/month-picker" // ← ADD

export default function BudgetPage() {
  const {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    selectedMonth,    // ← was currentMonth
    setSelectedMonth, // ← ADD
  } = useBudgets()

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading
                ? "Loading..."
                : `${budgets.length} budget${budgets.length !== 1 ? "s" : ""} for ${selectedMonth}`}
            </p>
          </div>

          {/* ← ADD MonthPicker, keep AddBudgetDialog */}
          <div className="flex items-center gap-2">
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
            <AddBudgetDialog onAdd={addBudget} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Loading budgets...
          </div>
        ) : (
          <>
            <BudgetOverview budgets={budgets} />
            <BudgetList
              budgets={budgets}
              onEdit={updateBudget}
              onDelete={deleteBudget}
            />
          </>
        )}

      </div>
    </div>
  )
}