// src/components/ui/AIAssistant_UI/suggested-prompts.tsx
"use client"

const PROMPTS = [
  "What did I spend the most on this month?",
  "Am I over budget in any category?",
  "How much did I save this month?",
  "Give me tips to reduce my expenses",
  "What's my biggest expense category?",
  "How does my spending compare to last month?",
]

export function SuggestedPrompts({ onSelect }: { onSelect: (p: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
      {PROMPTS.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          className="text-xs rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/50 hover:bg-muted transition-colors text-left"
        >
          {p}
        </button>
      ))}
    </div>
  )
}