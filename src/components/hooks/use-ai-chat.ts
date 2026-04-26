// src/components/hooks/use-ai-chat.ts
import { useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { format } from "date-fns"
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

export type GuidedStep = "idle" | "name" | "amount" | "category" | "type" | "method" | "confirm" | "done"

// Bulk flow has two confirmation steps:
//   "preview"  → show the full list (new + duplicates), ask to add new ones
//   "dup-ask"  → new ones added, now separately ask about duplicates
type BulkStep = "preview" | "dup-ask"

type BulkState = {
  step:       BulkStep
  unique:     Partial<TransactionDraft>[]
  duplicates: Partial<TransactionDraft>[]
}

type TransactionInput = Omit<Transaction, "id" | "firebase_uid" | "created_at">

interface Props {
  transactions:     Transaction[]
  budgets:          Budget[]
  onAddTransaction: (t: TransactionInput) => Promise<{ error?: string; data?: Transaction } | undefined>
  messages:         Message[]
  setMessages:      Dispatch<SetStateAction<Message[]>>
  pendingDraft:     Partial<TransactionDraft> | null
  setPendingDraft:  Dispatch<SetStateAction<Partial<TransactionDraft> | null>>
  guidedStep:       GuidedStep
  setGuidedStep:    Dispatch<SetStateAction<GuidedStep>>
}

// ── Constants ─────────────────────────────────────────────────────────────────
const VALID_CATEGORIES = ["Food", "Shopping", "Transport", "Utilities", "Health", "Entertainment", "Subscription", "Income", "Other"]
const VALID_METHODS    = ["Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Net Banking"]

// ── Infer category from name ──────────────────────────────────────────────────
function inferCategory(name: string): string {
  const n = name.toLowerCase()
  if (/(food|eat|restaurant|lunch|dinner|breakfast|snack|chai|coffee|swiggy|zomato|banana|apple|vegetable|grocery|groceries|sabzi|mandi|biryani|pizza|burger)/i.test(n)) return "Food"
  if (/(uber|ola|auto|bus|metro|train|fuel|petrol|diesel|cab|rapido|rickshaw)/i.test(n))                                                                                  return "Transport"
  if (/(amazon|flipkart|shop|clothes|shoes|shirt|pant|dress|purchase|washing machine|ac|fridge|tv|laptop|mobile)/i.test(n))                                               return "Shopping"
  if (/(electricity|water|internet|wifi|recharge|bill|gas|broadband|postpaid|excitel|airtel|jio fiber|bsnl)/i.test(n))                                                    return "Utilities"
  if (/(netflix|jiohotstar|hotstar|disney|prime video|prime|spotify|youtube premium|subscription|ott|zee5|sonyliv|jiocinema|crunchyroll|apple tv)/i.test(n))            return "Subscription"
  if (/(doctor|medicine|hospital|pharmacy|health|gym|fitness|apollo|medplus)/i.test(n))                                                                                   return "Health"
  if (/(movie|game|entertainment|fun|park|show|concert|pvr|inox)/i.test(n))                                                                                               return "Entertainment"
  if (/(salary|income|received|got|earned|freelance|bonus|dividend|interest|rent received)/i.test(n))                                                                     return "Income"
  return "Other"
}

// ── Extract entity name ───────────────────────────────────────────────────────
function extractEntityName(raw: string): string {
  const text = raw.trim()
  const brandPatterns: [RegExp, string][] = [
    [/jio\s*hotstar/i, "JioHotstar"], [/disney\s*\+?\s*hotstar/i, "Disney Hotstar"],
    [/hotstar/i, "Hotstar"], [/netflix/i, "Netflix"], [/prime\s*video/i, "Prime Video"],
    [/amazon\s*prime/i, "Amazon Prime"], [/spotify/i, "Spotify"],
    [/youtube\s*premium/i, "YouTube Premium"], [/jio\s*cinema/i, "JioCinema"],
    [/zee5/i, "Zee5"], [/sony\s*liv/i, "SonyLiv"], [/apple\s*tv/i, "Apple TV+"],
    [/crunchyroll/i, "Crunchyroll"], [/swiggy/i, "Swiggy"], [/zomato/i, "Zomato"],
    [/uber/i, "Uber"], [/ola/i, "Ola"], [/rapido/i, "Rapido"],
    [/excitel/i, "Excitel"], [/airtel/i, "Airtel"], [/jio\s*fiber/i, "Jio Fiber"],
    [/bsnl/i, "BSNL"], [/amazon/i, "Amazon"], [/flipkart/i, "Flipkart"],
    [/apollo/i, "Apollo"], [/medplus/i, "MedPlus"],
    [/gpay|google\s*pay/i, "Google Pay"], [/phonepe/i, "PhonePe"],
    [/paytm/i, "Paytm"], [/washing\s*machine/i, "Washing Machine"],
  ]
  for (const [re, label] of brandPatterns) { if (re.test(text)) return label }

  const stripped = text
    .replace(/^(yaar|bhai|bro|dude|hey|ek|koi|ek koi|tha|hai|ka|ki|ke|mera|meri|mere|aur|or|toh|to|so|basically|actually|like|just|please|plz)\s+/gi, "")
    .replace(/\s+(tha|hai|ka|ki|ke|wala|wali|waala)$/gi, "")
    .replace(/\b(subscription|subscriptions|transaction|expense|payment|purchase|spending)\s+(tha|hai|ka|ki|ke|of|for|on)\s+/gi, "")
    .replace(/\b(subscription|subscriptions|transaction|expense|payment)\b/gi, "")
    .replace(/\b(spent|spend|paid|pay|bought|purchased|got|received|added|logged)\b/gi, "")
    .replace(/\b(on|for|at|in|via|from|to|of)\b/gi, "")
    .replace(/\s{2,}/g, " ").trim()

  if (stripped.length >= 2) return stripped.charAt(0).toUpperCase() + stripped.slice(1)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function cleanName(raw: string): string {
  return raw
    .replace(/\b(last\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday|week|month))\b/gi, "")
    .replace(/\b(today|yesterday|just now|this morning|tonight|last night|this evening|few days ago|a week ago)\b/gi, "")
    .replace(/\s{2,}/g, " ").replace(/[.,]+$/, "").trim()
}

// ── Free-text intent detection ────────────────────────────────────────────────
function detectTransactionIntent(msg: string): Partial<TransactionDraft> | null {
  const text = msg.trim().replace(/\s+/g, " ")
  const patterns: { re: RegExp; nameFirst: boolean }[] = [
    { re: /(?:i\s+)?(?:spent|paid|spend|pay|used)\s+(?:rs\.?|₹|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:rs\.?|₹|rupees?)?\s+(?:on|for|at|in)\s+(.+?)(?:\s+(?:last\s+\w+|today|yesterday|just now|this morning|tonight|last night))?$/i, nameFirst: false },
    { re: /(?:add|log|record|track|note)\s+(?:rs\.?|₹|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:rs\.?|₹|rupees?)?\s*(?:spend\s+)?(?:on|for|at|in)\s+(.+?)(?:\s+(?:last\s+\w+|today|yesterday|just now))?$/i, nameFirst: false },
    { re: /(?:rs\.?|₹|inr|rupees?)\s*(\d[\d,]*(?:\.\d+)?)\s*(?:on|for|at|in)\s+(.+?)(?:\s+(?:last\s+\w+|today|yesterday|just now))?$/i, nameFirst: false },
    { re: /(\d[\d,]*(?:\.\d+)?)\s+(?:rs\.?|₹|inr|rupees?)\s+(?:on|for|at|in)\s+(.+?)(?:\s+(?:last\s+\w+|today|yesterday|just now))?$/i, nameFirst: false },
    { re: /(?:bought|got|purchased|ordered)\s+(.+?)\s+(?:for|at|worth|costing)\s+(?:rs\.?|₹|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)/i, nameFirst: true },
    { re: /(.+?)\s+(?:cost|costs|costed|costing)\s+(?:me\s+)?(?:rs\.?|₹|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)/i, nameFirst: true },
    { re: /(.+?)\s+(?:worth|for)\s+(?:rs\.?|₹|inr|rupees?)\s*(\d[\d,]*(?:\.\d+)?)/i, nameFirst: true },
    { re: /^(\d[\d,]*(?:\.\d+)?)\s+(?:on|for|at)\s+(.+?)(?:\s+(?:last\s+\w+|today|yesterday|just now))?$/i, nameFirst: false },
  ]
  for (const { re, nameFirst } of patterns) {
    const match = text.match(re)
    if (!match) continue
    const rawAmount = nameFirst ? match[2] : match[1]
    const rawName   = nameFirst ? match[1] : match[2]
    const amount    = parseFloat(rawAmount.replace(/,/g, ""))
    if (isNaN(amount) || amount <= 0) continue
    const name = cleanName(rawName)
    if (!name || name.length < 2) continue
    const cap      = name.charAt(0).toUpperCase() + name.slice(1)
    const category = inferCategory(name)
    return { transaction: cap, amount, category, type: category === "Income" ? "Credit" : "Debit", date: format(new Date(), "yyyy-MM-dd"), status: "Completed" }
  }
  return null
}

// ── Receipt scan single message parser ───────────────────────────────────────
function detectReceiptTransaction(msg: string): Partial<TransactionDraft> | null {
  const nameMatch     = msg.match(/name\s+"([^"]+)"/i)
  const amountMatch   = msg.match(/amount\s+₹?([\d,]+)/i)
  const dateMatch     = msg.match(/date\s+(\d{4}-\d{2}-\d{2})/i)
  const categoryMatch = msg.match(/category\s+([A-Za-z\s]+?)(?:,|\.)/i)
  const methodMatch   = msg.match(/method\s+([A-Za-z\s]+?)(?:,|\.)/i)
  const typeMatch     = msg.match(/type\s+(Debit|Credit)/i)

  if (!nameMatch || !amountMatch) return null
  const amount = parseFloat(amountMatch[1].replace(/,/g, ""))
  if (isNaN(amount) || amount <= 0) return null

  const rawCategory = categoryMatch?.[1].trim() ?? ""
  const category    = VALID_CATEGORIES.find((c) => c.toLowerCase() === rawCategory.toLowerCase()) ?? inferCategory(nameMatch[1])
  const rawMethod   = methodMatch?.[1].trim() ?? ""
  const method      = VALID_METHODS.find((m) => m.toLowerCase() === rawMethod.toLowerCase()) ?? "Cash"

  return {
    transaction: nameMatch[1].trim(),
    amount,
    date:        dateMatch?.[1] ?? format(new Date(), "yyyy-MM-dd"),
    category,
    method,
    type:        (typeMatch?.[1] ?? "Debit") as "Debit" | "Credit",
    status:      "Completed",
  }
}

// ── Bulk import message parser ────────────────────────────────────────────────
function detectBulkImport(msg: string): Partial<TransactionDraft>[] | null {
  if (!/^bulk import \d+ transaction/i.test(msg.trim())) return null

  const lines = msg.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()))
  if (!lines.length) return null

  const results: Partial<TransactionDraft>[] = []
  for (const line of lines) {
    const nameMatch     = line.match(/name\s+"([^"]+)"/i)
    const amountMatch   = line.match(/amount\s+₹?([\d,]+)/i)
    const dateMatch     = line.match(/date\s+(\d{4}-\d{2}-\d{2})/i)
    const categoryMatch = line.match(/category\s+([A-Za-z\s]+?)(?:,|$)/i)
    const methodMatch   = line.match(/method\s+([A-Za-z\s]+?)(?:,|$)/i)
    const typeMatch     = line.match(/type\s+(Debit|Credit)/i)

    if (!nameMatch || !amountMatch) continue
    const amount = parseFloat(amountMatch[1].replace(/,/g, ""))
    if (isNaN(amount) || amount <= 0) continue

    const rawCategory = categoryMatch?.[1].trim() ?? ""
    const category    = VALID_CATEGORIES.find((c) => c.toLowerCase() === rawCategory.toLowerCase()) ?? inferCategory(nameMatch[1])
    const rawMethod   = methodMatch?.[1].trim() ?? ""
    const method      = VALID_METHODS.find((m) => m.toLowerCase() === rawMethod.toLowerCase()) ?? "Cash"

    results.push({
      transaction: nameMatch[1].trim(),
      amount,
      date:        dateMatch?.[1] ?? format(new Date(), "yyyy-MM-dd"),
      category,
      method,
      type:        (typeMatch?.[1] ?? "Debit") as "Debit" | "Credit",
      status:      "Completed",
    })
  }
  return results.length ? results : null
}

