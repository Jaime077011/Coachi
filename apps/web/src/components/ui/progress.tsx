"use client"

import * as React from "react"
import { cn } from "cn"
import { Progress as ProgressPrimitive } from "radix-ui"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-2 w-full items-center overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        // Coachi: width fill grows from the start edge, so it fills from the right in Arabic.
        className="h-full rounded-full bg-fire transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
