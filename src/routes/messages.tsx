import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import {
  Search,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  Inbox,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

type Tone = "neutral" | "sky" | "warn" | "ok";
const toneClass: Record<Tone, string> = {
  neutral: "bg-paper-warm text-obsidian/70 border-obsidian/15",
  sky: "bg-sky/10 text-sky border-sky/30",
  warn: "bg-oxblood/10 text-oxblood border-oxblood/30",
  ok: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
};

type Channel = "plan_review" | "corrections" | "inspections" | "general";
const channelMeta: Record<Channel, { label: string; tone: Tone }> = {
  plan_review: { label: "Plan Review", tone: "sky" },
  corrections: { label: "Corrections", tone: "warn" },
  inspections: { label: "Inspections", tone: "neutral" },
  general: { label: "General", tone: "neutral" },
};

type Message = {
  id: string;
  project_id: string;
  permit_no: string;
  project_name: string;
  author: string;
  role: string;
  from_cleared: boolean;
  channel: Channel;
  preview: string;
  at: string;
  at_iso: string;
  unread: boolean;
  has_action?: boolean;
};

const MESSAGES: Message[] = [
  {
    id: "m1",
    project_id: "1",
    permit_no: "CLR-2026-0142",
    project_name: "Ocean Ridge Estate",
    author: "Cleared",
    role: "Plan Review",
    from_cleared: true,
    channel: "corrections",
    preview:
      "Plan review complete. Minor structural notation on Sheet S-201 — see Correction Round 1. 48-hour response clock running.",
    at: "Today · 2:48 PM",
    at_iso: "2026-06-07T14:48",
    unread: true,
    has_action: true,
  },
  {
    id: "m2",
    project_id: "2",
    permit_no: "CLR-2026-0138",
    project_name: "Jupiter Island Residence",
    author: "Cleared",
    role: "Plan Review",
    from_cleared: true,
    channel: "corrections",
    preview:
      "Round 1 opened — 4 items requiring response. Sheet A-101 dimension string, M-201 schedule mismatch, FL-ECC signature, ASCE 7-22 confirmation.",
    at: "Today · 11:14 AM",
    at_iso: "2026-06-07T11:14",
    unread: true,
    has_action: true,
  },
  {
    id: "m3",
    project_id: "3",
    permit_no: "CLR-2026-0131",
    project_name: "Manalapan Bayfront",
    author: "Cleared",
    role: "Permitting",
    from_cleared: true,
    channel: "general",
    preview:
      "Permit issued by Palm Beach County. Packet attached — recorded permit number PB-2026-04812.",
    at: "Yesterday · 4:22 PM",
    at_iso: "2026-06-06T16:22",
    unread: true,
  },
  {
    id: "m4",
    project_id: "6",
    permit_no: "CLR-2026-0112",
    project_name: "Stuart Riverhouse",
    author: "Cleared",
    role: "Inspections",
    from_cleared: true,
    channel: "inspections",
    preview:
      "Footer inspection scheduled — Friday, June 12 at 9:00 AM. Virtual walkthrough link will be sent 30 minutes prior.",
    at: "Yesterday · 10:01 AM",
    at_iso: "2026-06-06T10:01",
    unread: false,
  },
  {
    id: "m5",
    project_id: "1",
    permit_no: "CLR-2026-0142",
    project_name: "Ocean Ridge Estate",
    author: "Marcus Hale",
    role: "GC · Coastline Builders Group",
    from_cleared: false,
    channel: "corrections",
    preview:
      "Atelier returning revised S-201 tomorrow. Will upload upon receipt.",
    at: "Jun 3 · 8:22 AM",
    at_iso: "2026-06-03T08:22",
    unread: false,
  },
  {
    id: "m6",
    project_id: "4",
    permit_no: "CLR-2026-0127",
    project_name: "Hobe Sound Compound",
    author: "Cleared",
    role: "Plan Review",
    from_cleared: true,
    channel: "plan_review",
    preview:
      "Plan review complete — no corrections. Affidavit of compliance prepared. Awaiting GC sign-off before filing CO request with Martin County.",
    at: "Jun 2 · 1:30 PM",
    at_iso: "2026-06-02T13:30",
    unread: false,
  },
  {
    id: "m7",
    project_id: "7",
    permit_no: "CLR-2026-0104",
    project_name: "Palm Beach Landmark",
    author: "Cleared",
    role: "Permitting",
    from_cleared: true,
    channel: "general",
    preview:
      "Resubmittal package delivered to Palm Beach County. Statutory clock reset — permit or written citation due by June 15.",
    at: "Jun 1 · 9:45 AM",
    at_iso: "2026-06-01T09:45",
    unread: false,
  },
  {
    id: "m8",
    project_id: "5",
    permit_no: "CLR-2026-0119",
    project_name: "Vero Beach Oceanfront",
    author: "Cleared",
    role: "Permitting",
    from_cleared: true,
    channel: "general",
    preview:
      "Affidavit filed with Indian River County. 10 business day clock started — permit or written citation due by May 13.",
    at: "Apr 29 · 3:18 PM",
    at_iso: "2026-04-29T15:18",
    unread: false,
  },
];

const FILTERS: Array<{ key: "all" | "unread" | Channel; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "corrections", label: "Corrections" },
  { key: "plan_review", label: "Plan Review" },
  { key: "inspections", label: "Inspections" },
  { key: "general", label: "General" },
];

function MessagesPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return MESSAGES.filter((m) => {
      if (filter === "unread" && !m.unread) return false;
      if (filter !== "all" && filter !== "unread" && m.channel !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !m.preview.toLowerCase().includes(q) &&
          !m.project_name.toLowerCase().includes(q) &&
          !m.permit_no.toLowerCase().includes(q) &&
          !m.author.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [filter, query]);

  const unreadCount = MESSAGES.filter((m) => m.unread).length;
  const actionCount = MESSAGES.filter((m) => m.has_action).length;

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col gap-6 border-b border-obsidian/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="eyebrow text-obsidian/50">Portfolio · All Channels</div>
            <h1 className="display-serif mt-3 text-5xl text-obsidian">Messages</h1>
            <p className="mt-2 text-sm text-obsidian/60">
              Every thread between your firm and Cleared, across every active permit.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Stat label="Unread" value={unreadCount} tone="sky" />
            <Stat label="Needs response" value={actionCount} tone="warn" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`border px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? "border-obsidian bg-obsidian text-paper"
                      : "border-obsidian/15 bg-white text-obsidian/65 hover:border-obsidian/40 hover:text-obsidian"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-obsidian/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by project, permit no., text…"
              className="block w-full border border-obsidian/15 bg-white pl-9 pr-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="mt-6 border border-obsidian/10 bg-white">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <Inbox className="h-7 w-7 text-obsidian/30" />
              <div className="display-serif mt-4 text-2xl text-obsidian">Inbox clear</div>
              <p className="mt-2 max-w-sm text-sm text-obsidian/55">
                No messages match this filter. Try widening the channel or clearing your search.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-obsidian/5">
              {filtered.map((m) => {
                const ch = channelMeta[m.channel];
                return (
                  <li key={m.id}>
                    <Link
                      to="/projects/$id"
                      params={{ id: m.project_id }}
                      className={`group flex items-start gap-5 px-6 py-5 transition-colors hover:bg-paper-warm/60 ${
                        m.unread ? "bg-paper-warm/30" : ""
                      }`}
                    >
                      {/* Unread dot */}
                      <span
                        aria-hidden
                        className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                          m.unread ? "bg-sky" : "bg-transparent"
                        }`}
                      />

                      {/* Body */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className={`text-sm ${m.unread ? "font-medium text-obsidian" : "text-obsidian/85"}`}>
                            {m.author}
                          </span>
                          {m.from_cleared && (
                            <span className="border border-sky/30 bg-sky/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-sky">
                              Cleared
                            </span>
                          )}
                          <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] ${toneClass[ch.tone]}`}>
                            {ch.label}
                          </span>
                          {m.has_action && (
                            <span className="inline-flex items-center gap-1 border border-oxblood/30 bg-oxblood/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-oxblood">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Action
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                          <span className="text-obsidian/65">{m.project_name}</span>
                          <span>·</span>
                          <span>{m.permit_no}</span>
                          <span>·</span>
                          <span>{m.role}</span>
                        </div>

                        <p className={`mt-3 text-sm leading-relaxed ${m.unread ? "text-obsidian/85" : "text-obsidian/65"}`}>
                          {m.preview}
                        </p>
                      </div>

                      {/* Right column */}
                      <div className="flex shrink-0 flex-col items-end gap-3">
                        <time
                          dateTime={m.at_iso}
                          className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45"
                        >
                          {m.at}
                        </time>
                        <ArrowUpRight className="h-3.5 w-3.5 text-obsidian/30 transition-opacity group-hover:text-sky" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/40">
          <span>
            Showing {filtered.length} of {MESSAGES.length} messages
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-sky/70" />
            All messages encrypted at rest
          </span>
        </div>
      </div>
    </PortalShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div className={`flex items-center gap-2.5 border px-3 py-2 ${toneClass[tone]}`}>
      <MessageSquare className="h-3.5 w-3.5" />
      <div className="leading-tight">
        <div className="font-mono text-xl tabular-nums">{value}</div>
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-80">{label}</div>
      </div>
    </div>
  );
}
