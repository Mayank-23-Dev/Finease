// src/components/hooks/use-budgets.ts
import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/hooks/use-auth"

export type Budget = {
  id:           string
  firebase_uid: string
  category:     string
  amount:       number
  spent:        number
  month:        string
  duration:     string
  created_at?:  string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

/** Zero-based absolute month index (2026-04 -> 2026*12+3 = 24315) */
function monthIndex(ym: string) {
  const [y, m] = ym.split("-").map(Number)
  return y * 12 + (m - 1)
}

/** How many calendar months does a duration string span? null = infinite */
function durationToMonths(duration: string): number | null {
  switch (duration) {
    case "timeless":  return null
    case "monthly":   return 1
    case "3months":   return 3
    case "6months":   return 6
    case "12months":  return 12
    default:          return 1
  }
}

/**
 * Should a budget row (created for `createdMonth` with `duration`)
 * be displayed when viewing `viewMonth`?
 *
 * monthly  -> only its creation month, never before/after
 * 3months  -> creation + 2 more months  (Apr -> Apr, May, Jun)
 * timeless -> creation month onwards forever
 */
function isBudgetActiveForMonth(
  createdMonth: string,
  duration: string,
  viewMonth: string
): boolean {
  const startIdx = monthIndex(createdMonth)
  const viewIdx  = monthIndex(viewMonth)

  // Never show before creation month
  if (viewIdx < startIdx) return false

  // Monthly: only exact creation month
  if (duration === "monthly") return viewIdx === startIdx

  const span = durationToMonths(duration)
  if (span === null) return true  // timeless

  // Active for exactly `span` months: [startIdx, startIdx + span)
  return viewIdx < startIdx + span
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBudgets() {
  const { user } = useAuth()
  const [budgets,       setBudgets]       = useState<Budget[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)
  const [totalCap,      setTotalCap]      = useState<number | null>(null)

  // Ref so realtime callbacks always read the latest selectedMonth
  const selectedMonthRef = useRef(selectedMonth)
  useEffect(() => { selectedMonthRef.current = selectedMonth }, [selectedMonth])

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchBudgets = useCallback(async (month: string) => {
    if (!user) return
    setLoading(true)

    // Look back up to 12 months to catch carry-over budgets
    const [sY, sM] = month.split("-").map(Number)
    const lookbackDate  = new Date(sY, sM - 1 - 12, 1)
    const lookbackMonth = `${lookbackDate.getFullYear()}-${String(lookbackDate.getMonth() + 1).padStart(2, "0")}`

    const { data: allRows, error: bErr } = await supabase
      .from("budgets")
      .select("*")
      .eq("firebase_uid", user.uid)
      .gte("month", lookbackMonth)
      .order("month", { ascending: true })

    if (bErr) { setError(bErr.message); setLoading(false); return }

    // Filter to rows whose duration window covers the selected month
    const activeRows = (allRows || []).filter((b) =>
      isBudgetActiveForMonth(b.month, b.duration ?? "monthly", month)
    )

    // De-duplicate by category — prefer exact-month row over carry-over
    const seen = new Map<string, typeof activeRows[0]>()
    for (const row of activeRows) {
      const existing = seen.get(row.category)
      if (!existing || row.month === month) {
        seen.set(row.category, row)
      }
    }
    const dedupedRows = Array.from(seen.values())

    // Fetch spending for selected month
    const [year, mon] = month.split("-").map(Number)
    const lastDay = new Date(year, mon, 0).getDate()

    const { data: txRows, error: tErr } = await supabase
      .from("transactions")
      .select("category, amount, type")
      .eq("firebase_uid", user.uid)
      .eq("type", "Debit")
      .gte("date", `${month}-01`)
      .lte("date", `${month}-${String(lastDay).padStart(2, "0")}`)

    if (tErr) { setError(tErr.message); setLoading(false); return }

    const spentMap: Record<string, number> = {}
    ;(txRows || []).forEach((t) => {
      spentMap[t.category] = (spentMap[t.category] ?? 0) + Number(t.amount)
    })

    const enriched: Budget[] = dedupedRows.map((b) => ({
      ...b,
      amount:   Number(b.amount),
      spent:    spentMap[b.category] ?? 0,
      duration: b.duration ?? "monthly",
    }))

    setBudgets(enriched)

    // Fetch manual total budget cap for this month
    const { data: capRow } = await supabase
      .from("user_budget_caps")
      .select("total_cap")
      .eq("firebase_uid", user.uid)
      .eq("month", month)
      .maybeSingle()

    setTotalCap(capRow?.total_cap ?? null)
    setLoading(false)
  }, [user])

  // ── realtime subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`budgets-rt-${user.uid}`)
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "budgets",
          filter: `firebase_uid=eq.${user.uid}`,
        },
        () => fetchBudgets(selectedMonthRef.current)
      )
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "transactions",
          filter: `firebase_uid=eq.${user.uid}`,
        },
        () => fetchBudgets(selectedMonthRef.current)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchBudgets])

  // ── add ──────────────────────────────────────────────────────────────────
  const addBudget = async ({
    category, amount, duration,
  }: { category: string; amount: number; duration: string }) => {
    if (!user) return { error: "Not logged in" }

    // Monthly always anchors to real current month, never the browsed month
    const creationMonth = duration === "monthly" ? getCurrentMonth() : selectedMonth

    const { data, error } = await supabase
      .from("budgets")
      .upsert(
        { firebase_uid: user.uid, category, amount, month: creationMonth, duration },
        { onConflict: "firebase_uid,category,month" }
      )
      .select()
      .single()

    if (error) { setError(error.message); return { error: error.message } }
    await fetchBudgets(selectedMonth)
    return { data }
  }

  // ── update ───────────────────────────────────────────────────────────────
  const updateBudget = async (
    id: string,
    updates: { category: string; amount: number; duration: string }
  ) => {
    if (!user) return { error: "Not logged in" }

    const { data, error } = await supabase
      .from("budgets")
      .update({ category: updates.category, amount: updates.amount, duration: updates.duration })
      .eq("id", id)
      .eq("firebase_uid", user.uid)
      .select()
      .single()

    if (error) { setError(error.message); return { error: error.message } }
    await fetchBudgets(selectedMonth)
    return { data }
  }

  // ── delete ───────────────────────────────────────────────────────────────
  const deleteBudget = async (id: string) => {
    if (!user) return
    const { error } = await supabase.from("budgets").delete().eq("id", id)
    if (error) setError(error.message)
    else setBudgets((prev) => prev.filter((b) => b.id !== id))
  }

  // ── total cap ────────────────────────────────────────────────────────────
  const setMonthlyTotalCap = async (cap: number | null) => {
    if (!user) return { error: "Not logged in" }

    if (cap === null) {
      await supabase
        .from("user_budget_caps")
        .delete()
        .eq("firebase_uid", user.uid)
        .eq("month", selectedMonth)
      setTotalCap(null)
      return {}
    }

    const { error } = await supabase
      .from("user_budget_caps")
      .upsert(
        { firebase_uid: user.uid, month: selectedMonth, total_cap: cap },
        { onConflict: "firebase_uid,month" }
      )

    if (error) return { error: error.message }
    setTotalCap(cap)
    return {}
  }

  // ── initial load + month navigation ─────────────────────────────────────
  useEffect(() => {
    if (user) fetchBudgets(selectedMonth)
    else { setBudgets([]); setLoading(false) }
  }, [user, selectedMonth, fetchBudgets])

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: () => fetchBudgets(selectedMonth),
    selectedMonth,
    setSelectedMonth,
    totalCap,
    setMonthlyTotalCap,
  }
}