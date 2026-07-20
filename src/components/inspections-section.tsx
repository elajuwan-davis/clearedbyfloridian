import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Phone, X } from "lucide-react";
import {
  type Inspection,
  type InspectionStatus,
  type InspectionWindow,
  buildInspections,
  loadInspections,
  saveInspections,
  passedCount,
  POOL_INSPECTIONS,
  PSL_HENDERSON_INSPECTIONS,
  PSL_KNIGHT_INSPECTIONS,
} from "@/lib/inspections";

import { addNote } from "@/lib/project-notes";
import type { Municipality } from "@/lib/municipalities";

type Props = {
  projectId: string;
  allPassedSeed?: boolean;
  projectAddress?: string;
  municipality?: Municipality;
};


const STATUS_META: Record<InspectionStatus, { label: string; pill: string }> = {
  passed: { label: "Passed", pill: "bg-[#16a34a] text-white border-[#16a34a]" },
  pending: { label: "Pending", pill: "bg-[#6b7280] text-white border-[#6b7280]" },
  scheduled: { label: "Scheduled", pill: "bg-[#153157] text-white border-[#153157]" },
  corrections: {
    label: "Corrections Required",
    pill: "bg-[#dc2626] text-white border-[#dc2626]",
  },
};

const WINDOW_LABEL: Record<InspectionWindow, string> = {
  morning: "Morning (8am–12pm)",
  afternoon: "Afternoon (12pm–5pm)",
};

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InspectionsSection({
  projectId,
  allPassedSeed = false,
  projectAddress,
  municipality,
}: Props) {
  const template =
    projectId === "22" ? PSL_HENDERSON_INSPECTIONS
    : projectId === "18" ? PSL_KNIGHT_INSPECTIONS
    : POOL_INSPECTIONS;

  const seed = useMemo(() => buildInspections(allPassedSeed, template), [allPassedSeed, template]);
  const [items, setItems] = useState<Inspection[]>(seed);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [scheduling, setScheduling] = useState<Inspection | null>(null);

  useEffect(() => {
    setItems(loadInspections(projectId, seed));
  }, [projectId, seed]);

  function update(code: string, patch: Partial<Inspection>) {
    setItems((prev) => {
      const next = prev.map((i) => (i.code === code ? { ...i, ...patch } : i));
      saveInspections(projectId, next);
      return next;
    });
  }

  function handleSchedule(ins: Inspection, date: string, window: InspectionWindow, notes: string) {
    update(ins.code, {
      status: "scheduled",
      scheduledDate: date,
      scheduledWindow: window,
      scheduledNotes: notes || undefined,
    });
    addNote(
      projectId,
      "System",
      `Inspection scheduled: ${ins.code} ${ins.name} — ${fmtDate(date)} (${WINDOW_LABEL[window]})${
        municipality ? ` · ${municipality.name}` : ""
      }`
    );
    setScheduling(null);
  }

  const passed = passedCount(items);
  const total = items.length;
  const pct = total ? Math.round((passed / total) * 100) : 0;


  return (
    <div>
      <div className="border border-obsidian/10 bg-white">
        <div className="border-b border-obsidian/10 bg-paper-warm px-5 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-obsidian/70">
              {passed} of {total} inspections passed
            </div>
            <div className="font-mono text-[11px] tabular-nums text-obsidian/55">{pct}%</div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-[2px] bg-obsidian/10">
            <div className="h-full bg-[#16a34a] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <ul className="divide-y divide-obsidian/5">
          {items.map((ins) => {
            const meta = STATUS_META[ins.status];
            const isOpen = expanded[ins.code];
            return (
              <li key={ins.code} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex h-8 min-w-[3rem] items-center justify-center bg-[#153157] px-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-white rounded-[3px]">
                    {ins.code.replace(/-.*$/, "")}

                  </span>
                  {ins.phase !== undefined && (
                    <span
                      className="inline-flex h-8 items-center justify-center border border-obsidian/20 bg-sky/20 px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-obsidian rounded-[3px]"
                      title={`Phase ${ins.phase} — inspections in the same phase are typically called together`}
                    >
                      Phase {ins.phase}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [ins.code]: !e[ins.code] }))
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-obsidian">{ins.name}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-obsidian/40 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    {!isOpen && (
                      <div className="mt-0.5 text-xs text-obsidian/55 truncate">
                        {ins.status === "scheduled" && ins.scheduledDate
                          ? `Scheduled ${fmtDate(ins.scheduledDate)}${
                              ins.scheduledWindow ? ` · ${WINDOW_LABEL[ins.scheduledWindow]}` : ""
                            }`
                          : ins.description}
                      </div>
                    )}
                  </button>
                  <span
                    className={`inline-flex items-center border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] rounded-[3px] ${meta.pill}`}
                  >
                    {meta.label}
                  </span>
                  {ins.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => setScheduling(ins)}
                      className="inline-flex items-center gap-1.5 border border-obsidian bg-obsidian px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white rounded-[3px] hover:bg-obsidian/90"
                    >
                      <CalendarDays className="h-3 w-3" /> Schedule
                    </button>
                  )}
                  <select
                    value={ins.status}
                    onChange={(e) =>
                      update(ins.code, {
                        status: e.target.value as InspectionStatus,
                        ...(e.target.value !== "corrections" ? { notes: undefined } : {}),
                      })
                    }
                    className="border border-obsidian/15 bg-white px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="passed">Passed</option>
                    <option value="corrections">Corrections Required</option>
                  </select>
                </div>

                {ins.status === "scheduled" && ins.scheduledDate && (
                  <div className="mt-3 border border-obsidian/10 bg-sky/10 px-3 py-2 text-xs text-obsidian/80 rounded-[3px]">
                    <span className="font-semibold">Scheduled:</span> {fmtDate(ins.scheduledDate)}
                    {ins.scheduledWindow && ` · ${WINDOW_LABEL[ins.scheduledWindow]}`}
                    {ins.scheduledNotes && <div className="mt-1 italic">"{ins.scheduledNotes}"</div>}
                  </div>
                )}

                {isOpen && (
                  <p className="mt-3 text-sm leading-relaxed text-obsidian/75">
                    {ins.description}
                  </p>
                )}

                {ins.status === "corrections" && (
                  <div className="mt-3">
                    <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 mb-1.5">
                      Correction notes
                    </label>
                    <textarea
                      value={ins.notes ?? ""}
                      onChange={(e) => update(ins.code, { notes: e.target.value })}
                      rows={2}
                      placeholder="Describe the correction required by the inspector…"
                      className="block w-full border border-[#dc2626]/40 bg-red-50/40 px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-[#dc2626] focus:outline-none rounded-[3px]"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {scheduling && (
        <ScheduleDialog
          inspection={scheduling}
          projectAddress={projectAddress}
          municipality={municipality}
          onClose={() => setScheduling(null)}
          onSubmit={(date, window, notes) => handleSchedule(scheduling, date, window, notes)}
        />
      )}
    </div>
  );
}

function ScheduleDialog({
  inspection,
  projectAddress,
  municipality,
  onClose,
  onSubmit,
}: {
  inspection: Inspection;
  projectAddress?: string;
  municipality?: Municipality;
  onClose: () => void;
  onSubmit: (date: string, window: InspectionWindow, notes: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(today);
  const [window, setWindow] = useState<InspectionWindow>("morning");
  const [notes, setNotes] = useState<string>("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-obsidian/15 bg-white rounded-[3px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-obsidian/10 px-5 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Schedule Inspection
            </div>
            <div className="mt-1 font-semibold text-obsidian">
              {inspection.code} — {inspection.name}
            </div>
            {projectAddress && (
              <div className="mt-0.5 text-xs text-obsidian/60">{projectAddress}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-obsidian/50 hover:text-obsidian"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 mb-1.5">
              Preferred date
            </label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 mb-1.5">
              Preferred time window
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["morning", "afternoon"] as InspectionWindow[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWindow(w)}
                  className={`border px-3 py-2 text-xs font-medium rounded-[3px] ${
                    window === w
                      ? "border-obsidian bg-obsidian text-white"
                      : "border-obsidian/15 bg-white text-obsidian hover:border-obsidian/40"
                  }`}
                >
                  {WINDOW_LABEL[w]}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-obsidian/10 bg-paper-warm px-3 py-2.5 rounded-[3px]">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Municipality contact
            </div>
            <div className="mt-1 text-sm font-semibold text-obsidian">
              {municipality?.name ?? "Municipality not identified"}
            </div>
            {municipality?.phone && (
              <a
                href={`tel:${municipality.phone.replace(/[^0-9+]/g, "")}`}
                className="mt-1 inline-flex items-center gap-1.5 text-xs text-obsidian/75 hover:text-obsidian"
              >
                <Phone className="h-3 w-3" /> {municipality.phone}
              </a>
            )}
            {municipality?.url && (
              <a
                href={municipality.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-xs text-sky-700 hover:underline"
              >
                {municipality.url}
              </a>
            )}
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Access instructions, contact on site, etc."
              className="block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-obsidian/10 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="border border-obsidian/15 bg-white px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-obsidian rounded-[3px] hover:border-obsidian/40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!date}
            onClick={() => onSubmit(date, window, notes)}
            className="border border-obsidian bg-obsidian px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white rounded-[3px] hover:bg-obsidian/90 disabled:opacity-50"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
