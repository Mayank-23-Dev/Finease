// src/components/hooks/use-chat-store.tsx
// Persists AI chat messages across page navigation using React Context
"use client"

import * as React from "react"
import type { Message } from "@/components/hooks/use-ai-chat"

interface ChatStore {
  messages:     Message[]
  setMessages:  React.Dispatch<React.SetStateAction<Message[]>>
  pendingDraft: Record<string, unknown> | null
  setPendingDraft: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>
}

const ChatStoreContext = React.createContext<ChatStore | null>(null)

export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  const [messages,     setMessages]     = React.useState<Message[]>([])
  const [pendingDraft, setPendingDraft] = React.useState<Record<string, unknown> | null>(null)

  return (
    <ChatStoreContext.Provider value={{ messages, setMessages, pendingDraft, setPendingDraft }}>
      {children}
    </ChatStoreContext.Provider>
  )
}

export function useChatStore() {
  const ctx = React.useContext(ChatStoreContext)
  if (!ctx) throw new Error("useChatStore must be used inside ChatStoreProvider")
  return ctx
}