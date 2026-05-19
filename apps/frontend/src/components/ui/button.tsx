import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 hover:shadow-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-0.5",
        outline:
          "border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:text-primary hover:border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-0.5",
        ghost: "hover:bg-accent/10 hover:text-accent active:bg-accent/20 shadow-none hover:shadow-none",
        link: "text-primary underline-offset-4 hover:underline shadow-none hover:shadow-none",
      },
      size: {
        default: "h-12 px-6 py-2 md:h-10 md:px-5 text-base md:text-sm",
        sm: "h-10 rounded-full px-4 md:h-9 text-sm",
        lg: "h-14 rounded-full px-8 md:h-11 text-base",
        icon: "h-12 w-12 md:h-10 md:w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