// ── Duplicate check ───────────────────────────────────────────────────────────
function isDuplicate(draft: Partial<TransactionDraft>, existing: Transaction[]): boolean {
  return existing.some(
    (t) =>
      t.transaction.toLowerCase() === (draft.transaction ?? "").toLowerCase() &&
      t.amount === draft.amount &&
      t.date   === draft.date
  )
}

// ── Bulk preview card — shows new + duplicates, asks for confirmation ─────────
function buildBulkPreviewCard(unique: Partial<TransactionDraft>[], duplicates: Partial<TransactionDraft>[]): string {
  const total = unique.length + duplicates.length
  const lines: string[] = []

  lines.push(`📋 Found **${total}** transaction${total > 1 ? "s" : ""} in this image:`)
  lines.push("")

  if (unique.length > 0) {
    const label = duplicates.length > 0 ? `✅ New (${unique.length}):` : `Transactions (${unique.length}):`
    lines.push(`**${label}**`)
    unique.forEach((d) => {
      lines.push(`  • **${d.transaction}** — ₹${(d.amount as number).toLocaleString("en-IN")} · ${d.date} · ${d.category} · ${d.type}`)
    })
  }

  if (duplicates.length > 0) {
    if (unique.length > 0) lines.push("")
    lines.push(`**⚠️ Already exist (${duplicates.length}) — same name, amount & date:**`)
    duplicates.forEach((d) => {
      lines.push(`  • **${d.transaction}** — ₹${(d.amount as number).toLocaleString("en-IN")} · ${d.date}`)
    })
  }

  lines.push("")

  if (unique.length > 0 && duplicates.length > 0) {
    lines.push(`Shall I add the **${unique.length} new** one${unique.length > 1 ? "s" : ""}? Reply **yes** to add them (I'll ask about duplicates separately) or **no** to cancel everything.`)
  } else if (unique.length > 0) {
    lines.push(`Shall I add all **${unique.length}** transaction${unique.length > 1 ? "s" : ""}? Reply **yes** to confirm or **no** to cancel.`)
  } else {
    // All duplicates
    lines.push(`All of these already exist. Add them anyway? Reply **yes** to add all or **no** to skip.`)
  }

  return lines.join("\n")
}

