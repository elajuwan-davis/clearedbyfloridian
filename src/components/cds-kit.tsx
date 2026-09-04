/**
 * Cleard Design System — interaction kit.
 *
 * Pure presentation primitives shared by every portal page: scroll reveals,
 * KPI tiles, the stage pipeline, the week strip, upload drop zone, right-side
 * detail panel, skeletons and empty states. No data fetching, no business
 * logic, no routing decisions.
 *
 * Palette: White Sand #FFFFFF · Ink #2B1620 · True Black #000000 · Copper
 * #9C6B3F (accent only). Radius is 8px. Type is Instrument Sans.
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const CDS = {
  white: "#FFFFFF",
  off: "#F6F6F6",
  off2: "#EFEFEF",
  black: "#000000",
  ink: "#2B1620",
  gray: "rgba(0,0,0,0.62)",
  grayLt: "rgba(0,0,0,0.45)",
  copper: "#9C6B3F",
  copperDark: "#7F562F",
  copperSoft: "rgba(156,107,63,0.10)",
  teal: "#9C6B3F",
  tealDark: "#7F562F",
  tealText: "#2E7D32",
  border: "rgba(0,0,0,0.10)",
  red: "#C0392B",
  blue: "#9C6B3F",
  purple: "#9C6B3F",
} as const;

/* ───────────────────────── Scroll reveal ───────────────────────── */

/** Fades a section in on first scroll into view: opacity 0→1, y 16px→0. */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  /** ms — use 60 × index for staggered grids. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
  };

  return (
    <Tag ref={ref as never} className={cn("min-w-0", className)} style={style}>
      {children}
    </Tag>
  );
}

/* ───────────────────────── Stat strip ───────────────────────── */

export type KpiTone = "ink" | "teal" | "red" | "blue" | "gray";

const kpiTone: Record<KpiTone, string> = {
  ink: "neutral",
  teal: "success",
  red: "danger",
  blue: "accent",
  gray: "muted",
};

/** Top-of-page numbers: one quiet line, not a grid of boxes. */
export function KpiBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal className={cn("mb-4", className)}>
      <div className="p-stat-strip">{children}</div>
    </Reveal>
  );
}

export function Kpi({
  label,
  value,
  context,
  tone = "ink",
  onClick,
}: {
  label: string;
  value: ReactNode;
  context?: ReactNode;
  tone?: KpiTone;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("p-stat min-w-0 text-left", onClick && "cursor-pointer hover:opacity-80")}
      data-tone={kpiTone[tone]}
      title={typeof context === "string" ? context : undefined}
    >
      <span className="p-stat-value tabular-nums">{value}</span>
      <span className="p-stat-label truncate">{label}</span>
    </Tag>
  );
}

/* ───────────────────────── Stage pipeline ───────────────────────── */

export type PipelineStage = {
  key: string;
  label: string;
  count: number;
  /** Overrides the count colour (Corrections = red, CO = teal). */
  countColor?: string;
};

/** Status filter as a row of chips with counts. null = All. */
export function StagePipeline({
  stages,
  active,
  onSelect,
  hideEmpty = false,
}: {
  stages: PipelineStage[];
  /** null = All */
  active: string | null;
  onSelect: (key: string | null) => void;
  /** Hide stages with a zero count (the active one always shows). */
  hideEmpty?: boolean;
}) {
  const total = stages.reduce((s, st) => s + st.count, 0);
  const visible = hideEmpty ? stages.filter((s) => s.count > 0 || s.key === active) : stages;
  return (
    <Reveal className="mb-4">
      <div className="p-filter-row" role="tablist" aria-label="Filter by stage">
        <button
          type="button"
          role="tab"
          aria-selected={active === null}
          data-active={active === null}
          className="p-filter-chip"
          onClick={() => onSelect(null)}
        >
          All <span className="p-count">{total}</span>
        </button>
        {visible.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={active === s.key}
            data-active={active === s.key}
            data-tone={
              s.countColor === CDS.red ? "danger" : s.countColor === CDS.tealText ? "success" : undefined
            }
            className="p-filter-chip"
            onClick={() => onSelect(active === s.key ? null : s.key)}
          >
            {s.label} <span className="p-count">{s.count}</span>
          </button>
        ))}
      </div>
    </Reveal>
  );
}

