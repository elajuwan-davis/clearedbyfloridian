import type { ReactNode } from "react";
import { MarketingShell } from "./marketing-shell";

// Legacy tokens (kept for backwards compat with pages that import them)
export const OBSIDIAN = "#000000";
export const MUTED = "rgba(0,0,0,0.62)";
export const HAIRLINE = "#E5E7EB";

export function PublicShell({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
