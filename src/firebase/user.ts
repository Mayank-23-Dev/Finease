import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

// Get current user
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Get UID
export const getUserUID = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user ? user.uid : null;
};