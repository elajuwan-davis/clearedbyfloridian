import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The one button. Slightly rounded (8px), never pill, never square.
 *   default      copper fill, white text
 *   outline      copper border, copper text  (secondary)
 *   link         copper text, underlined     (tertiary)
 *   ghost        copper text, tint on hover
 *   destructive  red fill
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold cursor-pointer border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-copper text-white border-copper hover:bg-[#7F562F] hover:border-[#7F562F]",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive hover:opacity-90",
        outline:
          "bg-white text-copper border-copper hover:bg-copper/10 hover:text-[#7F562F] hover:border-[#7F562F]",
        secondary:
          "bg-white text-copper border-copper hover:bg-copper/10 hover:text-[#7F562F] hover:border-[#7F562F]",
        ghost:
          "bg-transparent text-copper border-transparent hover:bg-copper/10 hover:text-[#7F562F]",
        link: "bg-transparent text-copper border-transparent underline underline-offset-4 hover:text-[#7F562F] h-auto px-0",
        dark: "bg-copper text-white border-copper hover:bg-[#7F562F] hover:border-[#7F562F]",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-11 px-6 text-[15px]",
        icon: "h-9 w-9 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
