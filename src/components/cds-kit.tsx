/**
 * Cleard Design System — interaction kit.
 *
 * Pure presentation primitives shared by every portal page: scroll reveals,
 * KPI tiles, the stage pipeline, the week strip, upload drop zone, right-side
 * detail panel, skeletons and empty states. No data fetching, no business
 * logic, no routing decisions.
 *
 * Palette is fixed: teal #673147 · ink #2F4F4F · off-white #F3EAD9 ·
 * border #E0D3BC. Radius is always 0.
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const CDS = {
  white: "#FAF3E6",
  off: "#F3EAD9",
  off2: "#EFE6D6",
  black: "#2F4F4F",
  gray: "#5C7370",
  grayLt: "#8B9A97",
  teal: "#673147",
  tealDark: "#52243A",
  tealText: "#4E6B5C",
  border: "#E0D3BC",
  red: "#8C3B3B",
  blue: "#673147",
  purple: "#7a5c8a",
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

/* ───────────────────────── KPI tiles ───────────────────────── */

export type KpiTone = "ink" | "teal" | "red" | "blue" | "gray";

const kpiColor: Record<KpiTone, string> = {
  ink: CDS.black,
  teal: CDS.tealText,
  red: CDS.red,
  blue: CDS.blue,
  gray: CDS.gray,
};

/** Top-of-page KPI row. 2 up on mobile, 4 up from md. */
export function KpiBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal className={cn("mb-4", className)}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{children}</div>
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
      className={cn("min-w-0 text-left transition-colors", onClick && "hover:bg-[#F3EAD9]")}
      style={{ background: CDS.white, border: `1px solid ${CDS.border}`, padding: "16px 20px" }}
    >
      <div
        className="truncate"
        style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: kpiColor[tone] }}
      >
        {value}
      </div>
      <div className="truncate" style={{ fontSize: 11, color: CDS.grayLt, marginTop: 2 }}>
        {label}
      </div>
      {context && (
        <div className="truncate" style={{ fontSize: 11, color: CDS.gray, marginTop: 4 }}>
          {context}
        </div>
      )}
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

export function StagePipeline({
  stages,
  active,
  onSelect,
}: {
  stages: PipelineStage[];
  /** null = All */
  active: string | null;
  onSelect: (key: string | null) => void;
}) {
  const total = stages.reduce((s, st) => s + st.count, 0);
  return (
    <Reveal className="mb-4">
      <div
        className="flex min-w-0 overflow-x-auto"
        style={{ border: `1px solid ${CDS.border}`, background: CDS.off }}
        role="tablist"
        aria-label="Permit stages"
      >
        <PipelineCell
          label="All"
          count={total}
          selected={active === null}
          onClick={() => onSelect(null)}
        />
        {stages.map((s) => (
          <PipelineCell
            key={s.key}
            label={s.label}
            count={s.count}
            countColor={s.countColor}
            selected={active === s.key}
            onClick={() => onSelect(active === s.key ? null : s.key)}
          />
        ))}
      </div>
    </Reveal>
  );
}

function PipelineCell({
  label,
  count,
  countColor,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  countColor?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className="min-w-[104px] flex-1 text-left transition-colors hover:bg-[#EFE6D6]"
      style={{
        background: selected ? CDS.off2 : CDS.off,
        borderRight: `1px solid ${CDS.border}`,
        borderBottom: selected ? `3px solid ${CDS.teal}` : "3px solid transparent",
        padding: "16px 20px",
      }}
    >
      <div
        className="truncate"
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: CDS.grayLt,
        }}
      >
        {label}
      </div>
      <div
        className="tabular-nums"
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: countColor ?? CDS.black,
          marginTop: 2,
        }}
      >
        {count}
      </div>
    </button>
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

  return (
    <Reveal className="mb-4">
      <div className="flex min-w-0 items-stretch" style={{ border: `1px solid ${CDS.border}` }}>
        <StripArrow label="Previous week" onClick={() => onShift(-1)}>
          ‹
        </StripArrow>
        <div className="grid min-w-0 flex-1 grid-cols-7">
          {days.map((d) => {
            const iso = isoDay(d);
            const n = counts[iso] ?? 0;
            const isToday = iso === today;
            const isSelected = selected === iso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelect(isSelected ? null : iso)}
                className="min-w-0 px-2 py-3 text-center transition-colors"
                style={{
                  background: isToday ? CDS.black : isSelected ? CDS.off2 : CDS.white,
                  color: isToday ? CDS.white : CDS.black,
                  borderRight: `1px solid ${CDS.border}`,
                  borderBottom: isSelected ? `3px solid ${CDS.teal}` : "3px solid transparent",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>
                  {d.getDate()}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: isToday ? "rgba(255,255,255,0.65)" : CDS.grayLt,
                    marginTop: 2,
                  }}
                >
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div style={{ marginTop: 6, minHeight: 16 }}>
                  {n > 0 && (
                    <span
                      style={{
                        background: CDS.teal,
                        color: CDS.black,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        display: "inline-block",
                      }}
                    >
                      {n}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <StripArrow label="Next week" onClick={() => onShift(1)}>
          ›
        </StripArrow>
      </div>
    </Reveal>
  );
}

function StripArrow({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="shrink-0 px-3 transition-colors hover:bg-[#F3EAD9]"
      style={{ background: CDS.white, color: CDS.gray, fontSize: 18, lineHeight: 1 }}
    >
      {children}
    </button>
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
        border: `1.5px dashed ${over ? CDS.teal : CDS.border}`,
        background: over ? "rgba(103, 49, 71,0.04)" : CDS.off,
        padding: 28,
      }}
    >
      <div style={{ fontSize: 14, color: CDS.grayLt }}>
        {hint}{" "}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ color: CDS.black, fontWeight: 600, background: "none", border: "none" }}
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
            className="shrink-0 p-1 transition-colors hover:bg-[#F3EAD9]"
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
        <div key={i} style={{ background: CDS.white, border: `1px solid ${CDS.border}`, padding: 20 }}>
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
      style={{ padding: "56px 24px", background: CDS.white, border: `1px solid ${CDS.border}` }}
    >
      <div
        className="grid place-items-center"
        style={{ width: 48, height: 48, background: CDS.off, border: `1px solid ${CDS.border}`, color: CDS.grayLt }}
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

const tagStyle: Record<TagTone, CSSProperties> = {
  success: { background: "rgba(103, 49, 71,0.12)", color: CDS.tealText },
  danger: { background: "rgba(220,60,60,0.1)", color: CDS.red },
  neutral: { background: "rgba(0,0,0,0.06)", color: CDS.gray },
  info: { background: "rgba(103, 49, 71,0.1)", color: CDS.blue },
  progress: { background: "rgba(122, 92, 138,0.1)", color: CDS.purple },
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
  return (
    <span
      className={cn("inline-block whitespace-nowrap", className)}
      style={{
        ...tagStyle[tone],
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 8px",
      }}
    >
      {children}
    </span>
  );
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
          border: `1px solid ${alert ? "rgba(220,60,60,0.3)" : CDS.border}`,
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
