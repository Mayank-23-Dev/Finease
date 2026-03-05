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
} from "firebase/auth"


// Email signup
export const signUp = async (email: string, password: string) => {

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )

  await sendEmailVerification(userCredential.user)

  return userCredential.user
}


// Google login
export const signInWithGoogle = () => {

  const provider = new GoogleAuthProvider()

  provider.setCustomParameters({
    prompt: "select_account"
  })

  return signInWithPopup(auth, provider)

}


// Logout
export const logout = () => {
  return signOut(auth)
}


// Update user name
export const updateUserName = async (name: string) => {

  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")

  await updateProfile(user, {
    displayName: name
  })

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