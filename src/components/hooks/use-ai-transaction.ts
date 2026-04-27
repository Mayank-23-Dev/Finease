import { useState } from "react"
import { format }   from "date-fns"

export type AITransactionResult = {
  transaction: string
  amount:      number | null
  category:    string
  type:        "Debit" | "Credit"
  method:      string | null
  date:        string | null
  confidence:  number
  reasoning:   string
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

const SYSTEM_PROMPT = `You are a smart Indian personal finance assistant. 
Your job is to extract and intelligently parse transaction details from what the user says.

Given a user message, extract and return a JSON object with these fields:
- transaction: string — clean, properly capitalized merchant/payee name (e.g. "MX Player", "Zomato", "Kanpur Electricity Supply")
- amount: number | null — numeric amount in INR, null if not mentioned
- category: one of ["Food", "Shopping", "Transport", "Utilities", "Health", "Entertainment", "Subscription", "Income", "Other"]
- type: "Debit" | "Credit"
- method: one of ["Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Net Banking"] | null — null if not mentioned
- date: string in "yyyy-MM-dd" format | null — null if not mentioned, today's date if "today/aaj" mentioned
- confidence: number 0-1 — how confident you are in the extraction
- reasoning: string — brief explanation of your decisions

Rules:
- Clean up Hinglish, slang, and informal phrasing (e.g. "kahin MXPlayer pe kiye the" → transaction: "MX Player", category: "Subscription")
- Infer category from context intelligently
- If something sounds like income/salary/received, set type to "Credit"
- All expenses are "Debit"
- Return ONLY valid JSON, no markdown, no explanation outside JSON`

export function useAITransaction() {
  const [loading, setLoading] = useState(false)

  const parseTransaction = async (message: string): Promise<AITransactionResult | null> => {
    if (!message.trim()) return null
    setLoading(true)

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY as string
      if (!apiKey) {
        console.error("[useAITransaction] VITE_GROQ_API_KEY not set")
        return null
      }

      const today = format(new Date(), "yyyy-MM-dd")

      const res = await fetch(GROQ_API_URL, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:           "meta-llama/llama-4-maverick-17b-128e-instruct",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + `\n\nToday's date is ${today}.` },
            { role: "user",   content: message },
          ],
          temperature:     0.2,
          max_tokens:      300,
          response_format: { type: "json_object" },
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error("[useAITransaction] Groq error:", err)
        return null
      }

      const data    = await res.json()
      const content = data?.choices?.[0]?.message?.content ?? "{}"
      const parsed  = JSON.parse(content)

      return {
        transaction: parsed.transaction ?? message,
        amount:      typeof parsed.amount === "number" ? parsed.amount : null,
        category:    parsed.category  ?? "Other",
        type:        parsed.type      ?? "Debit",
        method:      parsed.method    ?? null,
        date:        parsed.date      ?? today,
        confidence:  parsed.confidence ?? 0.5,
        reasoning:   parsed.reasoning  ?? "",
      }
    } catch (err) {
      console.error("[useAITransaction] Fetch error:", err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { parseTransaction, loading }
}