"use client"

import * as React from "react"
import { DataTable } from "@/components/ui/Transaction_UI/data-table"
import { TransactionFiltersBar, type TransactionFilters } from "@/components/ui/Transaction_UI/transaction-filters"
import { AddTransactionDialog } from "@/components/ui/Transaction_UI/add-transaction-dialog"
import { useTransactions, type Transaction } from "@/components/hooks/use-transactions"

type TransactionInput = Omit<Transaction, "id" | "user_id" | "created_at">

export default function TransactionsPage() {
  const { transactions, loading, addTransaction } = useTransactions()

  const [filters, setFilters] = React.useState<TransactionFilters>({
    search: "",
    category: "",
    type: "",
    status: "",
    method: "",
    dateFrom: "",
    dateTo: "",
  })

  const filtered = React.useMemo(() => {
    const passesFilters = (t: typeof transactions[0]) => {
      if (filters.category && t.category !== filters.category) return false
      if (filters.type && t.type !== filters.type) return false
      if (filters.status && t.status !== filters.status) return false
      if (filters.method && t.method !== filters.method) return false
      if (filters.dateFrom && t.date < filters.dateFrom) return false
      if (filters.dateTo && t.date > filters.dateTo) return false
      return true
    }

    if (!filters.search.trim()) {
      return transactions.filter(passesFilters)
    }

    const query = filters.search.toLowerCase().trim()

    return transactions
      .map((t) => {
        const name = t.transaction.toLowerCase()
        let score = 0
        if (name === query) score = 100
        else if (name.startsWith(query)) score = 80
        else if (name.split(" ").some((word) => word.startsWith(query))) score = 60
        else if (name.includes(query)) score = 40
        return { t, score }
      })
      .filter(({ score, t }) => score > 0 && passesFilters(t))
      .sort((a, b) => b.score - a.score)
      .map(({ t }) => t)
  }, [transactions, filters])

  const handleAddTransaction = async (transaction: TransactionInput) => {
    const result = await addTransaction({
      transaction: transaction.transaction,
      category: transaction.category,
      amount: transaction.amount,
      date: transaction.date,
      type: transaction.type,
      method: transaction.method,
      status: transaction.status,
    })
    if (result?.error) console.error("Failed to add transaction:", result.error)
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

        {/* Page header */}
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading
                ? "Loading..."
                : `${filtered.length} transaction${filtered.length !== 1 ? "s" : ""} found`
              }
            </p>
          </div>
          <AddTransactionDialog onAdd={handleAddTransaction} />
        </div>

        {/* Filters */}
        <TransactionFiltersBar filters={filters} onChange={setFilters} />

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Loading transactions...
          </div>
        ) : (
          <DataTable data={filtered} />
        )}

      </div>
    </div>
  )
}