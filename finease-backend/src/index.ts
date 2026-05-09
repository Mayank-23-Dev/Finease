import cors from "cors"
import express from "express"
import dotenv from "dotenv"
import { getAuthUrl, handleCallback } from "./gmail"
import { startCron } from "./cron"
import stockRouter from "./stock"

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: "*" }))
app.use(express.json())
app.use("/stock", stockRouter)

// ── Gmail OAuth routes ────────────────────────────────────────
app.get("/auth/gmail", (req, res) => {
  const firebaseUid = req.query.uid as string
  if (!firebaseUid) return res.status(400).json({ error: "uid required" })
  const url = getAuthUrl(firebaseUid)
  res.redirect(url)
})

app.get("/auth/gmail/callback", async (req, res) => {
  const code  = req.query.code  as string
  const state = req.query.state as string
  if (!code || !state) return res.status(400).json({ error: "Missing code or state" })

  try {
    await handleCallback(code, state)
    res.redirect("https://finease.tech/dashboard/settings?gmail=connected")
  } catch (err: any) {
    console.error("Callback error:", err.message)
    res.redirect("https://finease.tech/dashboard/settings?gmail=error")
  }
})

// ── Health check ──────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }))

app.listen(PORT, () => {
  console.log(`FinEase backend running on port ${PORT}`)
  startCron()
})