// src/components/ui/AIAssistant_UI/chat-window.tsx
"use client"

import * as React from "react"
import type { Message } from "@/components/hooks/use-ai-chat"

export function ChatWindow({ messages, loading }: { messages: Message[]; loading: boolean }) {
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 flex flex-col gap-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {/* Avatar */}
          {m.role === "assistant" && (
            <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-xs shrink-0 mt-0.5">
              AI
            </div>
          )}

          {/* Bubble */}
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
              ${m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
              }`}
          >
            {m.content}
          </div>

          {/* User avatar */}
          {m.role === "user" && (
            <div className="size-7 rounded-full bg-secondary flex items-center justify-center text-xs shrink-0 mt-0.5">
              U
            </div>
          )}
        </div>
      ))}

      {/* Loading dots */}
      {loading && (
        <div className="flex gap-3 justify-start">
          <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-xs shrink-0">
            AI
          </div>
          <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}