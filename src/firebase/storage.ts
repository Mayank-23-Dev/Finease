import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { updateProfile } from "firebase/auth"

import { auth } from "./firebase"

const storage = getStorage()


export async function uploadAvatar(file: File) {

  const user = auth.currentUser
  if (!user) throw new Error("User not logged in")

  const storageRef = ref(storage, `avatars/${user.uid}`)

  await uploadBytes(storageRef, file)

  const url = await getDownloadURL(storageRef)

  await updateProfile(user, {
    photoURL: url
  })

  return url
}