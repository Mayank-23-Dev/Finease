// src/components/hooks/use-transactions.ts
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/hooks/use-auth"

export type Transaction = {
  id: number            // kept as number to match data-table.tsx schema expectation
  firebase_uid: string
  transaction: string
  category: string
  amount: number
  date: string
  type: string
  method: string
  status: string
  created_at?: string
}

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [error,   setError]             = useState<string | null>(null)

  const fetchTransactions = async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("firebase_uid", user.uid)
      .order("date", { ascending: false })

    if (error) setError(error.message)
    else setTransactions(data || [])

    setLoading(false)
  }

  const addTransaction = async (
    t: Omit<Transaction, "id" | "firebase_uid" | "created_at">
  ) => {
    if (!user) return { error: "Not logged in" }

    const { data, error } = await supabase
      .from("transactions")
      .insert([{ ...t, firebase_uid: user.uid }])
      .select()
      .single()

    if (error) {
      setError(error.message)
      return { error: error.message }
    }

    setTransactions((prev) => {
      const exists = prev.some((tx) => tx.id === data.id)
      return exists ? prev : [data, ...prev]
    })

    return { data }
  }

  // ── NEW: updateTransaction ──────────────────────────────────────────────────
  const updateTransaction = async (
    id: number,
    updates: Omit<Transaction, "id" | "firebase_uid" | "created_at">
  ) => {
    if (!user) return { error: "Not logged in" }

    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .eq("firebase_uid", user.uid)
      .select()
      .single()

    if (error) {
      setError(error.message)
      return { error: error.message }
    }

    // Optimistic local update (realtime will also fire, but this is instant)
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t))
    )

    return { data }
  }
  // ───────────────────────────────────────────────────────────────────────────

  const deleteTransaction = async (id: number) => {
    if (!user) return

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("firebase_uid", user.uid)

    if (error) setError(error.message)
    else setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    if (user) fetchTransactions()
    else {
      setTransactions([])
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`transactions-${user.uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `firebase_uid=eq.${user.uid}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTransactions((prev) => {
              const exists = prev.some((t) => t.id === (payload.new as Transaction).id)
              return exists ? prev : [payload.new as Transaction, ...prev]
            })
          }
          if (payload.eventType === "DELETE") {
            setTransactions((prev) =>
              prev.filter((t) => t.id !== (payload.old as Transaction).id)
            )
          }
          if (payload.eventType === "UPDATE") {
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Transaction).id
                  ? (payload.new as Transaction)
                  : t
              )
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,   // ← newly exported
    deleteTransaction,
    refetch: fetchTransactions,
  }
}