// src/components/hooks/use-chat-store.tsx
// Persists AI chat messages + guided flow state across page navigation
"use client"

import * as React from "react"
import type { Message, GuidedStep } from "@/components/hooks/use-ai-chat"

interface ChatStore {
  messages:        Message[]
  setMessages:     React.Dispatch<React.SetStateAction<Message[]>>
  pendingDraft:    Record<string, unknown> | null
  setPendingDraft: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>
  // New: guided flow step so chat-input can read it
  guidedStep:      GuidedStep
  setGuidedStep:   React.Dispatch<React.SetStateAction<GuidedStep>>
}

const ChatStoreContext = React.createContext<ChatStore | null>(null)

export function ChatStoreProvider({ children }: { children: React.ReactNode }) {
  const [messages,     setMessages]     = React.useState<Message[]>([])
  const [pendingDraft, setPendingDraft] = React.useState<Record<string, unknown> | null>(null)
  const [guidedStep,   setGuidedStep]   = React.useState<GuidedStep>("idle")

  return (
    <ChatStoreContext.Provider value={{ messages, setMessages, pendingDraft, setPendingDraft, guidedStep, setGuidedStep }}>
      {children}
    </ChatStoreContext.Provider>
  )
}

export function useChatStore() {
  const ctx = React.useContext(ChatStoreContext)
  if (!ctx) throw new Error("useChatStore must be used inside ChatStoreProvider")
  return ctx
}