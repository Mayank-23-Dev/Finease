// src/lib/scan-receipt.ts

export type ScannedReceipt = {
  transaction?: string
  amount?:      number
  date?:        string
  category?:    string
  method?:      string
  type?:        "Debit" | "Credit"
  confidence:   "high" | "medium" | "low"
  raw?:         string
}

export type ScannedReceiptMulti = {
  transactions: ScannedReceipt[]
  confidence:   "high" | "medium" | "low"
  raw?:         string
}

// Single receipt / bill image
const SINGLE_PROMPT = `You are a receipt data extractor for an Indian finance app.
Analyze this receipt/bill image and extract transaction details.
Respond ONLY with a valid JSON object — no markdown, no explanation, no backticks.

JSON format:
{
  "transaction": "merchant name or transaction description",
  "amount": 5000,
  "date": "2026-04-20",
  "category": "Food",
  "method": "UPI",
  "type": "Debit",
  "confidence": "high"
}

Rules:
- amount must be a plain number like 499 — no ₹ symbol
- date must be yyyy-MM-dd format or null
- category must be one of: Income, Subscription, Food, Shopping, Utilities, Transport, Health, Entertainment, Other
- method must be one of: UPI, Credit Card, Debit Card, Net Banking, Cash, Bank Transfer, or null
- type must be exactly "Debit" or "Credit"
- NEVER return markdown or backticks — raw JSON only`

// Screenshot / statement with possibly multiple transactions
const MULTI_PROMPT = `You are a transaction extractor for an Indian finance app.
This image may be a bank statement, UPI app screenshot, or list of transactions.
Extract ALL transactions visible in the image.
Respond ONLY with a valid JSON array — no markdown, no explanation, no backticks.

JSON format:
[
  {
    "transaction": "merchant or description",
    "amount": 500,
    "date": "2026-04-20",
    "category": "Food",
    "method": "UPI",
    "type": "Debit",
    "confidence": "high"
  }
]

Rules:
- amount is always a plain positive number — no ₹ symbol
- date must be yyyy-MM-dd; if unclear use today's date
- category: Income | Subscription | Food | Shopping | Utilities | Transport | Health | Entertainment | Other
- method: UPI | Credit Card | Debit Card | Net Banking | Cash | Bank Transfer — or null if unclear
- type: "Debit" for money going out, "Credit" for money coming in
- If only 1 transaction visible, still return a JSON array with 1 item
- NEVER return markdown or backticks — raw JSON array only`

// ── Image compression ─────────────────────────────────────────────────────────
function compressImage(file: File, maxPx = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round((height * maxPx) / width); width = maxPx }
        else                { width = Math.round((width * maxPx) / height);  height = maxPx }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas not supported"))
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      const base64  = dataUrl.split(",")[1]
      console.log("[scan-receipt] Compressed:", Math.round(base64.length * 0.75 / 1024), "KB")
      resolve(base64)
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")) }
    img.src = url
  })
}

// ── Call Groq vision model ────────────────────────────────────────────────────
async function callGroqVision(apiKey: string, base64: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model:       "meta-llama/llama-4-scout-17b-16e-instruct",
      max_tokens:  1024,
      temperature: 0.1,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
          { type: "text",      text: prompt },
        ],
      }],
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err?.error?.message ?? `Groq API error ${response.status}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content?.trim() ?? ""
}

// ── Single receipt scan ───────────────────────────────────────────────────────
export async function scanReceipt(imageFile: File): Promise<ScannedReceipt> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error("VITE_GROQ_API_KEY is not set in .env")

  console.log("[scan-receipt] Single scan:", imageFile.name, imageFile.size, "bytes")
  const base64 = await compressImage(imageFile)
  const text   = await callGroqVision(apiKey, base64, SINGLE_PROMPT)
  console.log("[scan-receipt] Response:", text)

  const clean = text.replace(/```json|```/g, "").trim()
  try {
    return JSON.parse(clean) as ScannedReceipt
  } catch {
    return { confidence: "low", raw: text }
  }
}

// ── Multi-transaction screenshot scan ────────────────────────────────────────
export async function scanReceiptMulti(imageFile: File): Promise<ScannedReceiptMulti> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) throw new Error("VITE_GROQ_API_KEY is not set in .env")

  console.log("[scan-receipt] Multi scan:", imageFile.name, imageFile.size, "bytes")
  const base64 = await compressImage(imageFile, 1280) // slightly larger for statements
  const text   = await callGroqVision(apiKey, base64, MULTI_PROMPT)
  console.log("[scan-receipt] Multi response:", text)

  const clean = text.replace(/```json|```/g, "").trim()
  try {
    const parsed = JSON.parse(clean)
    // Accept both array and single object
    const arr: ScannedReceipt[] = Array.isArray(parsed) ? parsed : [parsed]
    const overallConf = arr.every((t) => t.confidence === "high")
      ? "high"
      : arr.some((t) => t.confidence === "low")
      ? "low"
      : "medium"
    return { transactions: arr, confidence: overallConf }
  } catch {
    return { transactions: [], confidence: "low", raw: text }
  }
}