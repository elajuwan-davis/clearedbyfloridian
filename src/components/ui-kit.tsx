/**
 * Cleard Design System v1.0 — shared presentation primitives.
 *
 * Pure presentation. No data fetching, no business logic. Every portal page
 * composes its screen from these so spacing, typography, radius, density and
 * rhythm are identical everywhere.
 */
import type { ComponentProps, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Inbox, Loader2, Search } from "lucide-react";
import type { BadgeTone } from "@/lib/status-badges";
import { cn } from "@/lib/utils";

/* ───────────────────────── Layout rhythm ─────────────────────────
   One header (≤72px), one toolbar row, then content. Nothing else
   is allowed above the primary content of a page.
   ──────────────────────────────────────────────────────────────── */

export type Crumb = { label: string; to?: string };

/**
 * PageShell — the only page wrapper. Full widescreen width, 8pt rhythm,
 * sticky compact header. Every page: <PageShell title=… actions=…>content</PageShell>
 */
export function PageShell({
  crumbs,
  title,
  meta,
  actions,
  toolbar,
  children,
  className,
  width = "wide",
}: {
  crumbs?: Crumb[];
  title: ReactNode;
  /** Short inline metadata beside the title — counts, statuses. Never a paragraph. */
  meta?: ReactNode;
  actions?: ReactNode;
  /** Single row of search / filters / segmented controls. */
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  width?: "wide" | "narrow";
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div
        className="sticky top-12 z-20 border-b"
        style={{ backgroundColor: "var(--p-bg)", borderColor: "var(--p-border)" }}
      >
        <div
          className={cn(
            "mx-auto flex min-h-[56px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6",
            width === "narrow" ? "max-w-3xl" : "max-w-[1600px]",
          )}
        >
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            {crumbs && crumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[11px]">
                {crumbs.map((c, i) => (
                  <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                    {i > 0 && (
                      <ChevronRight className="h-3 w-3 shrink-0 opacity-35" strokeWidth={1.75} />
                    )}
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
            <div className="flex min-w-0 items-center gap-2.5">
              <h1 className="truncate text-[18px] font-semibold leading-tight tracking-[-0.02em]">
                {title}
              </h1>
              {meta && (
                <span className="shrink-0 truncate text-[12px] text-muted-foreground">{meta}</span>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {toolbar && (
          <div
            className={cn(
              "mx-auto flex min-w-0 flex-wrap items-center gap-2 px-4 pb-2.5 sm:px-6",
              width === "narrow" ? "max-w-3xl" : "max-w-[1600px]",
            )}
          >
            {toolbar}
          </div>
        )}
      </div>
      <div
        className={cn(
          "mx-auto min-w-0 px-4 py-4 sm:px-6",
          width === "narrow" ? "max-w-3xl" : "max-w-[1600px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Legacy header (still used by pages not yet on PageShell). Compact. */
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
    <header className={cn("mb-4", className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1 flex min-w-0 items-center gap-1 text-[11px]">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-35" strokeWidth={1.75} />}
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
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-[18px] font-semibold leading-tight tracking-[-0.02em]">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 max-w-[68ch] text-[12px] leading-snug text-muted-foreground">
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
    <div className={cn("mb-3 flex flex-wrap items-center gap-2", className)}>{children}</div>
  );
}

/** Widescreen split: primary content + secondary column. */
export function Split({
  main,
  aside,
  asideWidth = 340,
  className,
}: {
  main: ReactNode;
  aside?: ReactNode;
  asideWidth?: number;
  className?: string;
}) {
  if (!aside) return <div className={cn("min-w-0", className)}>{main}</div>;
  return (
    <div
      className={cn("grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_var(--aside)]", className)}
      style={{ ["--aside" as string]: `${asideWidth}px` }}
    >
      <div className="min-w-0">{main}</div>
      <div className="min-w-0 space-y-4">{aside}</div>
    </div>
  );
}

/** Responsive metric row — the only place bare numbers live. */
export function MetricRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
        className,
      )}
    >
      {children}
    </div>
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
      className={cn(flat ? "p-surface-flat" : "p-surface", padded && "p-3", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Bare content plate — surface contrast, no border. Default container. */
export function Panel({
  title,
  meta,
  action,
  children,
  className,
  bodyClassName,
  padded = true,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("p-plate min-w-0 overflow-hidden", className)}>
      {title && <SectionHeader title={title} meta={meta} action={action} />}
      <div className={cn(padded && "px-3 pb-3", !title && padded && "pt-3", bodyClassName)}>
        {children}
      </div>
    </section>
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
    <div className={cn("flex min-w-0 items-center justify-between gap-3 px-3 py-2", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate text-[12.5px] font-semibold tracking-[-0.01em]">{title}</h2>
        {meta && <span className="shrink-0 text-[11.5px] text-muted-foreground">{meta}</span>}
      </div>
      {action && <div className="shrink-0 text-[11.5px]">{action}</div>}
    </div>
  );
}

/* ───────────────────────── Controls ───────────────────────── */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cn("p-seg", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          data-active={value === o.value}
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {typeof o.count === "number" && (
            <span className="ml-1.5 opacity-55">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-0 pl-8 pr-2 text-[12.5px] outline-none focus:ring-1 focus:ring-[var(--p-info)]"
      />
    </div>
  );
}

/** Metadata pair — label visually disappears until needed. */
export function KV({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[10.5px] uppercase tracking-[0.07em] text-muted-foreground/70">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[12.5px]">{children}</div>
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

/** Compact metric — label above, bold number, muted context. No card chrome. */
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
    <div className="p-plate p-hover-plate flex min-w-0 flex-col gap-1.5 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {icon && (
          <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md", toneWash[tone])}>
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            "truncate text-[20px] font-semibold leading-none tracking-[-0.03em]",
            toneText[tone],
          )}
        >
          {value}
        </div>
        {context && (
          <div className="mt-1 truncate text-[11.5px] text-muted-foreground">{context}</div>
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
