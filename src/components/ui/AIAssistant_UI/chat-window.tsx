// src/components/ui/AIAssistant_UI/chat-window.tsx
"use client"

import * as React from "react"
import type { Message } from "@/components/hooks/use-ai-chat"

// ── Lightweight markdown renderer ────────────────────────────────────────────
// No external deps — parses bold, headers, bullets, blockquotes, line breaks
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line → spacer
    if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1" />)
      i++
      continue
    }

    // ### Header
    if (line.startsWith("### ")) {
      nodes.push(
        <p key={i} className="font-semibold text-foreground mt-2 mb-0.5">
          {parseInline(line.slice(4))}
        </p>
      )
      i++
      continue
    }

    // ## Header
    if (line.startsWith("## ")) {
      nodes.push(
        <p key={i} className="font-bold text-foreground mt-3 mb-1">
          {parseInline(line.slice(3))}
        </p>
      )
      i++
      continue
    }

    // > Blockquote
    if (line.startsWith("> ")) {
      nodes.push(
        <div
          key={i}
          className="border-l-2 border-primary/50 pl-3 my-1.5 text-muted-foreground italic text-xs"
        >
          {parseInline(line.slice(2))}
        </div>
      )
      i++
      continue
    }

    // Bullet list: - item or • item
    if (line.match(/^[-•]\s/)) {
      const bullets: React.ReactNode[] = []
      while (i < lines.length && lines[i].match(/^[-•]\s/)) {
        bullets.push(
          <li key={i} className="flex gap-1.5 items-start">
            <span className="text-primary mt-0.5 shrink-0">•</span>
            <span>{parseInline(lines[i].slice(2))}</span>
          </li>
        )
        i++
      }
      nodes.push(
        <ul key={`ul-${i}`} className="flex flex-col gap-1 my-1 text-sm">
          {bullets}
        </ul>
      )
      continue
    }

    // Numbered list: 1. item
    if (line.match(/^\d+\.\s/)) {
      const items: React.ReactNode[] = []
      let num = 1
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(
          <li key={i} className="flex gap-1.5 items-start">
            <span className="text-primary font-medium shrink-0 min-w-[1rem]">{num}.</span>
            <span>{parseInline(lines[i].replace(/^\d+\.\s/, ""))}</span>
          </li>
        )
        i++
        num++
      }
      nodes.push(
        <ol key={`ol-${i}`} className="flex flex-col gap-1 my-1 text-sm">
          {items}
        </ol>
      )
      continue
    }

    // Regular paragraph line
    nodes.push(
      <p key={i} className="text-sm leading-relaxed">
        {parseInline(line)}
      </p>
    )
    i++
  }

  return nodes
}

// Parse inline: **bold**, *italic*, `code`
function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={idx} className="italic">{part.slice(1, -1)}</em>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="bg-background/60 rounded px-1 py-0.5 text-xs font-mono text-primary">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

// ── ChatWindow ────────────────────────────────────────────────────────────────
export function ChatWindow({
  messages,
  loading,
  userAvatar,
  userInitials = "U",
}: {
  messages:      Message[]
  loading:       boolean
  userAvatar?:   string | null
  userInitials?: string
}) {
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
          {/* AI avatar */}
          {m.role === "assistant" && (
            <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              AI
            </div>
          )}

          {/* Bubble */}
          <div
            className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm
              ${m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
              }`}
          >
            {m.role === "assistant"
              ? <div className="flex flex-col gap-0.5">{renderMarkdown(m.content)}</div>
              : <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
            }
          </div>

          {/* User avatar */}
          {m.role === "user" && (
            <div className="size-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium shrink-0 mt-0.5 overflow-hidden">
              {userAvatar
                ? <img src={userAvatar} alt="avatar" className="size-full object-cover" />
                : userInitials
              }
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