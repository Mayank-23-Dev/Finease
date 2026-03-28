// src/components/hooks/use-ai-chat.ts
import { useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { format }   from "date-fns"
import type { Transaction } from "@/components/hooks/use-transactions"
import type { Budget }      from "@/components/hooks/use-budgets"

export type Message = {
  id:      string
  role:    "user" | "assistant"
  content: string
}

type TransactionDraft = {
  transaction: string
  category:    string
  amount:      number
  date:        string
  type:        string
  method:      string
  status:      string
}

type TransactionInput = Omit<Transaction, "id" | "firebase_uid" | "created_at">

interface Props {
  transactions:    Transaction[]
  budgets:         Budget[]
  onAddTransaction: (t: TransactionInput) => Promise<{ error?: string; data?: Transaction } | undefined>
  // Lifted state — passed in from ChatStoreProvider so messages survive navigation
  messages:        Message[]
  setMessages:     Dispatch<SetStateAction<Message[]>>
  pendingDraft:    Partial<TransactionDraft> | null
  setPendingDraft: Dispatch<SetStateAction<Partial<TransactionDraft> | null>>
}

// ── Valid field values ────────────────────────────────────────────────────────
const VALID_CATEGORIES = ["Food", "Shopping", "Transport", "Utilities", "Health", "Entertainment", "Subscription", "Income", "Other"]
const VALID_METHODS    = ["Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Net Banking"]

// ── Infer category from transaction name ─────────────────────────────────────
function inferCategory(name: string): string {
  const n = name.toLowerCase()
  if (/(food|eat|restaurant|lunch|dinner|breakfast|snack|chai|coffee|swiggy|zomato|banana|apple|vegetable|grocery|groceries|sabzi|mandi)/i.test(n)) return "Food"
  if (/(uber|ola|auto|bus|metro|train|fuel|petrol|diesel|cab|rapido)/i.test(n)) return "Transport"
  if (/(amazon|flipkart|shop|clothes|shoes|shirt|pant|dress|buy|purchase)/i.test(n)) return "Shopping"
  if (/(electricity|water|internet|wifi|mobile|recharge|bill|gas|broadband)/i.test(n)) return "Utilities"
  if (/(netflix|hotstar|prime|spotify|subscription|ott)/i.test(n)) return "Subscription"
  if (/(doctor|medicine|hospital|pharmacy|health|gym|fitness)/i.test(n)) return "Health"
  if (/(movie|game|entertainment|fun|park|show|concert)/i.test(n)) return "Entertainment"
  if (/(salary|income|credit|received|got|earned)/i.test(n)) return "Income"
  return "Other"
}

// ── Detect if user message is describing a transaction ───────────────────────
function detectTransactionIntent(msg: string): Partial<TransactionDraft> | null {
  const text = msg.trim()

  // Patterns: covers "spent X on Y", "paid X for Y", "bought Y for X",
  // "add X rupee spend on Y", "X rupees on Y", "I spent X on Y today", etc.
  const patterns = [
    // "spent/paid/pay/spend 60 on/for banana"
    /(?:i\s+)?(?:spent|paid|spend|pay)\s+(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d+)?)\s+(?:rupees?\s+)?(?:on|for|at)\s+(.+?)(?:\s+today|\s+yesterday|\s+just now)?$/i,
    // "add 60 rupee spend on banana" / "add 60 rs on banana"
    /add\s+(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d+)?)\s+(?:rupees?\s+)?(?:spend\s+)?(?:on|for|at)\s+(.+?)(?:\s+today|\s+yesterday)?$/i,
    // "₹60 on banana" / "rs 60 on banana"
    /(?:rs\.?|₹|rupees?)\s*(\d+(?:\.\d+)?)\s+(?:rupees?\s+)?(?:on|for|at)\s+(.+?)(?:\s+today|\s+yesterday)?$/i,
    // "60 rupees on banana"
    /(\d+(?:\.\d+)?)\s+(?:rs\.?|₹|rupees?)\s+(?:on|for|at)\s+(.+?)(?:\s+today|\s+yesterday)?$/i,
    // "bought banana for 60"
    /(?:bought|got|purchased)\s+(.+?)\s+(?:for|at|worth)\s+(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d+)?)/i,
    // "banana cost me 60" / "banana costs 60"
    /(.+?)\s+(?:cost|costs|costed)\s+(?:me\s+)?(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d+)?)/i,
    // "log 60 for banana" / "record 60 for banana"
    /(?:log|record|track|note|add)\s+(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d+)?)\s+(?:rupees?\s+)?(?:for|on|at)\s+(.+?)(?:\s+today|\s+yesterday)?$/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue

    let amount: number
    let name: string

    // Patterns where name comes first (bought/got/cost)
    const nameFirstPatterns = [
      /^(?:bought|got|purchased)/i,
      /^(.+?)\s+(?:cost|costs|costed)/i,
    ]
    const isNameFirst = nameFirstPatterns.some((p) => p.test(pattern.source))

    if (isNameFirst) {
      name   = match[1].trim()
      amount = parseFloat(match[2])
    } else {
      amount = parseFloat(match[1])
      name   = match[2].trim()
    }

    if (isNaN(amount) || amount <= 0) continue

    // Clean up name — remove trailing noise words
    name = name
      .replace(/\b(today|yesterday|just now|this morning|tonight|last night)\b/gi, "")
      .replace(/\.$/, "")
      .trim()

    if (!name) continue

    const capitalized = name.charAt(0).toUpperCase() + name.slice(1)
    const category    = inferCategory(name)
    const isIncome    = category === "Income"

    return {
      transaction: capitalized,
      amount,
      category,
      type:   isIncome ? "Credit" : "Debit",
      date:   format(new Date(), "yyyy-MM-dd"),
      status: "Completed",
      // method intentionally left undefined — will ask
    }
  }
  return null
}

