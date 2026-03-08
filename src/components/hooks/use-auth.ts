// src/components/hooks/use-auth.ts
import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import type { User } from "firebase/auth"
import { auth } from "@/firebase/firebase"
import { supabase } from "@/lib/supabase"          // ← ADD THIS

export function useAuth() {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Firebase User:", firebaseUser)

      if (firebaseUser) {
        // ── Sync user into Supabase user_profiles ──────────────────
        // upsert: creates the row on first login, does nothing on repeat logins
        const { error } = await supabase
          .from("user_profiles")
          .upsert(
            {
              firebase_uid: firebaseUser.uid,
              full_name:    firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "User",
            },
            { onConflict: "firebase_uid" }   // safe: won't overwrite existing profile data
          )

        if (error) {
          console.error("Supabase upsert error:", error.message)
        } else {
          console.log("Supabase user synced ✅")
        }
        // ───────────────────────────────────────────────────────────
      }

      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}