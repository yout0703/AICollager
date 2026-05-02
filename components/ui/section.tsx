import * as React from "react"

import { cn } from "@/lib/utils"

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  muted?: boolean
}

function Section({ className, muted = false, ...props }: SectionProps) {
  return (
    <section
      className={cn("py-20", muted ? "bg-secondary/60" : "bg-background", className)}
      {...props}
    />
  )
}

function SectionInner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  )
}

function SectionHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto mb-14 max-w-3xl text-center", className)} {...props} />
}

export { Section, SectionInner, SectionHeader }
