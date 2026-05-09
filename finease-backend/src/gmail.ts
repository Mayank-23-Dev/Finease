import { google } from "googleapis"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ── OAuth2 client ─────────────────────────────────────────────
export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

// ── Generate auth URL ─────────────────────────────────────────
export function getAuthUrl(firebaseUid: string): string {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    // ✅ Always force consent so Google always returns refresh_token
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    state: firebaseUid,
  })
}

// ── Handle callback — save tokens to Supabase ─────────────────
export async function handleCallback(code: string, firebaseUid: string) {
  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)

  // ✅ FIX: If no refresh_token in new response, reuse the existing one from DB
  let refreshToken = tokens.refresh_token

  if (!refreshToken) {
    // Try to fetch existing refresh_token from DB
    const { data: existing } = await supabase
      .from("gmail_tokens")
      .select("refresh_token")
      .eq("firebase_uid", firebaseUid)
      .maybeSingle()

    if (existing?.refresh_token) {
      // Reuse the old refresh_token
      refreshToken = existing.refresh_token
      console.log(`Reusing existing refresh_token for user ${firebaseUid}`)
    } else {
      // Truly no refresh token anywhere — force re-consent next time
      throw new Error("No refresh token received and none stored. User must re-authorize.")
    }
  }

  const { error } = await supabase
    .from("gmail_tokens")
    .upsert(
      {
        firebase_uid: firebaseUid,
        access_token: tokens.access_token,
        refresh_token: refreshToken,       // ✅ Always has a value now
        expiry_date: tokens.expiry_date,
      },
      { onConflict: "firebase_uid" }
    )

  if (error) throw new Error(error.message)
  console.log(`Gmail connected for user ${firebaseUid} ✅`)
}

// ── Get OAuth client for a specific user ─────────────────────
export async function getClientForUser(firebaseUid: string) {
  const { data, error } = await supabase
    .from("gmail_tokens")
    .select("*")
    .eq("firebase_uid", firebaseUid)
    .single()

  if (error || !data) throw new Error("No Gmail token found for user")

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: data.expiry_date,
  })

  // Auto refresh token if expired
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await supabase
        .from("gmail_tokens")
        .update({
          access_token: tokens.access_token,
          expiry_date: tokens.expiry_date,
        })
        .eq("firebase_uid", firebaseUid)
    }
  })

  return oauth2Client
}

// ── Fetch new UPI/bank emails ─────────────────────────────────
export async function fetchUPIEmails(firebaseUid: string) {
  const auth = await getClientForUser(firebaseUid)
  const gmail = google.gmail({ version: "v1", auth })

  // Search for UPI/bank transaction emails from last 2 days
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "subject:(UPI OR transaction OR debited OR credited OR payment) newer_than:2d",
    maxResults: 20,
  })

  const messages = res.data.messages || []
  const results: Array<{ id: string; body: string; subject: string }> = []

  for (const msg of messages) {
    // Skip already processed emails
    const { data: existing } = await supabase
      .from("processed_emails")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .eq("gmail_id", msg.id!)
      .maybeSingle() // ✅ use maybeSingle here too

    if (existing) continue

    // Fetch full email
    const full = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    })

    const headers = full.data.payload?.headers || []
    const subject = headers.find((h) => h.name === "Subject")?.value || ""

    // Extract email body
    let body = ""
    const parts = full.data.payload?.parts || []
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8")
        break
      }
    }
    if (!body && full.data.payload?.body?.data) {
      body = Buffer.from(full.data.payload.body.data, "base64").toString("utf-8")
    }

    if (body) results.push({ id: msg.id!, body, subject })
  }

  return results
}