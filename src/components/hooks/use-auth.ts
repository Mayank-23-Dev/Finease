import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import type { User } from "firebase/auth"
import { auth } from "@/firebase/firebase"
import { supabase } from "@/lib/supabase"

export function useAuth() {
  const [user,       setUser]       = useState<User | null>(() => auth.currentUser)
  const [loading,    setLoading]    = useState(!auth.currentUser)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const { error } = await supabase
          .from("user_profiles")
          .upsert(
            {
              firebase_uid: firebaseUser.uid,
              full_name:    firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "User",
            },
            { onConflict: "firebase_uid" }
          )
        if (error) console.error("Supabase upsert error:", error.message)
        else console.log("Supabase user synced ✅")
      }

      setUser(firebaseUser)
      setLoading(false)
      setLoggingOut(false)
    })

    return () => unsubscribe()
  }, [])

  const logOut = async () => {
    setLoggingOut(true)
    await signOut(auth)
    setLoggingOut(false)
  }

  return { user, loading, loggingOut, logOut }
}