import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/hooks/use-auth"

export type Transaction = {
  id: number
  user_id: string
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all transactions for current user
  const fetchTransactions = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.uid)
      .order("date", { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTransactions(data || [])
    }
    setLoading(false)
  }

  // Add a new transaction
  const addTransaction = async (t: Omit<Transaction, "id" | "user_id" | "created_at">) => {
    if (!user) return { error: "Not logged in" }

    const { data, error } = await supabase
      .from("transactions")
      .insert([{ ...t, user_id: user.uid }])
      .select()
      .single()

    if (error) {
      setError(error.message)
      return { error: error.message }
    }

    setTransactions((prev) => [data, ...prev])
    return { data }
  }

  // Delete a transaction
  const deleteTransaction = async (id: number) => {
    if (!user) return

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.uid)

    if (error) {
      setError(error.message)
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    }
  }

  // Fetch on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.uid}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTransactions((prev) => {
              // Avoid duplicates
              const exists = prev.some((t) => t.id === (payload.new as Transaction).id)
              if (exists) return prev
              return [payload.new as Transaction, ...prev]
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  }
}