// ── Missing fields checker ────────────────────────────────────────────────────
function getMissingFields(draft: Partial<TransactionDraft>): string[] {
  const missing: string[] = []
  if (!draft.method)   missing.push("method")
  if (!draft.category) missing.push("category")
  if (!draft.type)     missing.push("type")
  return missing
}

function buildMissingFieldQuestion(missing: string[], draft: Partial<TransactionDraft>): string {
  if (missing.includes("method")) {
    return `Got it! I've noted **${draft.transaction}** for **₹${draft.amount?.toLocaleString("en-IN")}** on ${draft.date}.\n\nHow did you pay for this?\n- Cash\n- UPI\n- Credit Card\n- Debit Card\n- Bank Transfer\n- Net Banking`
  }
  if (missing.includes("category")) {
    return `What category should I put this under?\n- Food\n- Shopping\n- Transport\n- Utilities\n- Health\n- Entertainment\n- Subscription\n- Other`
  }
  return `Should I add this as a **Debit** (expense) or **Credit** (income)?`
}

// ── Fill a pending draft from user's follow-up reply ─────────────────────────
function fillDraftFromReply(reply: string, draft: Partial<TransactionDraft>): Partial<TransactionDraft> {
  const r = reply.toLowerCase().trim()
  const updated = { ...draft }

  // Fill method
  if (!updated.method) {
    if (r.includes("cash"))                                    updated.method = "Cash"
    else if (r.includes("upi"))                                updated.method = "UPI"
    else if (r.includes("credit"))                             updated.method = "Credit Card"
    else if (r.includes("debit"))                              updated.method = "Debit Card"
    else if (r.includes("bank") || r.includes("transfer") || r.includes("neft") || r.includes("imps")) updated.method = "Bank Transfer"
    else if (r.includes("net") || r.includes("netbanking"))    updated.method = "Net Banking"
  }

  // Fill category if missing
  if (!updated.category) {
    const found = VALID_CATEGORIES.find((c) => r.includes(c.toLowerCase()))
    if (found) updated.category = found
  }

  // Fill type if missing
  if (!updated.type) {
    if (r.includes("debit") || r.includes("expense"))  updated.type = "Debit"
    if (r.includes("credit") || r.includes("income"))  updated.type = "Credit"
  }

  return updated
}

