"use client"

import { useEffect, useRef } from 'react'
import { ChartAreaInteractive } from "@/components/ui/Dashboard_UI/chart-area-interactive"
import { DataTable } from "@/components/ui/Dashboard_UI/data-table-dashboard"
import { SectionCards } from "@/components/ui/Dashboard_UI/section-cards"
import { AISuggestions } from "@/components/ui/Dashboard_UI/ai-suggestions"
import { useTransactions } from "@/components/hooks/use-transactions"
import { useBudgets } from "@/components/hooks/use-budgets"
import { useAuth } from "@/components/hooks/use-auth"
import { getRunningBalance, calculateBalance } from "@/lib/finance-analytics"
import { supabase } from "@/lib/supabase"

// ─── Notification templates ───────────────────────────────────────────────────

function buildInsights(incomeRaw: number, expenseRaw: number, balanceRaw: number) {
  const income  = Number(incomeRaw)
  const expense = Number(expenseRaw)
  const balance = Number(balanceRaw)
  const savings = income > 0 ? Math.round(((income - expense) / income) * 100) : 0
  const expensePct = income > 0 ? Math.round((expense / income) * 100) : 0

  return [
    {
      type: 'ai_insight' as const,
      title: 'Daily Financial Insight',
      message:
        savings >= 70
          ? `Outstanding savings rate of ${savings}%! You're well ahead of the recommended 20%. Consider directing surplus into an index fund or recurring deposit.`
          : savings >= 40
          ? `Your savings rate is ${savings}% — solid progress. Automating a fixed monthly transfer could push it above 50%.`
          : savings >= 20
          ? `Your savings rate is ${savings}%. The benchmark is 20% — you're close. Trimming ₹${Math.round((income - expense) * 0.1).toLocaleString()} from monthly expenses could make a big difference.`
          : `Your savings rate is ${savings}%. This is below the recommended 20% minimum. With ₹${income.toLocaleString()} in income and ₹${expense.toLocaleString()} in expenses, look for categories to trim.`,
    },
    {
      type: 'ai_insight' as const,
      title: 'Spending Pattern Detected',
      message:
        expensePct > 80
          ? `Your expenses are ₹${expense.toLocaleString()} — that's ${expensePct}% of income. Review your top categories for quick savings wins.`
          : `You've kept expenses to ₹${expense.toLocaleString()} (${expensePct}% of income) this period. Great discipline — balance stands at ₹${balance.toLocaleString()}.`,
    },
    {
      type: 'system' as const,
      title: 'Balance Update',
      message: `Your current balance is ₹${balance.toLocaleString()}. ${
        balance > 10000
          ? 'You have a healthy cushion — consider setting a savings goal to put it to work.'
          : 'Keep an eye on spending to grow your balance this month.'
      }`,
    },
    {
      type: 'ai_insight' as const,
      title: 'Financial Tip',
      message: `The 50/30/20 rule suggests 50% on needs, 30% on wants, and 20% savings. Your current expense ratio is ${expensePct}% — ${
        expensePct <= 80 ? "you're on track!" : 'try trimming discretionary spending to improve your ratio.'
      }`,
    },
    {
      type: 'ai_insight' as const,
      title: 'Weekly Insight',
      message: `Tracking your spending consistently is the #1 habit of people who build wealth. You've logged ₹${expense.toLocaleString()} in expenses — keep the momentum going!`,
    },
  ]
}

// ─── Insert with per-day deduplication ───────────────────────────────────────

async function maybeInsert(
  firebase_uid: string,
  type: string,
  title: string,
  message: string
) {
  const todayStr = new Date().toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('firebase_uid', firebase_uid)
    .eq('title', title)
    .gte('created_at', `${todayStr}T00:00:00.000Z`)
    .limit(1)

  if (existing && existing.length > 0) return

  const { error } = await supabase.from('notifications').insert({
    firebase_uid,
    type,
    title,
    message,
    metadata: {},
    read: false,
    created_at: new Date().toISOString(),
  })

  if (error) console.error('[notifications] insert error:', error.message)
  else console.log('[notifications] inserted:', title)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardHome() {
  const { transactions, loading } = useTransactions()
  const { budgets } = useBudgets()
  const { user } = useAuth()

  const { income, expense, balance } = calculateBalance(transactions)
  const balanceData = getRunningBalance(transactions)

  const hasFiredRef = useRef(false)

  useEffect(() => {
    if (loading || !user?.uid || transactions.length === 0 || hasFiredRef.current) return
    hasFiredRef.current = true

    const uid = user.uid
    console.log('🔑 Firing notifications for UID:', uid)

    const insights = buildInsights(income, expense, balance)

    // First notification immediately
    maybeInsert(uid, insights[0].type, insights[0].title, insights[0].message)

    // Rest staggered every 8s
    insights.slice(1).forEach((n, i) => {
      setTimeout(() => {
        maybeInsert(uid, n.type, n.title, n.message)
      }, (i + 1) * 8000)
    })

    // Budget alerts after 3s
    setTimeout(() => {
      for (const budget of budgets ?? []) {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.category === budget.category)
          .reduce((sum, t) => sum + Number(t.amount), 0)
        const pct = Number(budget.amount) > 0
          ? (spent / Number(budget.amount)) * 100
          : 0

        if (pct >= 80) {
          maybeInsert(
            uid,
            'budget_alert',
            `Budget Alert: ${budget.category}`,
            `You've used ${Math.round(pct)}% of your ₹${Number(budget.amount).toLocaleString()} budget for ${budget.category}. ₹${Math.round(Number(budget.amount) - spent).toLocaleString()} remaining.`
          )
        }
      }
    }, 3000)

  }, [loading, user?.uid, transactions.length])

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
        <AISuggestions
          transactions={transactions}
          budgets={budgets}
          dataLoading={loading}
        />

        <div className="px-4 lg:px-6">
          <ChartAreaInteractive data={balanceData} />
        </div>

        <DataTable data={transactions} limit={10} showViewAll={true} />

      </div>
    </div>
  )
}