// src/components/ui/AIAssistant_UI/chat-input.tsx
"use client"

import * as React from "react"
import { Plus, X, ArrowUp, Receipt, CreditCard, Upload, FileText } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

const MENU_ITEMS = [
  { icon: Plus,       label: "Log transaction", action: "guided"  },
  { icon: Receipt,    label: "Upload receipt",  action: "receipt" },
  { icon: CreditCard, label: "Set a budget",    action: "budget"  },
] as const

const COMING_SOON = [
  { icon: Upload,   label: "Import from bank" },
  { icon: FileText, label: "Export report"    },
]

export function ChatInput({ onSend, loading, guidedStep, onStartGuided, onCancelGuided }: Props) {
  const [value,    setValue]    = React.useState("")
  const [focused,  setFocused]  = React.useState(false)
  const [popOpen,  setPopOpen]  = React.useState(false)
  const textareaRef             = React.useRef<HTMLTextAreaElement>(null)

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

  const handleMenuAction = (action: string) => {
    setPopOpen(false)
    if (action === "guided") {
      onStartGuided()
    } else if (action === "budget") {
      onSend("Help me set a budget for a category")
    } else if (action === "receipt") {
      onSend("I want to log a transaction from a receipt")
    }
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Guided step progress */}
      {isGuidedActive && (
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            {GUIDED_STEPS.map((step, i) => {
              const done    = i < stepIndex
              const current = i === stepIndex
              return (
                <div
                  key={step}
                  className={[
                    "h-[3px] rounded-full transition-all duration-300",
                    done    ? "bg-white/60 w-5" : "",
                    current ? "bg-white w-7"    : "",
                    !done && !current ? "bg-white/10 w-5" : "",
                  ].join(" ")}
                />
              )
            })}
            <span className="ml-1 text-[11px] text-white/40 font-medium">
              {STEP_LABELS[guidedStep]}
            </span>
          </div>
          <button
            onClick={onCancelGuided}
            className="flex items-center gap-1 text-[11px] text-white/30 hover:text-red-400 transition-colors cursor-pointer"
          >
            <X size={11} />
            Cancel
          </button>
        </div>
      )}

      {/* Input box */}
      <div
        className={[
          "flex items-end gap-2 rounded-2xl border px-3 py-2.5 transition-all duration-150",
          focused
            ? "border-white/20 bg-white/[0.05]"
            : "border-white/[0.08] bg-white/[0.03]",
        ].join(" ")}
      >
        {/* Popover trigger — clean icon only, no label */}
        {!isGuidedActive && (
          <Popover open={popOpen} onOpenChange={setPopOpen}>
            <PopoverTrigger asChild>
              <button
                disabled={loading}
                title="Add"
                className={[
                  "mb-0.5 size-7 shrink-0 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer",
                  "border border-white/10 bg-white/[0.04] text-white/30",
                  "hover:bg-white/[0.08] hover:text-white/60 hover:border-white/20",
                  "data-[state=open]:bg-white/[0.08] data-[state=open]:text-white/70 data-[state=open]:border-white/20",
                  "disabled:pointer-events-none disabled:opacity-30",
                ].join(" ")}
              >
                <Plus
                  size={13}
                  className={`transition-transform duration-200 ${popOpen ? "rotate-45" : ""}`}
                />
              </button>
            </PopoverTrigger>

            <PopoverContent
              side="top"
              align="start"
              sideOffset={10}
              className="w-52 p-1.5 bg-[#161616] border border-white/[0.09] rounded-2xl shadow-2xl"
            >
              {MENU_ITEMS.map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={() => handleMenuAction(action)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.06] transition-colors text-left cursor-pointer group"
                >
                  <div className="size-[28px] rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
                    <Icon size={13} className="text-white/50 group-hover:text-white/80 transition-colors" />
                  </div>
                  <span className="text-[13px] text-white/60 group-hover:text-white/90 transition-colors">{label}</span>
                </button>
              ))}

              <div className="h-px bg-white/[0.07] my-1.5 mx-1" />
              <p className="text-[10px] text-white/20 px-3 pb-1 tracking-wide uppercase">Coming soon</p>

              {COMING_SOON.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-default"
                >
                  <div className="size-[28px] rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-white/20" />
                  </div>
                  <span className="text-[13px] text-white/25">{label}</span>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); autoResize(e.target) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={
            isGuidedActive
              ? "Type your answer…"
              : "Ask anything or say what you spent…"
          }
          rows={1}
          className="flex-1 resize-none bg-transparent py-1 text-sm text-white/80 placeholder:text-white/20 focus:outline-none min-h-[32px] max-h-[120px] leading-relaxed"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={[
            "mb-0.5 size-8 shrink-0 rounded-xl flex items-center justify-center transition-all duration-150",
            canSend
              ? "bg-white text-black hover:bg-white/90 cursor-pointer"
              : "bg-white/[0.06] text-white/20 cursor-not-allowed",
          ].join(" ")}
        >
          {loading ? (
            <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          ) : (
            <ArrowUp size={14} />
          )}
        </button>
      </div>

      {/* Keyboard hint */}
      {!isGuidedActive && !focused && (
        <p className="text-center text-[10px] text-white/20 select-none">
          <kbd className="font-mono">Enter</kbd> to send ·{" "}
          <kbd className="font-mono">Shift+Enter</kbd> for new line
        </p>
      )}
    </div>
  )
}