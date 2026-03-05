"use client"

import * as React from "react"
import { Settings } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/Dashboard_UI/breadcrumb"

import { Separator } from "@/components/ui/Dashboard_UI/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Dashboard_UI/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">

      {/* Avatar */}
      <div className="flex items-center justify-between">

        <div>
          <h3 className="font-semibold">Your Avatar</h3>
          <p className="text-sm text-muted-foreground">
            An avatar is optional but strongly recommended.
          </p>
        </div>

        <Avatar className="h-16 w-16">
          <AvatarImage src="/avatar.png" />
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>

      </div>

      <Separator />

      {/* Name */}
      <div className="flex items-center justify-between gap-6">

        <div className="flex flex-col">
          <h3 className="font-semibold">Your Name</h3>
          <p className="text-sm text-muted-foreground">
            Please enter a display name you are comfortable with.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input defaultValue="MAYANK DEV" className="w-64" />
            <Button size="sm">Save</Button>
          </div>
          <span className="text-xs text-muted-foreground">
            Max 32 characters
          </span>
        </div>

      </div>

      <Separator />

      {/* Email */}
      <div className="flex items-center justify-between gap-6">

        <div>
          <h3 className="font-semibold">Your Email</h3>
          <p className="text-sm text-muted-foreground">
            Please enter a Primary Email Address.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input disabled value="dmayank4545@gmail.com" className="w-64" />
          <Button size="sm" disabled>
            Save
          </Button>
        </div>

      </div>

    </div>
  )
}