/* ───────────────────────── Week strip ───────────────────────── */

export function startOfWeek(d: Date) {
  const out = new Date(d);
  const day = (out.getDay() + 6) % 7; // Monday-first
  out.setDate(out.getDate() - day);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Compact date filter: a "‹ week ›" pager plus one chip per day that has
 * inspections. No calendar grid — days with nothing scheduled don't render.
 */
export function WeekStrip({
  weekStart,
  counts,
  selected,
  onSelect,
  onShift,
}: {
  weekStart: Date;
  /** ISO date → inspection count */
  counts: Record<string, number>;
  selected: string | null;
  onSelect: (iso: string | null) => void;
  onShift: (weeks: number) => void;
}) {
  const today = isoDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekEnd = days[6];
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const busy = days.filter((d) => (counts[isoDay(d)] ?? 0) > 0 || isoDay(d) === selected);

  return (
    <Reveal className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="p-seg" aria-label="Week">
          <button type="button" aria-label="Previous week" onClick={() => onShift(-1)}>
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <span className="px-2 text-[13px] font-medium tabular-nums" style={{ color: CDS.black }}>
            {fmt(weekStart)} – {fmt(weekEnd)}
          </span>
          <button type="button" aria-label="Next week" onClick={() => onShift(1)}>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
        <div className="p-filter-row">
          <button
            type="button"
            className="p-filter-chip"
            data-active={selected === null}
            onClick={() => onSelect(null)}
          >
            All days
          </button>
          {busy.map((d) => {
            const iso = isoDay(d);
            const n = counts[iso] ?? 0;
            return (
              <button
                key={iso}
                type="button"
                className="p-filter-chip"
                data-active={selected === iso}
                onClick={() => onSelect(selected === iso ? null : iso)}
              >
                {iso === today ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                <span className="p-count">{n}</span>
              </button>
            );
          })}
          {busy.length === 0 && (
            <span className="self-center text-[12px]" style={{ color: CDS.grayLt }}>
              Nothing scheduled this week
            </span>
          )}
        </div>
      </div>
    </Reveal>
  );
}

/* ───────────────────────── Drop zone ───────────────────────── */

export function DropZone({
  onFiles,
  hint = "Drop files here or",
  accept,
}: {
  onFiles?: (files: File[]) => void;
  hint?: string;
  accept?: string;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles?.(Array.from(e.dataTransfer.files ?? []));
      }}
      className="text-center"
      style={{
        border: `1.5px dashed ${over ? CDS.copper : "rgba(0,0,0,0.18)"}`,
        borderRadius: 8,
        background: over ? CDS.copperSoft : CDS.off,
        padding: 28,
      }}
    >
      <div style={{ fontSize: 14, color: CDS.grayLt }}>
        {hint}{" "}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ color: CDS.copper, fontWeight: 600, background: "none", border: "none", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          browse
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => onFiles?.(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}

/* ───────────────────────── Right-side detail panel ───────────────────────── */

export function SidePanel({
  open,
  title,
  meta,
  onClose,
  children,
  footer,
  width = 400,
}: {
  open: boolean;
  title: ReactNode;
  meta?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className="fixed inset-0 z-[190] transition-opacity"
        style={{
          background: "rgba(0,0,0,0.4)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />
      <aside
        role="dialog"
        aria-hidden={!open}
        className="fixed right-0 top-0 z-[200] flex h-full max-w-full flex-col transition-transform"
        style={{
          width,
          background: CDS.white,
          borderLeft: `1px solid ${CDS.border}`,
          boxShadow: open ? "0 16px 48px rgba(0,0,0,0.12)" : "none",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <header
          className="flex items-start justify-between gap-3"
          style={{ borderBottom: `1px solid ${CDS.border}`, padding: "16px 20px" }}
        >
          <div className="min-w-0">
            <div
              className="truncate"
              style={{ fontSize: 16, fontWeight: 700, color: CDS.black }}
            >
              {title}
            </div>
            {meta && (
              <div className="truncate" style={{ fontSize: 12, color: CDS.gray, marginTop: 2 }}>
                {meta}
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[#F6F6F6]"
            style={{ color: CDS.gray }}
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ padding: 20 }}>
          {open ? children : null}
        </div>
        {footer && (
          <footer
            className="flex justify-end gap-2.5"
            style={{ borderTop: `1px solid ${CDS.border}`, padding: "16px 20px" }}
          >
            {footer}
          </footer>
        )}
      </aside>
    </>
  );
}

/* ───────────────────────── Skeletons & empty states ───────────────────────── */

export function Skeleton({
  height = 14,
  width = "100%",
  className,
}: {
  height?: number;
  width?: number | string;
  className?: string;
}) {
  return <div className={cn("cds-skel", className)} style={{ height, width }} />;
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3" style={{ padding: "8px 0" }}>
          <Skeleton height={12} width="18%" />
          <Skeleton height={12} width="34%" />
          <Skeleton height={12} width="22%" />
          <Skeleton height={12} width="14%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: CDS.white, border: `1px solid ${CDS.border}`, borderRadius: 8, padding: 20 }}>
          <Skeleton height={15} width="55%" />
          <div className="mt-2">
            <Skeleton height={11} width="38%" />
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton height={16} width={72} />
            <Skeleton height={16} width={72} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Centred empty state: placeholder tile, headline, sub, primary action. */
export function CdsEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: "56px 24px", background: CDS.white, border: `1px solid ${CDS.border}`, borderRadius: 8 }}
    >
      <div
        className="grid place-items-center"
        style={{ width: 48, height: 48, background: CDS.copperSoft, borderRadius: 8, color: CDS.copper }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: CDS.black, marginTop: 14 }}>{title}</div>
      {description && (
        <p style={{ fontSize: 13, color: CDS.gray, marginTop: 4, maxWidth: 420 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/* ───────────────────────── Tag ───────────────────────── */

export type TagTone = "success" | "danger" | "neutral" | "info" | "progress";

const tagClass: Record<TagTone, string> = {
  success: "p-chip-success",
  danger: "p-chip-danger",
  neutral: "p-chip-neutral",
  info: "p-chip-info",
  progress: "p-chip-info",
};

export function Tag({
  tone = "neutral",
  children,
  className,
}: {
  tone?: TagTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("p-chip", tagClass[tone], className)}>{children}</span>;
}

/** Status label → tag tone, following the locked badge palette. */
export function toneForStatus(raw: string): TagTone {
  const s = raw.toLowerCase();
  if (/(approved|verified|passed|clear|active|complete|current)/.test(s)) return "success";
  if (/(correction|alert|expired|failed|overdue|cancel|hold|reject)/.test(s)) return "danger";
  if (/(issued|licensed|paid)/.test(s)) return "info";
  if (/(scheduled|en route|in progress|route)/.test(s)) return "progress";
  return "neutral";
}

/* ───────────────────────── Card ───────────────────────── */

/** White card, 1px border, 20px padding, optional hover lift + reveal stagger. */
export function CdsCard({
  children,
  index = 0,
  interactive = true,
  alert = false,
  className,
  onClick,
  style,
}: {
  children: ReactNode;
  index?: number;
  interactive?: boolean;
  alert?: boolean;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <Reveal delay={Math.min(index, 12) * 60} className={cn("min-w-0", className)}>
      <div
        onClick={onClick}
        className={cn("cds-card-base h-full min-w-0", interactive && "cds-card-hover")}
        style={{
          background: CDS.white,
          border: `1px solid ${alert ? "rgba(192,57,43,0.35)" : CDS.border}`,
          borderRadius: 8,
          padding: 20,
          cursor: onClick ? "pointer" : undefined,
          ...style,
        }}
      >
        {children}
      </div>
    </Reveal>
  );
}
