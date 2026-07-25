import type { ReactNode } from "react";
import { MarketingShell } from "./marketing-shell";

// Legacy tokens (kept for backwards compat with pages that import them)
export const OBSIDIAN = "#153157";
export const MUTED = "#6B7280";
export const HAIRLINE = "#E5E7EB";

export function PublicShell({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
