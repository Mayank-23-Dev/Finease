// src/components/Pages/AIAssistantPage.tsx
"use client"

import { ChatWindow }       from "@/components/ui/AIAssistant_UI/chat-window"
import { ChatInput }        from "@/components/ui/AIAssistant_UI/chat-input"
import { SuggestedPrompts } from "@/components/ui/AIAssistant_UI/suggested-prompts"
import { useAIChat }        from "@/components/hooks/use-ai-chat"
import { useChatStore }     from "@/components/hooks/use-chat-store"
import { useTransactions }  from "@/components/hooks/use-transactions"
import { useBudgets }       from "@/components/hooks/use-budgets"
import { useAuth }          from "@/components/hooks/use-auth"
import type { Message }           from "@/components/hooks/use-ai-chat"
import type { Dispatch, SetStateAction } from "react"

export default function AIAssistantPage() {
  const { transactions, addTransaction } = useTransactions()
  const { budgets }                      = useBudgets()
  const { user }                         = useAuth()

  // ── Persistent chat state (survives navigation) ───────────────────────────
  const { messages, setMessages, pendingDraft, setPendingDraft } = useChatStore()

  const { loading, sendMessage, clearChat } = useAIChat({
    transactions,
    budgets,
    onAddTransaction: addTransaction,
    messages,
    setMessages,
    pendingDraft:    pendingDraft as never,
    setPendingDraft: setPendingDraft as never,
  })

  // ── User avatar ───────────────────────────────────────────────────────────
  const userAvatar   = user?.photoURL ?? null
  const userInitials = (user?.displayName ?? user?.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="@container/main flex flex-1 flex-col h-full overflow-hidden">
      <div className="flex flex-col h-full max-h-[calc(100vh-var(--header-height))]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b shrink-0">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ask anything — or just say what you spent
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>

        {/* Chat area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 px-4">
              <div className="text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-base font-medium">How can I help you today?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask about your finances or say{" "}
                  <span className="italic">"I spent ₹500 on groceries"</span> to log it instantly.
                </p>
              </div>
              <SuggestedPrompts onSelect={sendMessage} />
            </div>
          ) : (
            <ChatWindow
              messages={messages}
              loading={loading}
              userAvatar={userAvatar}
              userInitials={userInitials}
            />
          )}

          {/* Input */}
          <div className="px-4 lg:px-6 py-3 border-t shrink-0">
            <ChatInput onSend={sendMessage} loading={loading} />
          </div>
        </div>

      </div>
    </div>
  )
}