// src/firebase/user.ts
import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"
import type { User } from "firebase/auth"
import { supabase } from "@/lib/supabase"

// ─────────────────────────────────────────────
// Firebase helpers (unchanged)
// ─────────────────────────────────────────────

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export const getUserUID = async (): Promise<string | null> => {
  const user = await getCurrentUser()
  return user ? user.uid : null
}

// ─────────────────────────────────────────────
// Supabase profile helpers (NEW)
// Use these anywhere in your app to read/write profile data
// ─────────────────────────────────────────────

export type UserProfile = {
  firebase_uid:         string
  full_name:            string | null
  country:              string | null
  currency:             string | null
  monthly_income:       number | null
  income_source:        string | null
  savings_goal:         number | null
  financial_experience: string | null
  dob:                  string | null
  created_at:           string
  profile_pic:          string | null
}

/** Fetch the Supabase profile for the current Firebase user */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const uid = await getUserUID()
  if (!uid) return null

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("firebase_uid", uid)
    .single()

  if (error) {
    console.error("getUserProfile error:", error.message)
    return null
  }
  return data
}

/** Update profile fields for the current Firebase user */
export const updateUserProfile = async (
  updates: Partial<Omit<UserProfile, "firebase_uid" | "created_at">>
): Promise<UserProfile | null> => {
  const uid = await getUserUID()
  if (!uid) throw new Error("User not logged in")

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("firebase_uid", uid)
    .select()
    .single()

  if (error) throw error
  return data
}