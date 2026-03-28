import { useEffect, useRef, useState, useCallback } from "react"
import type { Transaction } from "@/components/hooks/use-transactions"
import type { Budget } from "@/components/hooks/use-budgets"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL   = "llama-3.1-8b-instant"
const CACHE_KEY    = "finease_ai_suggestions"

function buildHash(transactions: Transaction[], budgets: Budget[], salt: number): string {
  const t = transactions.map((t) => `${t.id}-${t.amount}-${t.type}`).join("|")
  const b = budgets.map((b) => `${b.category}-${b.amount}-${b.spent}`).join("|")
  return `${t}__${b}__${salt}`  // ✅ salt makes every refresh a new hash
}

function getCache(hash: string): string[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.hash === hash ? parsed.suggestions : null
  } catch {
    return null
  }
}

function setCache(hash: string, suggestions: string[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ hash, suggestions }))
  } catch {}
}

async function fetchFromGroq(transactions: Transaction[], budgets: Budget[]): Promise<string[]> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string
  if (!apiKey) return []

  const now          = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const thisMonthTx  = transactions.filter((t) => t.date.startsWith(currentMonth))

  const totalIncome  = transactions.filter((t) => t.type === "Credit").reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "Debit").reduce((s, t) => s + t.amount, 0)
  const monthIncome  = thisMonthTx.filter((t) => t.type === "Credit").reduce((s, t) => s + t.amount, 0)
  const monthExpense = thisMonthTx.filter((t) => t.type === "Debit").reduce((s, t) => s + t.amount, 0)
  const balance      = totalIncome - totalExpense
  const monthlySaved = monthIncome - monthExpense
  const savingsRate  = monthIncome > 0 ? Math.round((monthlySaved / monthIncome) * 100) : 0

  const catMap: Record<string, number> = {}
  thisMonthTx.filter((t) => t.type === "Debit").forEach((t) => {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount
  })
  const topCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c, a]) => `${c}: ₹${a.toLocaleString("en-IN")}`)
    .join(", ") || "No expenses this month"

  const budgetInsights = budgets.map((b) => {
    const pct        = b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0
    const unused     = b.amount - b.spent
    const isOver     = b.spent > b.amount
    const isWayUnder = pct < 20
    const isNear     = pct >= 80 && !isOver

    let insight = `${b.category}: spent ₹${b.spent.toLocaleString("en-IN")} of ₹${b.amount.toLocaleString("en-IN")} budget (${pct}%)`
    if (isOver)                insight += ` — OVER BUDGET by ₹${(b.spent - b.amount).toLocaleString("en-IN")}, needs immediate attention`
    else if (isWayUnder)       insight += ` — budget is ₹${unused.toLocaleString("en-IN")} too high, reduce it and redirect to savings/investments`
    else if (isNear)           insight += ` — approaching limit, only ₹${unused.toLocaleString("en-IN")} left`
    else                       insight += ` — on track`
    return insight
  }).join("\n")

  const investableAmount    = Math.round(monthlySaved * 0.5)
  const emergencyFundTarget = monthExpense * 6

  const prompt = `You are a sharp personal finance advisor for an Indian user. Priority: (1) fix overspending, (2) right-size inflated budgets, (3) grow savings, (4) invest. Use exact ₹ numbers.

FINANCIAL SNAPSHOT:
- Current balance: ₹${balance.toLocaleString("en-IN")}
- This month income: ₹${monthIncome.toLocaleString("en-IN")}
- This month expenses: ₹${monthExpense.toLocaleString("en-IN")}
- Saved this month: ₹${monthlySaved.toLocaleString("en-IN")} (${savingsRate}% savings rate)
- Investable surplus (50% of savings): ₹${investableAmount.toLocaleString("en-IN")}
- 6-month emergency fund target: ₹${emergencyFundTarget.toLocaleString("en-IN")}
- Top spending: ${topCategories}

BUDGET ANALYSIS:
${budgetInsights}

Generate exactly 6 suggestions:
1. Call out any OVER budget with exact overage and a concrete fix
2. Flag any under-utilized budget (< 20% spent) — trim it, redirect freed money to SIP/savings
3. Suggest a specific investment instrument with exact ₹ amount
4. Emergency fund check if balance < 6-month expenses
5. Reinforce a positive habit or win
6. One long-term wealth nudge (index fund, SIP, etc.)

Rules: 1-2 sentences each, use exact ₹ figures, actionable, trusted advisor tone.
FORMAT: exactly 6 suggestions separated by | only. No preamble, no labels, nothing else.

BAD: "Allocate ₹399 for transport, near your monthly transport budget"
BAD: "Save more money"
GOOD: "Your Subscription budget of ₹4,999 is massively oversized — you only spent ₹299, trim it to ₹500 and move the freed ₹4,499 into a SIP immediately."
GOOD: "Food spending hit ₹2,700 against a ₹2,000 budget — you are ₹700 over, cut 3-4 dining-out instances next month to get back on track."`

  try {
    const res = await fetch(GROQ_API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model:    GROQ_MODEL,
        messages: [
          {
            role:    "system",
            content: "You are a personal finance advisor for Indian users. Respond with exactly 6 suggestions separated by | and nothing else — no preamble, no labels, no extra text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,  // slightly higher so refresh gives meaningfully different suggestions
        max_tokens:  1200,
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content?.trim() ?? ""
    const list = text.split("|").map((s: string) => s.trim()).filter(Boolean).slice(0, 6)
    return list.length >= 2 ? list : []
  } catch {
    return []
  }
}

export function useAISuggestions(
  transactions: Transaction[],
  budgets:      Budget[],
  dataLoading:  boolean
) {
  const [suggestions,  setSuggestions]  = useState<string[]>([])
  const [loading,      setLoading]      = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const fetchingRef = useRef(false)
  const lastHashRef = useRef("")

  const refresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY)  // clear cache
    lastHashRef.current = ""            // reset hash so useEffect re-runs
    fetchingRef.current = false         // ✅ unblock fetching in case it got stuck
    setRefreshCount((n) => n + 1)       // trigger useEffect
  }, [])

  useEffect(() => {
    if (dataLoading) return

    const hash = buildHash(transactions, budgets, refreshCount)  // ✅ salt included
    if (hash === lastHashRef.current) return
    if (fetchingRef.current) return

    // skip cache on manual refresh (refreshCount > 0)
    const cached = refreshCount === 0 ? getCache(hash) : null
    if (cached) {
      lastHashRef.current = hash
      setSuggestions(cached)
      return
    }

    lastHashRef.current = hash
    fetchingRef.current = true
    setLoading(true)

    fetchFromGroq(transactions, budgets).then((result) => {
      if (result.length > 0) {
        setCache(hash, result)
        setSuggestions(result)
      }
      setLoading(false)
      fetchingRef.current = false
    })
  }, [dataLoading, transactions.length, budgets.length, refreshCount])

  return { suggestions, loading, refresh }
}