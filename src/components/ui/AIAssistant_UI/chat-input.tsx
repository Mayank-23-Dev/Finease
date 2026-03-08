// src/components/ui/AIAssistant_UI/chat-input.tsx
"use client"

import * as React from "react"
import { IconSend } from "@tabler/icons-react"
import { Button }   from "@/components/ui/button"

interface Props {
  onSend:  (msg: string) => void
  loading: boolean
}

export function ChatInput({ onSend, loading }: Props) {
  const [value, setValue] = React.useState("")

  const handleSend = () => {
    if (!value.trim() || loading) return
    onSend(value.trim())
    setValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-2 items-end">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your spending, budgets, savings..."
        rows={1}
        className="flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring min-h-[38px] max-h-[120px]"
        style={{ height: "auto" }}
        onInput={(e) => {
          const el = e.currentTarget
          el.style.height = "auto"
          el.style.height = `${Math.min(el.scrollHeight, 120)}px`
        }}
      />
      <Button
        size="sm"
        onClick={handleSend}
        disabled={loading || !value.trim()}
        className="size-9 p-0 shrink-0"
      >
        <IconSend className="size-4" />
      </Button>
    </div>
  )
}