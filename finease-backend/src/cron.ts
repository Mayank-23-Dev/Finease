import cron from "node-cron"
import { createClient } from "@supabase/supabase-js"
import { fetchUPIEmails } from "./gmail"
import { parseEmailWithAI } from "./parser"
import dotenv from "dotenv"

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function processAllUsers() {
  console.log(`[cron] Running at ${new Date().toISOString()}`)

  // Get all users who have connected Gmail
  const { data: tokens, error } = await supabase
    .from("gmail_tokens")
    .select("firebase_uid")

  if (error) { console.error("[cron] Failed to fetch users:", error.message); return }
  if (!tokens?.length) { console.log("[cron] No users with Gmail connected"); return }

  console.log(`[cron] Processing ${tokens.length} users`)

  for (const { firebase_uid } of tokens) {
    try {
      console.log(`[cron] Fetching emails for ${firebase_uid}`)
      const emails = await fetchUPIEmails(firebase_uid)
      console.log(`[cron] Found ${emails.length} new emails`)

      for (const email of emails) {
        const parsed = await parseEmailWithAI(email.subject, email.body)

        if (!parsed) {
          // Mark as processed even if skipped so we don't re-check it
          await supabase.from("processed_emails").insert({
            firebase_uid,
            gmail_id: email.id,
          })
          continue
        }

        // Insert transaction into Supabase
        const { error: txError } = await supabase
          .from("transactions")
          .insert({
            firebase_uid,
            transaction: parsed.transaction,
            category:    parsed.category,
            amount:      parsed.amount,
            date:        parsed.date,
            type:        parsed.type,
            method:      parsed.method,
            status:      parsed.status,
          })

        if (txError) {
          console.error(`[cron] Failed to insert transaction:`, txError.message)
        } else {
          console.log(`[cron] ✅ Added: ${parsed.transaction} ₹${parsed.amount}`)
        }

        // Mark email as processed
        await supabase.from("processed_emails").insert({
          firebase_uid,
          gmail_id: email.id,
        })
      }
    } catch (err: any) {
      console.error(`[cron] Error for user ${firebase_uid}:`, err.message)
    }
  }
}

export function startCron() {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", processAllUsers)
  console.log("[cron] Scheduler started — runs every 15 minutes")

  // Also run immediately on startup
  processAllUsers()
}