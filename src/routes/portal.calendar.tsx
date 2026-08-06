import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import {
  listDeadlines,
  DEADLINE_KIND_META,
  DEADLINE_COLOR_CLASSES,
  type Deadline,
  type DeadlineKind,
} from "@/lib/deadlines";
import { PageShell, Panel, Split, Segmented, TableShell, EmptyState } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

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

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  useEffect(() => {
    let alive = true;
    listDeadlines().then((rows) => {
      if (alive) setDeadlines(rows);
    });
    return () => { alive = false; };
  }, []);

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
    const upcoming = [...filtered];
    upcoming.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      else if (sortKey === "type") cmp = DEADLINE_KIND_META[a.kind].label.localeCompare(DEADLINE_KIND_META[b.kind].label);
      else cmp = a.projectName.localeCompare(b.projectName);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return upcoming;
  }, [filtered, sortKey, sortDir]);

  const upNext = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return [...filtered]
      .filter((d) => new Date(`${d.date}T00:00:00`) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [filtered]);

  const monthStart = startOfMonth(cursor);
  const projectCount = new Set(deadlines.map((d) => d.projectId)).size;

  return (
    <PageShell
      title={monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      meta={`${projectCount} project${projectCount === 1 ? "" : "s"} · ${filtered.length} deadline${filtered.length === 1 ? "" : "s"}`}
      actions={
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-btn p-btn-ghost p-btn-sm"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="p-btn p-btn-ghost p-btn-sm"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-btn p-btn-ghost p-btn-sm"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      }
      toolbar={
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "calendar", label: "Calendar" },
              { value: "list", label: "List" },
            ]}
          />
          <KindLegend activeKinds={activeKinds} onToggle={toggleKind} />
        </div>
      }
    >
      <Split
        asideWidth={320}
        main={
          view === "calendar" ? (
            <MonthGrid cursor={cursor} setCursor={setCursor} deadlines={filtered} />
          ) : (
            <ListView list={sortedList} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
          )
        }
        aside={
          <Panel title="Up next" bodyClassName="px-0 pb-0">
            {upNext.length === 0 ? (
              <EmptyState title="Nothing on the horizon" description="No upcoming deadlines match your filters." />
            ) : (
              <ul className="p-divide">
                {upNext.map((d) => {
                  const meta = DEADLINE_KIND_META[d.kind];
                  const colors = DEADLINE_COLOR_CLASSES[meta.color];
                  return (
                    <li key={d.id}>
                      <Link
                        to="/portal/permits/$id"
                        params={{ id: d.projectId }}
                        search={{ tab: d.tab } as never}
                        className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-[var(--p-card-2)]"
                      >
                        <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", colors.dot)} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12.5px] font-medium">{d.projectName}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{meta.label} · {fmtISODate(d.date)}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        }
      />
    </PageShell>
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
    <div className="flex flex-wrap items-center gap-1.5">
      {ALL_KINDS.map((k) => {
        const meta = DEADLINE_KIND_META[k];
        const colors = DEADLINE_COLOR_CLASSES[meta.color];
        const active = activeKinds.has(k);
        return (
          <button
            key={k}
            type="button"
            onClick={() => onToggle(k)}
            className={cn(
              "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-opacity",
              colors.badge,
              active ? "opacity-100" : "opacity-35",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

function MonthGrid({
  cursor,
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
  const weeks = cells.length / 7;

  return (
    <div className="p-plate flex min-h-[calc(100vh-160px)] flex-col overflow-hidden">
      <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--p-border)" }}>
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="px-2 py-2 text-center text-[10.5px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
            <span className="sm:hidden">{w[0]}</span>
            <span className="hidden sm:inline">{w}</span>
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}>
        {cells.map((day, idx) => {
          const inMonth = day.getMonth() === monthStart.getMonth();
          const iso = day.toISOString().slice(0, 10);
          const items = byDate.get(iso) ?? [];
          const isToday = isSameDay(day, today);
          const maxVisible = 3;
          const visible = items.slice(0, maxVisible);
          const overflow = items.length - visible.length;
          const dayExpanded = expandedDay === iso;
          const col = idx % 7;
          const row = Math.floor(idx / 7);

          return (
            <div
              key={idx}
              className={cn(
                "group min-h-[92px] p-1.5",
                !inMonth && "bg-[var(--p-card-2)]/40",
                col < 6 && "border-r",
                row < weeks - 1 && "border-b",
              )}
              style={{ borderColor: "var(--p-border)" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] tabular-nums",
                    isToday ? "bg-[var(--p-info)] text-white font-semibold" : inMonth ? "text-foreground/80" : "text-muted-foreground/50",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {(dayExpanded ? items : visible).map((d) => (
                  <DeadlineChip key={d.id} deadline={d} />
                ))}
                {overflow > 0 && !dayExpanded && (
                  <button
                    type="button"
                    onClick={() => setExpandedDay(iso)}
                    className="w-full rounded px-1 text-left text-[10.5px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    +{overflow} more
                  </button>
                )}
                {dayExpanded && items.length > maxVisible && (
                  <button
                    type="button"
                    onClick={() => setExpandedDay(null)}
                    className="w-full rounded px-1 text-left text-[10.5px] font-medium text-muted-foreground hover:text-foreground"
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
      to="/portal/permits/$id"
      params={{ id: deadline.projectId }}
      search={{ tab: deadline.tab } as never}
      title={`${deadline.projectName} — ${deadline.description}`}
      className={cn(
        "flex h-[19px] items-center gap-1 truncate rounded px-1.5 text-[10.5px] font-medium leading-none transition-opacity hover:opacity-80",
        colors.chip,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", colors.dot)} />
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
    <TableShell maxHeight="calc(100vh - 160px)">
      <thead>
        <tr>
          <SortableHeader label="Date" active={sortKey === "date"} dir={sortDir} onClick={() => onSort("date")} />
          <SortableHeader label="Type" active={sortKey === "type"} dir={sortDir} onClick={() => onSort("type")} />
          <SortableHeader label="Project" active={sortKey === "project"} dir={sortDir} onClick={() => onSort("project")} />
          <th>Description</th>
          <th>Assigned</th>
        </tr>
      </thead>
      <tbody>
        {list.map((d) => {
          const meta = DEADLINE_KIND_META[d.kind];
          const colors = DEADLINE_COLOR_CLASSES[meta.color];
          return (
            <tr key={d.id}>
              <td className="whitespace-nowrap tabular-nums">{fmtISODate(d.date)}</td>
              <td className="whitespace-nowrap">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium", colors.badge)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
                  {meta.label}
                </span>
              </td>
              <td>
                <Link
                  to="/portal/permits/$id"
                  params={{ id: d.projectId }}
                  search={{ tab: d.tab } as never}
                  className="font-medium hover:underline"
                >
                  {d.projectName}
                </Link>
              </td>
              <td className="text-muted-foreground">{d.description}</td>
              <td className="whitespace-nowrap text-muted-foreground">{d.assignedStaff}</td>
            </tr>
          );
        })}
        {list.length === 0 && (
          <tr>
            <td colSpan={5}>
              <EmptyState title="No deadlines match the selected filters." />
            </td>
          </tr>
        )}
      </tbody>
    </TableShell>
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
    <th>
      <button
        type="button"
        onClick={onClick}
        className={cn("inline-flex items-center gap-1", active ? "text-foreground" : "text-muted-foreground")}
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", active ? "opacity-100" : "opacity-40")} />
        {active && <span className="sr-only">{dir === "asc" ? "ascending" : "descending"}</span>}
      </button>
    </th>
  );
}
