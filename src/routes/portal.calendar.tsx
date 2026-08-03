import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  ArrowUpDown,
} from "lucide-react";
import {
  listDeadlines,
  DEADLINE_KIND_META,
  DEADLINE_COLOR_CLASSES,
  type Deadline,
  type DeadlineKind,
} from "@/lib/deadlines";

export const Route = createFileRoute("/portal/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Cleard" },
      {
        name: "description",
        content: "Every upcoming permit expiration, inspection, correction response, fee, and NTBO filing across your projects, in one calendar.",
      },
      { property: "og:title", content: "Calendar — Cleard" },
      {
        property: "og:description",
        content: "Every upcoming permit expiration, inspection, correction response, fee, and NTBO filing across your projects, in one calendar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CalendarPage,
});

const ALL_KINDS = Object.keys(DEADLINE_KIND_META) as DeadlineKind[];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtISODate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CalendarPage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [activeKinds, setActiveKinds] = useState<Set<DeadlineKind>>(new Set(ALL_KINDS));
  const [sortKey, setSortKey] = useState<"date" | "type" | "project">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const deadlines = useMemo(() => listDeadlines(), []);

  const filtered = useMemo(
    () => deadlines.filter((d) => activeKinds.has(d.kind)),
    [deadlines, activeKinds],
  );

  function toggleKind(k: DeadlineKind) {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function toggleSort(key: "date" | "type" | "project") {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedList = useMemo(() => {
    const today = new Date(new Date().toDateString());
    const upcoming = [...filtered].filter((d) => new Date(`${d.date}T00:00:00`) >= today || true);
    upcoming.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      else if (sortKey === "type") cmp = DEADLINE_KIND_META[a.kind].label.localeCompare(DEADLINE_KIND_META[b.kind].label);
      else cmp = a.projectName.localeCompare(b.projectName);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return upcoming;
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="label-eyebrow font-mono text-[10px] uppercase tracking-[0.22em] text-obsidian/50">
            Calendar
          </div>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-obsidian">Deadlines</h1>
          <p className="mt-2 text-sm text-obsidian/60 max-w-xl">
            Permit expirations, inspections, correction responses, fees, and NTBO filings across
            {" "}
            {new Set(deadlines.map((d) => d.projectId)).size} project(s).
          </p>
        </div>

        <div className="inline-flex rounded-sm border hairline p-1 bg-paper-warm">
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-[2px] px-3 py-2 text-xs font-mono uppercase tracking-wide transition-colors ${
              view === "calendar" ? "bg-obsidian text-white" : "text-obsidian/60 hover:text-obsidian"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-[2px] px-3 py-2 text-xs font-mono uppercase tracking-wide transition-colors ${
              view === "list" ? "bg-obsidian text-white" : "text-obsidian/60 hover:text-obsidian"
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      <KindLegend activeKinds={activeKinds} onToggle={toggleKind} />

      {view === "calendar" ? (
        <MonthGrid cursor={cursor} setCursor={setCursor} deadlines={filtered} />
      ) : (
        <ListView list={sortedList} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
      )}
    </div>
  );
}

function KindLegend({
  activeKinds,
  onToggle,
}: {
  activeKinds: Set<DeadlineKind>;
  onToggle: (k: DeadlineKind) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ALL_KINDS.map((k) => {
        const meta = DEADLINE_KIND_META[k];
        const colors = DEADLINE_COLOR_CLASSES[meta.color];
        const active = activeKinds.has(k);
        return (
          <button
            key={k}
            type="button"
            onClick={() => onToggle(k)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-sm border px-3 py-2 text-xs font-mono uppercase tracking-wide transition-opacity ${colors.badge} ${
              active ? "opacity-100" : "opacity-35"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

function MonthGrid({
  cursor,
  setCursor,
  deadlines,
}: {
  cursor: Date;
  setCursor: (d: Date) => void;
  deadlines: Deadline[];
}) {
  const today = new Date();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Deadline[]>();
    deadlines.forEach((d) => {
      const list = map.get(d.date) ?? [];
      list.push(d);
      map.set(d.date, list);
    });
    return map;
  }, [deadlines]);

  const monthStart = startOfMonth(cursor);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }

  return (
    <div className="border hairline rounded-sm overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b hairline px-4 py-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-obsidian/60 hover:bg-paper-warm hover:text-obsidian"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-display text-lg tracking-tight text-obsidian">
          {monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-obsidian/60 hover:bg-paper-warm hover:text-obsidian"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b hairline bg-paper-warm">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="px-1 py-2 text-center font-mono text-[10px] uppercase tracking-wide text-obsidian/50">
            {w[0]}
            <span className="hidden sm:inline">{w.slice(1)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const inMonth = day.getMonth() === monthStart.getMonth();
          const iso = day.toISOString().slice(0, 10);
          const items = byDate.get(iso) ?? [];
          const isToday = isSameDay(day, today);
          const maxVisible = 2;
          const visible = items.slice(0, maxVisible);
          const overflow = items.length - visible.length;
          const dayExpanded = expandedDay === iso;

          return (
            <div
              key={idx}
              className={`min-h-[84px] sm:min-h-[104px] border-b border-r hairline p-1 sm:p-1.5 ${
                inMonth ? "bg-white" : "bg-paper-warm/50"
              }`}
            >
              <div
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] ${
                  isToday ? "bg-obsidian text-white" : inMonth ? "text-obsidian/70" : "text-obsidian/30"
                }`}
              >
                {day.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {(dayExpanded ? items : visible).map((d) => (
                  <DeadlineChip key={d.id} deadline={d} />
                ))}
                {overflow > 0 && !dayExpanded && (
                  <button
                    type="button"
                    onClick={() => setExpandedDay(iso)}
                    className="min-h-[24px] w-full rounded-[2px] px-1 text-left font-mono text-[10px] uppercase tracking-wide text-obsidian/50 hover:text-obsidian"
                  >
                    +{overflow} more
                  </button>
                )}
                {dayExpanded && items.length > maxVisible && (
                  <button
                    type="button"
                    onClick={() => setExpandedDay(null)}
                    className="min-h-[24px] w-full rounded-[2px] px-1 text-left font-mono text-[10px] uppercase tracking-wide text-obsidian/50 hover:text-obsidian"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeadlineChip({ deadline }: { deadline: Deadline }) {
  const meta = DEADLINE_KIND_META[deadline.kind];
  const colors = DEADLINE_COLOR_CLASSES[meta.color];
  return (
    <Link
      to="/portal/projects/$id"
      params={{ id: deadline.projectId }}
      search={{ tab: deadline.tab } as never}
      title={`${deadline.projectName} — ${deadline.description}`}
      className={`flex min-h-[24px] items-center gap-1 truncate rounded-[2px] border px-1 py-0.5 text-[10px] font-mono leading-tight ${colors.chip}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
      <span className="truncate">{deadline.projectName}</span>
    </Link>
  );
}

function ListView({
  list,
  sortKey,
  sortDir,
  onSort,
}: {
  list: Deadline[];
  sortKey: "date" | "type" | "project";
  sortDir: "asc" | "desc";
  onSort: (key: "date" | "type" | "project") => void;
}) {
  return (
    <div className="border hairline rounded-sm overflow-x-auto bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b hairline bg-paper-warm text-left">
            <SortableHeader label="Date" active={sortKey === "date"} dir={sortDir} onClick={() => onSort("date")} />
            <SortableHeader label="Type" active={sortKey === "type"} dir={sortDir} onClick={() => onSort("type")} />
            <SortableHeader label="Project" active={sortKey === "project"} dir={sortDir} onClick={() => onSort("project")} />
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wide text-obsidian/50">Description</th>
            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wide text-obsidian/50">Assigned</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--rule)]">
          {list.map((d) => {
            const meta = DEADLINE_KIND_META[d.kind];
            const colors = DEADLINE_COLOR_CLASSES[meta.color];
            return (
              <tr key={d.id} className="hover:bg-paper-warm/60">
                <td className="px-4 py-3 align-top font-mono text-xs tabular-nums text-obsidian/80 whitespace-nowrap">
                  {fmtISODate(d.date)}
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-wide ${colors.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                    {meta.label}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <Link
                    to="/portal/projects/$id"
                    params={{ id: d.projectId }}
                    search={{ tab: d.tab } as never}
                    className="min-h-11 inline-flex items-center font-medium text-obsidian hover:text-sky hover:underline"
                  >
                    {d.projectName}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top text-obsidian/70">{d.description}</td>
                <td className="px-4 py-3 align-top whitespace-nowrap text-obsidian/70">{d.assignedStaff}</td>
              </tr>
            );
          })}
          {list.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-obsidian/50">
                No deadlines match the selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex min-h-11 items-center gap-1 font-mono text-[10px] uppercase tracking-wide ${
          active ? "text-obsidian" : "text-obsidian/50"
        } hover:text-obsidian`}
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? "opacity-100" : "opacity-40"}`} />
        {active && <span className="sr-only">{dir === "asc" ? "ascending" : "descending"}</span>}
      </button>
    </th>
  );
}
