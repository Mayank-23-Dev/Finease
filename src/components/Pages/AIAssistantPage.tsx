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
import { Bot }              from "lucide-react"

export default function AIAssistantPage() {
  const { transactions, addTransaction } = useTransactions()
  const { budgets }                      = useBudgets()
  const { user }                         = useAuth()

  const {
    messages, setMessages,
    pendingDraft, setPendingDraft,
    guidedStep, setGuidedStep,
  } = useChatStore()

  const { loading, sendMessage, clearChat, startGuidedFlow, cancelGuidedFlow } = useAIChat({
    transactions,
    budgets,
    onAddTransaction: addTransaction,
    messages,
    setMessages,
    pendingDraft:    pendingDraft as never,
    setPendingDraft: setPendingDraft as never,
    guidedStep,
    setGuidedStep,
  })

  const userAvatar   = user?.photoURL ?? null
  const userInitials = (user?.displayName ?? user?.email ?? "U")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div className="@container/main flex flex-1 flex-col h-full overflow-hidden">
      <div className="flex flex-col h-full max-h-[calc(100vh-var(--header-height))]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-3.5 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            {/* AI avatar */}
            <div className="size-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Bot size={15} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-white leading-tight">FinEase AI</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-white/35">Online · Powered by Llama 3.1</span>
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-7 px-4 py-8">
              <div className="text-center">
                <p className="text-base font-medium text-white">How can I help you today?</p>
                <p className="text-sm text-white/40 mt-1.5 leading-relaxed">
                  Ask about your finances or say{" "}
                  <span className="text-white/60 bg-white/[0.06] px-1.5 py-0.5 rounded text-xs font-mono">
                    I spent ₹500 on groceries
                  </span>{" "}
                  to log it instantly.
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
          <div className="px-4 lg:px-6 py-3 border-t border-white/[0.07] shrink-0">
            <ChatInput
              onSend={sendMessage}
              loading={loading}
              guidedStep={guidedStep}
              onStartGuided={startGuidedFlow}
              onCancelGuided={cancelGuidedFlow}
            />
          </div>
        </div>

      </div>
    </div>
  )
}