import { useEffect, useRef, useState, useCallback } from "react"
import type { Transaction } from "@/components/hooks/use-transactions"
import type { Budget } from "@/components/hooks/use-budgets"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = "llama-3.1-8b-instant"
const CACHE_KEY = "finease_ai_suggestions"

// ─────────────────────────────────────────
// HASH
// ─────────────────────────────────────────
function buildHash(transactions: Transaction[], budgets: Budget[], salt: number): string {
  const t = transactions.map((t) => `${t.id}-${t.amount}-${t.type}-${t.category}`).join("|")
  const b = budgets.map((b) => `${b.category}-${b.amount}-${b.spent}`).join("|")
  return `${t}__${b}__${salt}`
}

// ─────────────────────────────────────────
// CACHE
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// AI LOGIC
// ─────────────────────────────────────────
async function fetchFromGroq(transactions: Transaction[], budgets: Budget[]): Promise<string[]> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string
  if (!apiKey) return []

  // ✅ FIXED DATE FILTER
  const now = new Date()
  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.date)
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth()
    )
  })

  // ── Calculations
  const totalIncome = transactions.filter(t => t.type === "Credit").reduce((s,t)=>s+t.amount,0)
  const totalExpense = transactions.filter(t => t.type === "Debit").reduce((s,t)=>s+t.amount,0)

  const monthIncome = thisMonthTx.filter(t => t.type === "Credit").reduce((s,t)=>s+t.amount,0)
  const monthExpense = thisMonthTx.filter(t => t.type === "Debit").reduce((s,t)=>s+t.amount,0)

  const balance = totalIncome - totalExpense
  const monthlySaved = monthIncome - monthExpense
  const savingsRate = monthIncome > 0 ? Math.round((monthlySaved / monthIncome) * 100) : 0

  // ── Category Analysis
  const catMap: Record<string, number> = {}
  thisMonthTx.forEach((t) => {
    if (t.type !== "Debit") return
    catMap[t.category] = (catMap[t.category] || 0) + t.amount
  })

  const topCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c, a]) => `${c}: ₹${a.toLocaleString("en-IN")}`)
    .join(", ") || "No expenses this month"

  // ── Budget Analysis
  const budgetInsights = budgets.map((b) => {
    const pct = b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0
    const unused = b.amount - b.spent

    let insight = `${b.category}: ₹${b.spent} / ₹${b.amount} (${pct}%)`

    if (b.spent > b.amount) insight += ` — OVER by ₹${b.spent - b.amount}`
    else if (pct < 20) insight += ` — reduce by ₹${unused}`
    else if (pct >= 80) insight += ` — near limit`
    else insight += ` — on track`

    return insight
  }).join("\n")

  const investable = Math.max(0, Math.round(monthlySaved * 0.5))
  const emergencyFund = monthExpense * 6

  // ── PROMPT
  const prompt = `
You are a friendly personal finance assistant for an Indian user.

TONE:
- Casual
- Helpful
- Slightly conversational (like a smart friend)

DATA:
Balance ₹${balance}
Income ₹${monthIncome}
Expense ₹${monthExpense}
Savings ₹${monthlySaved} (${savingsRate}%)
Top categories: ${topCategories}

Budgets:
${budgetInsights}

TASK:
Write 6 personalized financial suggestions.

IMPORTANT RULES (VERY STRICT):
- Return EXACTLY 6 suggestions
- Each suggestion must be SHORT (1–2 lines max)
- DO NOT combine them into a paragraph
- DO NOT use numbering (1,2,3...)
- DO NOT use bullet points
- EACH suggestion must be separated ONLY using "|"
- NO extra text before or after

OUTPUT FORMAT EXAMPLE (FOLLOW EXACTLY):

Suggestion one here|
Suggestion two here|
Suggestion three here|
Suggestion four here|
Suggestion five here|
Suggestion six here

STYLE:
- Use ₹ naturally
- Be realistic
- Use friendly tone (maybe, try, you could)
- Avoid robotic words

GOOD EXAMPLE:
"You spent ₹1200 more on food — maybe try meal planning for a week to bring it down"

BAD:
"Here are your suggestions: 1. Reduce spending..."
`

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a financial advisor." },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 800,
      }),
    })

    if (!res.ok) return []

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content ?? ""

    return text.split("|").map((s:string)=>s.trim()).filter(Boolean).slice(0,6)

  } catch {
    return []
  }
}

// ─────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────
export function useAISuggestions(
  transactions: Transaction[],
  budgets: Budget[],
  dataLoading: boolean
) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)

  const fetchingRef = useRef(false)
  const lastHashRef = useRef("")

  const refresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY)
    lastHashRef.current = ""
    fetchingRef.current = false
    setRefreshCount(n => n + 1)
  }, [])

  // ✅ FIXED DEPENDENCY
  const txKey = JSON.stringify(transactions)
  const budgetKey = JSON.stringify(budgets)

  useEffect(() => {
    if (dataLoading) return

    const hash = buildHash(transactions, budgets, refreshCount)

    if (hash === lastHashRef.current) return
    if (fetchingRef.current) return

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

  }, [dataLoading, txKey, budgetKey, refreshCount])

  return { suggestions, loading, refresh }
}