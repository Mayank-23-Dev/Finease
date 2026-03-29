// src/firebase/auth.ts
import { auth } from "./firebase"

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth"


// Email signup
export const signUp = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  await sendEmailVerification(userCredential.user)
  return userCredential.user
}

// Google login
export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: "select_account" })
  return signInWithPopup(auth, provider)
}

// Logout
export const logout = () => signOut(auth)

// Update display name
export const updateUserName = async (name: string) => {
  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")
  await updateProfile(user, { displayName: name })
}

/**
 * Syncs an avatar URL back to Firebase Auth's photoURL.
 * Always call this after a Supabase avatar upload so that
 * user.photoURL stays in sync across the whole app.
 */
export const updatePhotoURL = async (url: string) => {
  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")
  await updateProfile(user, { photoURL: url })
}

// Re-authenticate before sensitive operations (password change, delete)
export const reauthenticate = async (currentPassword: string) => {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error("User not logged in")
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
}

// Change password
export const changePassword = async (newPassword: string) => {
  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")
  await updatePassword(user, newPassword)
}

// Delete account
export const deleteAccount = async () => {
  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")
  await deleteUser(user)
}