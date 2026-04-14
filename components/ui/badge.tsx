import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-200 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
        destructive: "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent/10 [a&]:hover:text-accent",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        accent: "bg-accent text-accent-foreground [a&]:hover:bg-accent/80",
        tertiary: "bg-tertiary text-tertiary-foreground [a&]:hover:bg-tertiary/80",
        success: "bg-emerald-100 text-emerald-700 border-emerald-200",
        warning: "bg-amber-100 text-amber-700 border-amber-200",
        premium: "bg-gradient-to-r from-primary to-secondary text-white border-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  Button = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { Button?: boolean }) {
  const Comp = Button ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }