// src/components/hooks/use-budgets.ts
import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/hooks/use-auth"

export type Budget = {
  id:           string
  firebase_uid: string
  category:     string
  amount:       number
  spent:        number
  month:        string
  created_at?:  string
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function useBudgets() {
  const { user } = useAuth()
  const [budgets,       setBudgets]       = useState<Budget[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)

  const fetchBudgets = useCallback(async (month: string) => {
    if (!user) return
    setLoading(true)

    const { data: budgetRows, error: bErr } = await supabase
      .from("budgets")
      .select("*")
      .eq("firebase_uid", user.uid)
      .eq("month", month)

    if (bErr) { setError(bErr.message); setLoading(false); return }

    // ✅ FIX: compute the actual last day of the month instead of hardcoding 31
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

    const enriched: Budget[] = (budgetRows || []).map((b) => ({
      ...b,
      amount: Number(b.amount),
      spent:  spentMap[b.category] ?? 0,
    }))

    setBudgets(enriched)
    setLoading(false)
  }, [user])

  const addBudget = async ({ category, amount }: { category: string; amount: number }) => {
    if (!user) return { error: "Not logged in" }

    const { data, error } = await supabase
      .from("budgets")
      .upsert(
        { firebase_uid: user.uid, category, amount, month: selectedMonth },
        { onConflict: "firebase_uid,category,month" }
      )
      .select()
      .single()

    if (error) { setError(error.message); return { error: error.message } }
    await fetchBudgets(selectedMonth)
    return { data }
  }

  const updateBudget = async (id: string, updates: { category: string; amount: number }) => {
    if (!user) return { error: "Not logged in" }

    const { data, error } = await supabase
      .from("budgets")
      .update({ category: updates.category, amount: updates.amount })
      .eq("id", id)
      .eq("firebase_uid", user.uid)
      .select()
      .single()

    if (error) { setError(error.message); return { error: error.message } }
    await fetchBudgets(selectedMonth)
    return { data }
  }

  const deleteBudget = async (id: string) => {
    if (!user) return
    const { error } = await supabase.from("budgets").delete().eq("id", id)
    if (error) setError(error.message)
    else setBudgets((prev) => prev.filter((b) => b.id !== id))
  }

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
    refetch:      () => fetchBudgets(selectedMonth),
    selectedMonth,
    setSelectedMonth,
  }
}