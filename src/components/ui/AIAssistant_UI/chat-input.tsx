// src/components/ui/AIAssistant_UI/chat-input.tsx
"use client"

import * as React from "react"
import { IconSend, IconPlus, IconX } from "@tabler/icons-react"
import type { GuidedStep } from "@/components/hooks/use-ai-chat"

interface Props {
  onSend:         (msg: string) => void
  loading:        boolean
  guidedStep:     GuidedStep
  onStartGuided:  () => void
  onCancelGuided: () => void
}

const GUIDED_STEPS: GuidedStep[] = ["name", "amount", "category", "type", "method", "confirm"]

const STEP_LABELS: Partial<Record<GuidedStep, string>> = {
  name:     "Name",
  amount:   "Amount",
  category: "Category",
  type:     "Type",
  method:   "Payment method",
  confirm:  "Confirm",
}

export function ChatInput({ onSend, loading, guidedStep, onStartGuided, onCancelGuided }: Props) {
  const [value, setValue]     = React.useState("")
  const [focused, setFocused] = React.useState(false)
  const textareaRef           = React.useRef<HTMLTextAreaElement>(null)

  const isGuidedActive = guidedStep !== "idle" && guidedStep !== "done"
  const stepIndex      = GUIDED_STEPS.indexOf(guidedStep as GuidedStep)
  const canSend        = !!value.trim() && !loading

  const handleSend = () => {
    if (!canSend) return
    onSend(value.trim())
    setValue("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <div className="flex flex-col gap-1.5">

      {/* ── Guided step indicator ──────────────────────────────────────── */}
      {isGuidedActive && (
        <div className="flex items-center justify-between px-1">
          {/* Step pills */}
          <div className="flex items-center gap-1">
            {GUIDED_STEPS.map((step, i) => {
              const done    = i < stepIndex
              const current = i === stepIndex
              return (
                <div
                  key={step}
                  className={[
                    "h-1 rounded-full transition-all duration-300",
                    done    ? "bg-primary w-4"   : "",
                    current ? "bg-primary w-6"   : "",
                    !done && !current ? "bg-muted w-4" : "",
                  ].join(" ")}
                />
              )
            })}
            <span className="ml-1.5 text-xs text-muted-foreground font-medium">
              {STEP_LABELS[guidedStep]}
            </span>
          </div>

          <button
            onClick={onCancelGuided}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <IconX className="size-3" />
            Cancel
          </button>
        </div>
      )}

      {/* ── Input row ──────────────────────────────────────────────────── */}
      <div
        className={[
          "flex items-end gap-1.5 rounded-xl border bg-background px-2 py-1.5 transition-colors duration-150",
          focused ? "border-ring" : "border-input",
        ].join(" ")}
      >
        {/* + Add button */}
        {!isGuidedActive && (
          <button
            onClick={onStartGuided}
            disabled={loading}
            title="Log a transaction"
            className="mb-1 group mb-0.5 flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-40 cursor-pointer shrink-0"
          >
            <IconPlus className="size-3.5 transition-transform duration-200 group-hover:rotate-90" />
            Add
          </button>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); autoResize(e.target) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isGuidedActive ? "Type your answer…" : "Ask anything or say what you spent…"}
          rows={1}
          className="flex-1 resize-none bg-transparent py-1.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none min-h-[36px] max-h-[120px] leading-relaxed"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={[
            "mb-0.5 size-8 shrink-0 rounded-lg flex items-center justify-center transition-all duration-150",
            canSend
              ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm cursor-pointer"
              : "bg-muted text-muted-foreground/40 cursor-not-allowed",
          ].join(" ")}
        >
          {loading ? (
            <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          ) : (
            <IconSend className="size-3.5 translate-x-px" />
          )}
        </button>
      </div>

      {/* ── Keyboard hint ─────────────────────────────────────────────── */}
      {!isGuidedActive && !focused && (
        <p className="text-center text-[11px] text-muted-foreground/40 select-none">
          <kbd className="font-mono">Enter</kbd> to send · <kbd className="font-mono">Shift+Enter</kbd> for new line
        </p>
      )}
    </div>
  )
}