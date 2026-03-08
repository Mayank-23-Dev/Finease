// src/components/ui/Reports_UI/month-picker.tsx
"use client"

interface Props { value: string; onChange: (m: string) => void }

export function MonthPicker({ value, onChange }: Props) {
  return (
    <input
      type="month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
    />
  )
}