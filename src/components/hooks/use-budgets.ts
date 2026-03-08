// src/components/hooks/use-budgets.ts
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/hooks/use-auth"

export type Budget = {
  id:           string
  firebase_uid: string
  category:     string
  amount:       number
  spent:        number   // computed client-side from transactions
  month:        string   // "YYYY-MM"
  created_at?:  string
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function useBudgets() {
  const { user } = useAuth()
  const [budgets,  setBudgets]  = useState<Budget[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const currentMonth = getCurrentMonth()

  const fetchBudgets = async () => {
    if (!user) return
    setLoading(true)

    // Fetch budgets for this month
    const { data: budgetRows, error: bErr } = await supabase
      .from("budgets")
      .select("*")
      .eq("firebase_uid", user.uid)
      .eq("month", currentMonth)

    if (bErr) { setError(bErr.message); setLoading(false); return }

    // Fetch this month's transactions to compute spent per category
    const { data: txRows, error: tErr } = await supabase
      .from("transactions")
      .select("category, amount, type")
      .eq("firebase_uid", user.uid)
      .eq("type", "Debit")
      .gte("date", `${currentMonth}-01`)
      .lte("date", `${currentMonth}-31`)

    if (tErr) { setError(tErr.message); setLoading(false); return }

    // Sum spent per category
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
  }

  const addBudget = async ({
    category, amount,
  }: { category: string; amount: number }) => {
    if (!user) return { error: "Not logged in" }

    const { data, error } = await supabase
      .from("budgets")
      .upsert(
        { firebase_uid: user.uid, category, amount, month: currentMonth },
        { onConflict: "firebase_uid,category,month" }
      )
      .select()
      .single()

    if (error) { setError(error.message); return { error: error.message } }

    await fetchBudgets()   // refetch to get fresh spent values
    return { data }
  }

  const deleteBudget = async (id: string) => {
    if (!user) return
    const { error } = await supabase.from("budgets").delete().eq("id", id)
    if (error) setError(error.message)
    else setBudgets((prev) => prev.filter((b) => b.id !== id))
  }

  useEffect(() => {
    if (user) fetchBudgets()
    else { setBudgets([]); setLoading(false) }
  }, [user])

  return { budgets, loading, error, addBudget, deleteBudget, refetch: fetchBudgets, currentMonth }
}