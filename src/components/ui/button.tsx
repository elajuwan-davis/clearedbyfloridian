import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The one button. 8px radius, 36px tall.
 *   default      glass fill, ink text, copper border accent
 *   outline      white + hairline border (secondary)
 *   ghost        transparent ink text
 *   link         ink + copper underline
 *   destructive  soft red glass
 *   icon         36×36 toolbar control
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-semibold cursor-pointer border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-white/60 text-black border-[color:var(--glass-border)] shadow-[var(--glass-shadow)] backdrop-blur-[14px] hover:bg-white/85 hover:border-copper",
        destructive:
          "bg-red-50 text-[color:var(--bad)] border-red-200 hover:bg-red-100",
        outline:
          "bg-white text-black border-[color:var(--line-2)] hover:bg-[color:var(--gray-bg)] hover:border-copper",
        secondary:
          "bg-white text-black border-[color:var(--line-2)] hover:bg-[color:var(--gray-bg)] hover:border-copper",
        ghost:
          "bg-transparent text-black border-transparent hover:bg-[color:var(--gray-bg)]",
        link: "bg-transparent text-black border-transparent underline underline-offset-4 decoration-[color:var(--copper)] hover:decoration-[color:var(--copper-hover)] h-auto px-0",
        dark:
          "bg-white/60 text-black border-[color:var(--glass-border)] shadow-[var(--glass-shadow)] backdrop-blur-[14px] hover:bg-white/85 hover:border-copper",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-10 px-5 text-[14px]",
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
