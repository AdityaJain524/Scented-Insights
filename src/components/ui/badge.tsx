import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Expertise level badges
        beginner: "border-transparent bg-muted text-muted-foreground",
        explorer: "border-amber/30 bg-amber-light/20 text-amber",
        enthusiast: "border-burgundy/30 bg-burgundy-soft text-burgundy",
        expert: "border-transparent bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-amber",
        // Special badges
        verified: "border-transparent bg-emerald-100 text-emerald-700",
        sustainability: "border-transparent bg-green-100 text-green-700",
        contributor: "border-amber/30 bg-amber/10 text-amber",
        trusted: "border-emerald-300 bg-emerald-50 text-emerald-700",
        "community-expert": "border-transparent bg-gradient-to-r from-primary to-gold text-primary-foreground",
        // Note type badges
        top: "border-amber/30 bg-amber/10 text-amber",
        heart: "border-rose/30 bg-rose/10 text-rose",
        base: "border-burgundy/30 bg-burgundy/10 text-burgundy",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