// ── Duplicate ask card ────────────────────────────────────────────────────────
function buildDupAskCard(duplicates: Partial<TransactionDraft>[]): string {
  const lines: string[] = [
    `Now about the **${duplicates.length}** possible duplicate${duplicates.length > 1 ? "s" : ""}:`,
    "",
  ]
  duplicates.forEach((d) => {
    lines.push(`  • **${d.transaction}** — ₹${(d.amount as number).toLocaleString("en-IN")} · ${d.date}`)
  })
  lines.push("")
  lines.push(`These already exist with the same name, amount & date. Add them anyway? Reply **yes** or **no**.`)
  return lines.join("\n")
}

// ── Field helpers ─────────────────────────────────────────────────────────────
function getMissingFields(draft: Partial<TransactionDraft>): string[] {
  const m: string[] = []
  if (!draft.method)   m.push("method")
  if (!draft.category) m.push("category")
  if (!draft.type)     m.push("type")
  return m
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

function fillDraftFromReply(reply: string, draft: Partial<TransactionDraft>): Partial<TransactionDraft> {
  const r       = reply.toLowerCase().trim()
  const updated = { ...draft }
  if (!updated.method) {
    if      (r.includes("cash"))                                                                         updated.method = "Cash"
    else if (r.includes("upi") || r.includes("gpay") || r.includes("phonepe") || r.includes("paytm"))  updated.method = "UPI"
    else if (r.includes("credit"))                                                                       updated.method = "Credit Card"
    else if (r.includes("debit"))                                                                        updated.method = "Debit Card"
    else if (r.includes("bank") || r.includes("transfer") || r.includes("neft") || r.includes("imps")) updated.method = "Bank Transfer"
    else if (r.includes("net") || r.includes("netbanking"))                                              updated.method = "Net Banking"
    else if (r === "1") updated.method = "Cash"
    else if (r === "2") updated.method = "UPI"
    else if (r === "3") updated.method = "Credit Card"
    else if (r === "4") updated.method = "Debit Card"
    else if (r === "5") updated.method = "Bank Transfer"
    else if (r === "6") updated.method = "Net Banking"
  }
  if (!updated.category) { const f = VALID_CATEGORIES.find((c) => r.includes(c.toLowerCase())); if (f) updated.category = f }
  if (!updated.type) {
    if (r.includes("debit") || r.includes("expense"))  updated.type = "Debit"
    if (r.includes("credit") || r.includes("income"))  updated.type = "Credit"
  }
  return updated
}

// ── Guided flow helpers ───────────────────────────────────────────────────────
function guidedCategoryFromReply(r: string): string {
  return VALID_CATEGORIES.find((c) => r.toLowerCase().includes(c.toLowerCase())) ?? "Other"
}

function guidedMethodFromReply(r: string): string {
  const l = r.toLowerCase()
  if (l.includes("cash") || l === "1")                                                return "Cash"
  if (l.includes("upi") || l.includes("gpay") || l.includes("phonepe") || l === "2") return "UPI"
  if (l.includes("credit") || l === "3")                                              return "Credit Card"
  if (l.includes("debit") || l === "4")                                               return "Debit Card"
  if (l.includes("bank") || l.includes("transfer") || l === "5")                     return "Bank Transfer"
  if (l.includes("net") || l === "6")                                                 return "Net Banking"
  return "Cash"
}

// ── Correction detection ──────────────────────────────────────────────────────
type FieldCorrection = { field: keyof TransactionDraft; value: string }

function detectCorrection(input: string): FieldCorrection | null {
  const s = input.trim()
  const l = s.toLowerCase()

  const cleanCorrectedName = (raw: string): string => {
    const withoutNot = raw.replace(/\s+not\s+\S+.*$/i, "").trim()
    return extractEntityName(withoutNot) || withoutNot
  }

  const namePatterns: [RegExp, number][] = [
    [/^no[,.]?\s+(?:the\s+)?name\s+(?:is|should be|=)\s+(.+)$/i, 1],
    [/^change\s+(?:the\s+)?name\s+to\s+(.+)$/i, 1],
    [/^(?:the\s+)?name\s+(?:is|should be)\s+(.+)$/i, 1],
    [/^(?:it'?s?|its)\s+(.+)$/i, 1],
    [/^wrong(?:\s+name)?,?\s+(?:it'?s?|its|the name is)\s+(.+)$/i, 1],
    [/^no[,.]?\s+(?:it'?s?|its)\s+(.+)$/i, 1],
  ]
  for (const [p, g] of namePatterns) {
    const m = s.match(p)
    if (m) return { field: "transaction", value: cleanCorrectedName(m[g].trim()) }
  }

  const catMatch = s.match(/(?:category\s+(?:is|should be|=)|change\s+category\s+to)\s+(.+)/i)
  if (catMatch) {
    const cat = guidedCategoryFromReply(catMatch[1])
    if (cat !== "Other" || VALID_CATEGORIES.map((c) => c.toLowerCase()).includes(catMatch[1].toLowerCase().trim())) {
      return { field: "category", value: cat }
    }
  }

  if (/(?:type\s+(?:is|should be)|make\s+it)\s+credit/i.test(l)) return { field: "type", value: "Credit" }
  if (/(?:type\s+(?:is|should be)|make\s+it)\s+debit/i.test(l))  return { field: "type", value: "Debit" }

  const methodMatch = s.match(/(?:method\s+(?:is|should be|=)|(?:paid|pay)\s+(?:via|with|by)|change\s+method\s+to)\s+(.+)/i)
  if (methodMatch) return { field: "method", value: guidedMethodFromReply(methodMatch[1]) }

  const amountMatch = s.match(/(?:amount\s+(?:is|should be|=)|change\s+amount\s+to)\s+(?:₹|rs\.?|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)/i)
  if (amountMatch) return { field: "amount", value: amountMatch[1].replace(/,/g, "") }

  return null
}

// ── Single confirm card ───────────────────────────────────────────────────────
function buildConfirmCard(draft: Partial<TransactionDraft>): string {
  return (
    `Here's what I'll add:\n\n` +
    `- **Name:** ${draft.transaction}\n` +
    `- **Amount:** ₹${(draft.amount as number).toLocaleString("en-IN")}\n` +
    `- **Category:** ${draft.category}\n` +
    `- **Type:** ${draft.type}\n` +
    `- **Method:** ${draft.method}\n` +
    `- **Date:** ${draft.date}\n\n` +
    `Shall I add this transaction? Reply **yes** to confirm or **no** to cancel.`
  )
}

// ── System prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(transactions: Transaction[], budgets: Budget[]): string {
  const now           = new Date()
  const currentMonth  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth     = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`

  const thisMonthTx  = transactions.filter((t) => t.date.startsWith(currentMonth))
  const lastMonthTx  = transactions.filter((t) => t.date.startsWith(lastMonth))
  const totalIncome  = transactions.filter((t) => t.type === "Credit").reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "Debit").reduce((s, t) => s + t.amount, 0)
  const monthIncome  = thisMonthTx.filter((t) => t.type === "Credit").reduce((s, t) => s + t.amount, 0)
  const monthExpense = thisMonthTx.filter((t) => t.type === "Debit").reduce((s, t) => s + t.amount, 0)
  const lastMonthExp = lastMonthTx.filter((t) => t.type === "Debit").reduce((s, t) => s + t.amount, 0)

  const catMap: Record<string, number> = {}
  thisMonthTx.filter((t) => t.type === "Debit").forEach((t) => { catMap[t.category] = (catMap[t.category] ?? 0) + t.amount })
  const catStr      = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([c, a]) => `  • ${c}: ₹${a.toLocaleString("en-IN")}`).join("\n") || "  No expense data"
  const budgetLines = budgets.length
    ? budgets.map((b) => { const pct = b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0; return `  • ${b.category}: ₹${b.spent.toLocaleString("en-IN")} / ₹${b.amount.toLocaleString("en-IN")} (${pct}%)${b.spent > b.amount ? " ⚠️ OVER" : pct > 75 ? " ⚡ near limit" : ""}` }).join("\n")
    : "  No budgets set"
  const recentLines = transactions.slice(0, 15).map((t) => `  ${t.date} | ${t.transaction} | ${t.type === "Credit" ? "+" : "-"}₹${t.amount.toLocaleString("en-IN")} | ${t.category} | ${t.method}`).join("\n") || "  No transactions yet"

  return `You are FinEase AI, a smart and friendly personal finance assistant for Indian users.

━━━ FINANCIAL SNAPSHOT ━━━
Overall: Income ₹${totalIncome.toLocaleString("en-IN")} | Expenses ₹${totalExpense.toLocaleString("en-IN")} | Balance ₹${(totalIncome - totalExpense).toLocaleString("en-IN")}
This month (${currentMonth}): Income ₹${monthIncome.toLocaleString("en-IN")} | Expenses ₹${monthExpense.toLocaleString("en-IN")} | Saved ₹${(monthIncome - monthExpense).toLocaleString("en-IN")}
Last month expenses: ₹${lastMonthExp.toLocaleString("en-IN")}
Categories:\n${catStr}
Budgets:\n${budgetLines}
Recent:\n${recentLines}

━━━ RULES ━━━
1. Real data only. Use ₹ Indian numbering.
2. Short for casual, bullets for lists, structured for analysis.
3. Bold key numbers/names only.
4. Warm and practical — Indian context (UPI, EMI, SIP).
5. Casual < 100 words. Analysis < 250 words.
6. NEVER add transactions yourself — the app handles DB writes.`
}

// ── Groq ──────────────────────────────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL   = "llama-3.1-8b-instant"

async function callGroq(apiKey: string, systemPrompt: string, history: Message[]): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...history.map((m) => ({ role: m.role, content: m.content }))],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `Groq error (${res.status})`) }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a response."
}

// ── Bulk add helper ───────────────────────────────────────────────────────────
async function addDrafts(
  drafts: Partial<TransactionDraft>[],
  onAddTransaction: Props["onAddTransaction"]
): Promise<{ added: Partial<TransactionDraft>[]; failed: string[] }> {
  const added:  Partial<TransactionDraft>[] = []
  const failed: string[] = []
  for (const d of drafts) {
    const draft = d as TransactionDraft
    try {
      const result = await onAddTransaction({
        transaction: draft.transaction,
        category:    draft.category   || inferCategory(draft.transaction),
        amount:      draft.amount,
        date:        draft.date       || format(new Date(), "yyyy-MM-dd"),
        type:        draft.type       || "Debit",
        method:      draft.method     || "Cash",
        status:      "Completed",
      })
      if (result?.error) failed.push(draft.transaction)
      else               added.push(d)
    } catch {
      failed.push(draft.transaction)
    }
  }
  return { added, failed }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAIChat({
  transactions, budgets, onAddTransaction,
  messages, setMessages,
  pendingDraft, setPendingDraft,
  guidedStep, setGuidedStep,
}: Props) {
  const [loading,   setLoading]   = useState(false)
  const [bulkState, setBulkState] = useState<BulkState | null>(null)

  const addMessage = (msg: Omit<Message, "id">) => {
    const id = `${msg.role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setMessages((prev) => [...prev, { ...msg, id }])
  }

  const startGuidedFlow = () => {
    if (loading) return
    setPendingDraft({})
    setGuidedStep("name")
    addMessage({ role: "assistant", content: `Sure! Let's log a transaction. 📝\n\nWhat did you spend on (or receive)? *(e.g. Groceries, Netflix, Salary)*` })
  }

  const cancelGuidedFlow = () => {
    setPendingDraft(null)
    setGuidedStep("idle")
    addMessage({ role: "assistant", content: "Transaction entry cancelled. Anything else I can help with?" })
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const apiKey = import.meta.env.VITE_GROQ_API_KEY as string
    if (!apiKey) {
      addMessage({ role: "assistant", content: "⚠️ Groq API key not found. Add VITE_GROQ_API_KEY to your .env and restart." })
      return
    }

    // Global cancel
    if (/^(cancel|stop|quit|exit|abort|nahi|nope)$/i.test(content.trim()) && (guidedStep !== "idle" || pendingDraft || bulkState)) {
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content }])
      setBulkState(null)
      cancelGuidedFlow()
      return
    }

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: content.trim() }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const reply = content.toLowerCase().trim()
      const isYes = /^(yes|y|confirm|ok|haan|ha|sure|add|add it|yep|yeah)$/i.test(reply)
      const isNo  = /^(no|n|nahi|nope|don'?t|dont|skip|cancel)$/i.test(reply)

      // ════════════════════════════════════════════════════════════════════
      // BULK FLOW
      // ════════════════════════════════════════════════════════════════════
      if (bulkState) {

        // Step 1 — Confirm adding new (unique) transactions
        if (bulkState.step === "preview") {
          if (isYes) {
            if (bulkState.unique.length > 0) {
              const { added, failed } = await addDrafts(bulkState.unique, onAddTransaction)

              const parts: string[] = []
              if (added.length > 0) {
                parts.push(
                  `✅ Added **${added.length}** transaction${added.length > 1 ? "s" : ""}:\n` +
                  added.map((d) => `  • **${d.transaction}** — ₹${(d.amount as number).toLocaleString("en-IN")} (${d.date})`).join("\n")
                )
              }
              if (failed.length > 0) {
                parts.push(`⚠️ Failed to add: ${failed.map((n) => `**${n}**`).join(", ")}`)
              }

              if (bulkState.duplicates.length > 0) {
                // Move to dup-ask step
                setBulkState({ ...bulkState, step: "dup-ask" })
                parts.push(buildDupAskCard(bulkState.duplicates))
              } else {
                setBulkState(null)
                parts.push("All done! Anything else?")
              }
              addMessage({ role: "assistant", content: parts.join("\n\n") })

            } else {
              // unique is empty — only duplicates exist, go straight to dup-ask
              setBulkState({ ...bulkState, step: "dup-ask" })
              addMessage({ role: "assistant", content: buildDupAskCard(bulkState.duplicates) })
            }

          } else if (isNo) {
            setBulkState(null)
            addMessage({ role: "assistant", content: "Import cancelled. Let me know if you want to try again!" })

          } else {
            // Unclear — re-show preview
            addMessage({ role: "assistant", content: `Please reply **yes** to confirm or **no** to cancel.\n\n${buildBulkPreviewCard(bulkState.unique, bulkState.duplicates)}` })
          }

          setLoading(false)
          return
        }

        // Step 2 — Ask about duplicates
        if (bulkState.step === "dup-ask") {
          if (isYes) {
            const { added, failed } = await addDrafts(bulkState.duplicates, onAddTransaction)
            setBulkState(null)
            const parts: string[] = []
            if (added.length > 0) {
              parts.push(
                `✅ Added **${added.length}** duplicate transaction${added.length > 1 ? "s" : ""} too:\n` +
                added.map((d) => `  • **${d.transaction}** — ₹${(d.amount as number).toLocaleString("en-IN")} (${d.date})`).join("\n")
              )
            }
            if (failed.length > 0) {
              parts.push(`⚠️ Failed: ${failed.map((n) => `**${n}**`).join(", ")}`)
            }
            addMessage({ role: "assistant", content: parts.join("\n\n") + "\n\nAll done! Anything else?" })

          } else if (isNo) {
            setBulkState(null)
            addMessage({ role: "assistant", content: "Got it — duplicates skipped. All done! Anything else?" })

          } else {
            addMessage({ role: "assistant", content: "Please reply **yes** to add the duplicates or **no** to skip them." })
          }

          setLoading(false)
          return
        }
      }

      // ════════════════════════════════════════════════════════════════════
      // GUIDED FLOW
      // ════════════════════════════════════════════════════════════════════
      if (guidedStep !== "idle" && guidedStep !== "done") {
        switch (guidedStep) {
          case "name": {
            const name     = extractEntityName(content.trim())
            const category = inferCategory(name)
            const type     = category === "Income" ? "Credit" : "Debit"
            const newDraft: Partial<TransactionDraft> = {
              transaction: name, category, type,
              date: format(new Date(), "yyyy-MM-dd"), status: "Completed",
            }
            setPendingDraft(newDraft)
            setGuidedStep("amount")
            const inferMsg = category !== "Other"
              ? `\n\n*(Auto-detected: **${category}** · **${type}** — tell me if that's wrong)*`
              : ""
            addMessage({ role: "assistant", content: `Got it — **${name}**.${inferMsg}\n\nHow much? *(just the number, e.g. 500)*` })
            break
          }
          case "amount": {
            const amount = parseFloat(content.replace(/[₹,\s]/g, "").replace(/rs\.?|inr|rupees?/gi, ""))
            if (isNaN(amount) || amount <= 0) {
              addMessage({ role: "assistant", content: "That doesn't look like a valid amount. Please enter a number like **500** or **1,200**." })
              break
            }
            const updatedDraft = { ...pendingDraft, amount }
            setPendingDraft(updatedDraft)
            if (updatedDraft.category && updatedDraft.type) {
              setGuidedStep("method")
              addMessage({ role: "assistant", content: `**₹${amount.toLocaleString("en-IN")}** noted.\n\nHow did you pay / receive?\n- Cash\n- UPI\n- Credit Card\n- Debit Card\n- Bank Transfer\n- Net Banking` })
            } else {
              setGuidedStep("category")
              addMessage({ role: "assistant", content: `**₹${amount.toLocaleString("en-IN")}** noted.\n\nWhich category fits best?\n- Food\n- Shopping\n- Transport\n- Utilities\n- Health\n- Entertainment\n- Subscription\n- Other` })
            }
            break
          }
          case "category": {
            const cat          = guidedCategoryFromReply(content)
            const inferredType = cat === "Income" ? "Credit" : "Debit"
            const updatedDraft = { ...pendingDraft, category: cat, type: inferredType }
            setPendingDraft(updatedDraft)
            setGuidedStep("method")
            addMessage({ role: "assistant", content: `Category: **${cat}** · Type: **${inferredType}**.\n\nHow did you pay / receive?\n- Cash\n- UPI\n- Credit Card\n- Debit Card\n- Bank Transfer\n- Net Banking` })
            break
          }
          case "method": {
            const method     = guidedMethodFromReply(content)
            const finalDraft = { ...pendingDraft, method } as TransactionDraft
            setPendingDraft(finalDraft)
            setGuidedStep("confirm")
            addMessage({ role: "assistant", content: buildConfirmCard(finalDraft) })
            break
          }
          case "confirm": {
            const correction = !isYes && !isNo ? detectCorrection(content) : null
            if (correction) {
              const corrected = {
                ...pendingDraft,
                [correction.field]: correction.field === "amount"
                  ? parseFloat(correction.value)
                  : correction.field === "transaction"
                    ? (correction.value.charAt(0).toUpperCase() + correction.value.slice(1))
                    : correction.value,
              } as Partial<TransactionDraft>
              if (correction.field === "transaction") {
                corrected.category = inferCategory(correction.value)
                corrected.type     = corrected.category === "Income" ? "Credit" : "Debit"
              }
              setPendingDraft(corrected)
              addMessage({ role: "assistant", content: `Updated! ${buildConfirmCard(corrected)}` })
              break
            }
            if (isYes && pendingDraft) {
              const draft  = pendingDraft as TransactionDraft
              const result = await onAddTransaction({
                transaction: draft.transaction, category: draft.category,
                amount: draft.amount, date: draft.date, type: draft.type,
                method: draft.method, status: "Completed",
              })
              setPendingDraft(null); setGuidedStep("idle")
              addMessage({
                role: "assistant",
                content: result?.error
                  ? `⚠️ Failed to add: ${result.error}`
                  : `✅ Done! **${draft.transaction}** of **₹${draft.amount.toLocaleString("en-IN")}** has been added.\n\nAnything else you'd like to track?`,
              })
            } else if (isNo) {
              cancelGuidedFlow()
            } else {
              addMessage({ role: "assistant", content: `Please reply **yes** to confirm, **no** to cancel, or tell me what to fix *(e.g. "name is Netflix", "category is Food")*.` })
            }
            break
          }
        }
        setLoading(false)
        return
      }

      // ════════════════════════════════════════════════════════════════════
      // FREE-TEXT FLOW
      // ════════════════════════════════════════════════════════════════════

      // CASE 0: Bulk import — show preview first, never add immediately
      const bulkDrafts = detectBulkImport(content)
      if (bulkDrafts) {
        const unique:     Partial<TransactionDraft>[] = []
        const duplicates: Partial<TransactionDraft>[] = []
        for (const d of bulkDrafts) {
          if (isDuplicate(d, transactions)) duplicates.push(d)
          else                              unique.push(d)
        }
        setBulkState({ step: "preview", unique, duplicates })
        addMessage({ role: "assistant", content: buildBulkPreviewCard(unique, duplicates) })
        setLoading(false)
        return
      }

      // CASE 1: Full draft pending — yes/no/correction
      if (pendingDraft && (pendingDraft as TransactionDraft).method) {
        const correction = !isYes && !isNo ? detectCorrection(content) : null
        if (correction) {
          const corrected = {
            ...pendingDraft,
            [correction.field]: correction.field === "amount"
              ? parseFloat(correction.value)
              : correction.field === "transaction"
                ? (correction.value.charAt(0).toUpperCase() + correction.value.slice(1))
                : correction.value,
          } as Partial<TransactionDraft>
          if (correction.field === "transaction") {
            corrected.category = inferCategory(correction.value)
            corrected.type     = corrected.category === "Income" ? "Credit" : "Debit"
          }
          setPendingDraft(corrected)
          addMessage({ role: "assistant", content: `Updated! ${buildConfirmCard(corrected)}` })
          setLoading(false)
          return
        }
        if (isYes) {
          const draft  = pendingDraft as TransactionDraft
          const result = await onAddTransaction({
            transaction: draft.transaction, category: draft.category,
            amount: draft.amount, date: draft.date, type: draft.type,
            method: draft.method, status: "Completed",
          })
          setPendingDraft(null)
          addMessage({
            role: "assistant",
            content: result?.error
              ? `⚠️ Failed: ${result.error}`
              : `✅ Done! **${draft.transaction}** of **₹${draft.amount.toLocaleString("en-IN")}** has been added. Anything else?`,
          })
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

      // CASE 2: Partial draft — fill missing fields
      if (pendingDraft && !(pendingDraft as TransactionDraft).method) {
        const updated = fillDraftFromReply(content, pendingDraft)
        const missing = getMissingFields(updated)
        setPendingDraft(updated)
        addMessage({ role: "assistant", content: missing.length > 0 ? buildMissingFieldQuestion(missing, updated) : buildConfirmCard(updated) })
        setLoading(false)
        return
      }

      // CASE 3: Receipt scan single message → confirm card
      const receiptDraft = detectReceiptTransaction(content)
      if (receiptDraft) {
        setPendingDraft(receiptDraft)
        addMessage({ role: "assistant", content: buildConfirmCard(receiptDraft) })
        setLoading(false)
        return
      }

      // CASE 4: Detect transaction intent in free text
      const detected = detectTransactionIntent(content)
      if (detected) {
        const missing = getMissingFields(detected)
        setPendingDraft(detected)
        addMessage({ role: "assistant", content: missing.length > 0 ? buildMissingFieldQuestion(missing, detected) : buildConfirmCard(detected) })
        setLoading(false)
        return
      }

      // CASE 5: General question → Groq
      const text = await callGroq(apiKey, buildSystemPrompt(transactions, budgets), [...messages, userMsg])
      addMessage({ role: "assistant", content: text })

    } catch (err) {
      addMessage({ role: "assistant", content: `⚠️ ${err instanceof Error ? err.message : "Something went wrong."}` })
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setPendingDraft(null)
    setGuidedStep("idle")
    setBulkState(null)
  }

  return { loading, sendMessage, clearChat, startGuidedFlow, cancelGuidedFlow }
}