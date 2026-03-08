// src/components/hooks/use-ai-chat.ts
import { useState } from "react"
import type { Transaction } from "@/components/hooks/use-transactions"
import type { Budget }      from "@/components/hooks/use-budgets"

export type Message = {
  id:      string
  role:    "user" | "assistant"
  content: string
}

interface Props {
  transactions: Transaction[]
  budgets:      Budget[]
}

function buildSystemPrompt(transactions: Transaction[], budgets: Budget[]) {
  const totalIncome  = transactions.filter(t => t.type === "Credit").reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === "Debit").reduce((s, t) => s + t.amount, 0)
  const balance      = totalIncome - totalExpense

  const topCategories: Record<string, number> = {}
  transactions.filter(t => t.type === "Debit").forEach(t => {
    topCategories[t.category] = (topCategories[t.category] ?? 0) + t.amount
  })
  const topCatStr = Object.entries(topCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c, a]) => `${c}: ₹${a.toLocaleString("en-IN")}`)
    .join(", ")

  const budgetSummary = budgets
    .map(b => `${b.category}: spent ₹${b.spent.toLocaleString("en-IN")} of ₹${b.amount.toLocaleString("en-IN")} budget`)
    .join("; ")

  const recentTx = transactions.slice(0, 10)
    .map(t => `${t.date} | ${t.transaction} | ${t.type === "Credit" ? "+" : "-"}₹${t.amount} | ${t.category}`)
    .join("\n")

  return `You are a helpful personal finance assistant for FinEase, an Indian personal finance app.

USER'S FINANCIAL SUMMARY:
- Total Income: ₹${totalIncome.toLocaleString("en-IN")}
- Total Expenses: ₹${totalExpense.toLocaleString("en-IN")}
- Current Balance: ₹${balance.toLocaleString("en-IN")}
- Top Expense Categories: ${topCatStr || "No data yet"}
- Budget Status: ${budgetSummary || "No budgets set"}

RECENT TRANSACTIONS (last 10):
${recentTx || "No transactions yet"}

INSTRUCTIONS:
- Answer questions about spending, budgets, savings, and financial advice
- Use Indian Rupee (₹) for all amounts
- Be concise, clear, and actionable
- Reference the user's actual data when relevant
- Give specific, practical advice tailored to their situation
- Keep responses conversational and under 200 words unless asked for detail`
}

export function useAIChat({ transactions, budgets }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading,  setLoading]  = useState(false)

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = {
      id:      `u-${Date.now()}`,
      role:    "user",
      content: content.trim(),
    }

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const history = [...messages, userMsg].map((m) => ({
        role:    m.role,
        content: m.content,
      }))

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system:     buildSystemPrompt(transactions, budgets),
          messages:   history,
        }),
      })

      const data = await response.json()
      const text = data.content
        ?.filter((b: { type: string }) => b.type === "text")
        ?.map((b: { text: string }) => b.text)
        ?.join("") ?? "Sorry, I couldn't process that."

      const assistantMsg: Message = {
        id:      `a-${Date.now()}`,
        role:    "assistant",
        content: text,
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Something went wrong. Please try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => setMessages([])

  return { messages, loading, sendMessage, clearChat }
}