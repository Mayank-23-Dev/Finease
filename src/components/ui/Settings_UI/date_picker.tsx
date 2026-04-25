"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import type { DropdownProps } from "react-day-picker"

// ── Custom caption dropdown used by react-day-picker ──────────────────────────
function CalendarDropdown({ value, onChange, options = [] }: DropdownProps) {
  const selected = options.find((o) => o.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-sm font-medium
            bg-white/[0.05] hover:bg-white/[0.10]
            border border-white/[0.08] hover:border-white/[0.18]
            text-white/80 hover:text-white
            rounded-md transition-all"
        >
          {selected?.label ?? value}
          <ChevronDownIcon className="size-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        className="max-h-60 overflow-y-auto
          bg-[#1a1a1a] border border-white/[0.10]
          text-white/80 rounded-lg shadow-xl p-1
          scrollbar-thin scrollbar-thumb-white/10"
      >
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() =>
              onChange?.({
                target: { value: String(opt.value) },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
            className="text-sm rounded-md px-3 py-1.5 cursor-pointer
              focus:bg-white/[0.08] focus:text-white
              data-[highlighted]:bg-white/[0.08]"
            data-selected={opt.value === value}
          >
            <span
              className={
                opt.value === value ? "text-white font-semibold" : "text-white/70"
              }
            >
              {opt.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── DatePickerDemo ─────────────────────────────────────────────────────────────
export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          {date ? format(date, "PPP") : <span>Pick a date</span>}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          defaultMonth={date}
          captionLayout="dropdown"
          fromYear={1940}
          toYear={new Date().getFullYear()}
          components={{
            Dropdown: CalendarDropdown,
          }}
        />
      </PopoverContent>
    </Popover>
  )
}