// ── System prompt builder ────────────────────────────────────────────────────
function buildSystemPrompt(transactions: Transaction[], budgets: Budget[]): string {
  const now           = new Date()
  const currentMonth  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth     = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`

  const thisMonthTx = transactions.filter((t) => t.date.startsWith(currentMonth))
  const lastMonthTx = transactions.filter((t) => t.date.startsWith(lastMonth))

  const totalIncome  = transactions.filter((t) => t.type === "Credit").reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "Debit").reduce((s, t) => s + t.amount, 0)
  const monthIncome  = thisMonthTx.filter((t) => t.type === "Credit").reduce((s, t) => s + t.amount, 0)
  const monthExpense = thisMonthTx.filter((t) => t.type === "Debit").reduce((s, t) => s + t.amount, 0)
  const lastMonthExp = lastMonthTx.filter((t) => t.type === "Debit").reduce((s, t) => s + t.amount, 0)
  const balance      = totalIncome - totalExpense
  const monthlySaved = monthIncome - monthExpense

  const catMap: Record<string, number> = {}
  thisMonthTx.filter((t) => t.type === "Debit").forEach((t) => {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount
  })
  const catStr = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([c, a]) => `  • ${c}: ₹${a.toLocaleString("en-IN")}`)
    .join("\n") || "  No expense data this month"

  const budgetLines = budgets.length
    ? budgets.map((b) => {
        const pct  = b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0
        const flag = b.spent > b.amount ? " ⚠️ OVER BUDGET" : pct > 75 ? " ⚡ nearing limit" : ""
        return `  • ${b.category}: spent ₹${b.spent.toLocaleString("en-IN")} / ₹${b.amount.toLocaleString("en-IN")} (${pct}%)${flag}`
      }).join("\n")
    : "  No budgets set"

  const recentLines = transactions.slice(0, 15)
    .map((t) => `  ${t.date} | ${t.transaction} | ${t.type === "Credit" ? "+" : "-"}₹${t.amount.toLocaleString("en-IN")} | ${t.category} | ${t.method}`)
    .join("\n") || "  No transactions yet"

  return `You are FinEase AI, a smart and friendly personal finance assistant for Indian users.

━━━ USER'S FINANCIAL SNAPSHOT ━━━

Overall:
  • Total Income:   ₹${totalIncome.toLocaleString("en-IN")}
  • Total Expenses: ₹${totalExpense.toLocaleString("en-IN")}
  • Net Balance:    ₹${balance.toLocaleString("en-IN")}

This month (${currentMonth}):
  • Income: ₹${monthIncome.toLocaleString("en-IN")} | Expenses: ₹${monthExpense.toLocaleString("en-IN")} | Saved: ₹${monthlySaved.toLocaleString("en-IN")}

Last month (${lastMonth}):
  • Expenses: ₹${lastMonthExp.toLocaleString("en-IN")}

Expenses by category this month:
${catStr}

Budget status:
${budgetLines}

Recent transactions:
${recentLines}

━━━ BEHAVIOUR RULES ━━━
1. Use real data only — never invent numbers.
2. Use ₹ with Indian numbering (₹1,00,000).
3. Match style to question: short for casual, bullets for lists, structured only for complex analysis.
4. NEVER use "📊 What the data shows" headers unless user asks for full analysis.
5. Use **bold** for key numbers and names only.
6. Be warm, encouraging, practical — Indian context (UPI, EMI, SIP, etc.)
7. Keep casual replies under 100 words. Detailed analysis up to 250 words.
8. CRITICAL: If the user says they spent/paid/bought something, DO NOT add it yourself. Just say "I've noted that — let me confirm the details with you." The app handles transaction creation separately. Never say "I'll update your expenses" or show updated totals yourself.`
}

// ── Groq API ──────────────────────────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL   = "llama-3.1-8b-instant"

async function callGroq(apiKey: string, systemPrompt: string, history: Message[]): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens:  1024,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Groq error (${response.status})`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a response."
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAIChat({
  transactions,
  budgets,
  onAddTransaction,
  messages,
  setMessages,
  pendingDraft,
  setPendingDraft,
}: Props) {
  const [loading, setLoading] = useState(false)

  const addMessage = (msg: Omit<Message, "id">) =>
    setMessages((prev) => [...prev, { ...msg, id: `${msg.role}-${Date.now()}` }])

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const apiKey = import.meta.env.VITE_GROQ_API_KEY as string
    if (!apiKey) {
      addMessage({ role: "assistant", content: "⚠️ Groq API key not found. Add VITE_GROQ_API_KEY to your .env and restart." })
      return
    }

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: content.trim() }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const reply = content.toLowerCase().trim()

      // ── CASE 1: Waiting for yes/no confirmation ──────────────────────────────
      if (pendingDraft && (pendingDraft as TransactionDraft).method) {
        const isYes = ["yes", "y", "confirm", "ok", "haan", "ha", "sure", "add it", "yep"].some((w) => reply === w || reply.startsWith(w))
        const isNo  = ["no", "n", "cancel", "nahi", "nope", "don't", "dont"].some((w) => reply === w || reply.startsWith(w))

        if (isYes) {
          const draft = pendingDraft as TransactionDraft
          const result = await onAddTransaction({
            transaction: draft.transaction,
            category:    draft.category,
            amount:      draft.amount,
            date:        draft.date,
            type:        draft.type,
            method:      draft.method,
            status:      "Completed",
          })
          setPendingDraft(null)
          if (result?.error) {
            addMessage({ role: "assistant", content: `⚠️ Failed to add transaction: ${result.error}` })
          } else {
            addMessage({
              role:    "assistant",
              content: `✅ Done! **${draft.transaction}** of **₹${draft.amount.toLocaleString("en-IN")}** has been added to your transactions. Anything else you'd like to track?`,
            })
          }
          setLoading(false)
          return
        }

        if (isNo) {
          setPendingDraft(null)
          addMessage({ role: "assistant", content: "Okay, cancelled! Let me know if you'd like to add anything else." })
          setLoading(false)
          return
        }
      }

      // ── CASE 2: User is answering a pending field question ───────────────────
      if (pendingDraft && !(pendingDraft as TransactionDraft).method) {
        const updated = fillDraftFromReply(content, pendingDraft)
        const missing  = getMissingFields(updated)

        if (missing.length > 0) {
          setPendingDraft(updated)
          addMessage({ role: "assistant", content: buildMissingFieldQuestion(missing, updated) })
        } else {
          // All fields collected — show confirmation
          const draft = updated as TransactionDraft
          setPendingDraft(draft)
          addMessage({
            role:    "assistant",
            content: `Here's what I'll add:\n\n- **Name:** ${draft.transaction}\n- **Amount:** ₹${draft.amount.toLocaleString("en-IN")}\n- **Category:** ${draft.category}\n- **Type:** ${draft.type}\n- **Method:** ${draft.method}\n- **Date:** ${draft.date}\n\nShall I add this transaction? Reply **yes** to confirm or **no** to cancel.`,
          })
        }
        setLoading(false)
        return
      }

      // ── CASE 3: Detect new transaction intent ────────────────────────────────
      const detected = detectTransactionIntent(content)
      if (detected) {
        const missing = getMissingFields(detected)
        setPendingDraft(detected)

        if (missing.length > 0) {
          addMessage({ role: "assistant", content: buildMissingFieldQuestion(missing, detected) })
        } else {
          const draft = detected as TransactionDraft
          setPendingDraft(draft)
          addMessage({
            role:    "assistant",
            content: `Here's what I'll add:\n\n- **Name:** ${draft.transaction}\n- **Amount:** ₹${draft.amount.toLocaleString("en-IN")}\n- **Category:** ${draft.category}\n- **Type:** ${draft.type}\n- **Method:** ${draft.method}\n- **Date:** ${draft.date}\n\nShall I add this transaction? Reply **yes** to confirm or **no** to cancel.`,
          })
        }
        setLoading(false)
        return
      }

      // ── CASE 4: Regular finance question → call Groq ─────────────────────────
      const allMessages = [...messages, userMsg]
      const text = await callGroq(apiKey, buildSystemPrompt(transactions, budgets), allMessages)
      addMessage({ role: "assistant", content: text })

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong."
      addMessage({ role: "assistant", content: `⚠️ ${msg}` })
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setPendingDraft(null)
  }

  return { messages, loading, sendMessage, clearChat }
}