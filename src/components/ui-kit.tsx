/**
 * Cleard Design System v1.0 — shared presentation primitives.
 *
 * Pure presentation. No data fetching, no business logic. Every portal page
 * composes its screen from these so spacing, typography, radius, density and
 * rhythm are identical everywhere.
 */
import type { ComponentProps, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Inbox, Loader2 } from "lucide-react";
import type { BadgeTone } from "@/lib/status-badges";
import { cn } from "@/lib/utils";

/* ───────────────────────── Layout rhythm ───────────────────────── */

export type Crumb = { label: string; to?: string };

/** Breadcrumbs → Title + actions → description. One header for every page. */
export function PageHeader({
  crumbs,
  title,
  description,
  actions,
  className,
}: {
  crumbs?: Crumb[];
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6", className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex min-w-0 items-center gap-1 text-[12px]">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-40" strokeWidth={1.75} />}
              {c.to ? (
                <Link
                  to={c.to as never}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="truncate text-muted-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold leading-tight tracking-[-0.02em]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Single filter/search row. Never more than one per page. */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>{children}</div>
  );
}

export function Surface({
  children,
  className,
  padded = true,
  flat,
  ...rest
}: { padded?: boolean; flat?: boolean } & ComponentProps<"div">) {
  return (
    <div
      className={cn(flat ? "p-surface-flat" : "p-surface", padded && "p-4", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  meta,
  action,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center justify-between gap-3 px-4 py-3", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate text-[13px] font-semibold tracking-[-0.01em]">{title}</h2>
        {meta && <span className="shrink-0 text-[12px] text-muted-foreground">{meta}</span>}
      </div>
      {action && <div className="shrink-0 text-[12px]">{action}</div>}
    </div>
  );
}

/* ───────────────────────── Metrics ───────────────────────── */

export type MetricTone = "neutral" | "info" | "success" | "warning" | "danger" | "purple";

const toneText: Record<MetricTone, string> = {
  neutral: "text-foreground",
  info: "text-[#7DB3FB]",
  success: "text-[#4ADE80]",
  warning: "text-[#FBBF24]",
  danger: "text-[#F87171]",
  purple: "text-[#C4B5FD]",
};

const toneWash: Record<MetricTone, string> = {
  neutral: "bg-white/[0.06] text-muted-foreground",
  info: "bg-[#3B82F6]/12 text-[#7DB3FB]",
  success: "bg-[#22C55E]/12 text-[#4ADE80]",
  warning: "bg-[#F59E0B]/12 text-[#FBBF24]",
  danger: "bg-[#EF4444]/12 text-[#F87171]",
  purple: "bg-[#A78BFA]/12 text-[#C4B5FD]",
};

/** Metric with context — never a bare number. */
export function StatTile({
  label,
  value,
  context,
  icon,
  tone = "neutral",
  to,
}: {
  label: string;
  value: ReactNode;
  context?: ReactNode;
  icon?: ReactNode;
  tone?: MetricTone;
  to?: string;
}) {
  const body = (
    <div className="p-surface-flat flex min-w-0 flex-col gap-3 p-4 transition-colors hover:border-white/12">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", toneWash[tone])}>
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="min-w-0">
        <div className={cn("truncate text-[26px] font-semibold leading-none tracking-[-0.03em]", toneText[tone])}>
          {value}
        </div>
        {context && (
          <div className="mt-1.5 truncate text-[12px] text-muted-foreground">{context}</div>
        )}
      </div>
    </div>
  );
  return to ? (
    <Link to={to as never} className="block min-w-0">
      {body}
    </Link>
  ) : (
    body
  );
}

/* ───────────────────────── Status chips ───────────────────────── */

const chipForTone: Record<BadgeTone, string> = {
  sky: "p-chip-info",
  amber: "p-chip-warning",
  oxblood: "p-chip-danger",
  emerald: "p-chip-success",
  dark: "p-chip-neutral",
  neutral: "p-chip-neutral",
};

export function StatusChip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone | MetricTone;
  children: ReactNode;
  className?: string;
}) {
  const cls =
    tone in chipForTone
      ? chipForTone[tone as BadgeTone]
      : `p-chip-${tone === "info" ? "info" : tone}`;
  return <span className={cn("p-chip", cls, className)}>{children}</span>;
}

/* ───────────────────────── Tables ───────────────────────── */

export function TableShell({
  children,
  className,
  maxHeight,
}: {
  children: ReactNode;
  className?: string;
  maxHeight?: number | string;
}) {
  return (
    <div className={cn("p-surface-flat overflow-hidden", className)}>
      <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <table className="p-table">{children}</table>
      </div>
    </div>
  );
}

/* ───────────────────────── States ───────────────────────── */

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] text-muted-foreground">
        {icon ?? <Inbox className="h-4 w-4" strokeWidth={1.75} />}
      </span>
      <div className="text-[14px] font-medium">{title}</div>
      {description && (
        <p className="max-w-sm text-[12px] leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingRow({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-14 text-[12px] text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
      {label}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/[0.05]", className)} />;
}
