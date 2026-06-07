import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Paperclip,
  Send,
  ArrowUpRight,
  Inbox,
  FileText,
  X,
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

const PROJECT_STATUSES = [
  "submitted",
  "in_review",
  "corrections_required",
  "correction_response_under_review",
  "resubmitted_to_county",
  "approved",
  "inspection_scheduled",
  "inspection_complete",
  "permit_issued",
  "cancelled",
] as const;
type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const STATUS_LABEL: Record<ProjectStatus, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  corrections_required: "Corrections Required",
  correction_response_under_review: "Correction Response Under Review",
  resubmitted_to_county: "Resubmitted to County",
  approved: "Approved",
  inspection_scheduled: "Inspection Scheduled",
  inspection_complete: "Inspection Complete",
  permit_issued: "Permit Issued",
  cancelled: "Cancelled",
};

type Attachment = { name: string; size: string };
type Msg = {
  id: string;
  author: string;
  fromAdmin: boolean;
  body: string;
  at: string;
  attachments?: Attachment[];
};

type Thread = {
  id: string;
  permit_no: string;
  name: string;
  address: string;
  county: string;
  status: ProjectStatus;
  unread: number;
  lastAt: string;
  messages: Msg[];
};

const SEED: Thread[] = [
  {
    id: "1",
    permit_no: "CLR-2026-0142",
    name: "Ocean Ridge Estate",
    address: "1247 Banyan Trail, Ocean Ridge",
    county: "Palm Beach",
    status: "corrections_required",
    unread: 2,
    lastAt: "2:48 PM",
    messages: [
      { id: "a", author: "Maritza Alvarez, P.E.", fromAdmin: true, at: "Jun 5 · 10:12 AM", body: "Plan review opened. Reviewing structural set S-100 through S-401 first." },
      { id: "b", author: "You", fromAdmin: false, at: "Jun 5 · 1:40 PM", body: "Thanks — let us know when corrections are issued." },
      { id: "c", author: "Maritza Alvarez, P.E.", fromAdmin: true, at: "Today · 2:48 PM", body: "Round 1 issued. One structural notation on S-201, plus a missing FL product approval citation on the impact glazing schedule. 48-hour clock running.", attachments: [{ name: "Round1-Corrections.pdf", size: "342 KB" }] },
    ],
  },
  {
    id: "2",
    permit_no: "CLR-2026-0138",
    name: "Jupiter Island Residence",
    address: "88 Beach Rd, Jupiter Island",
    county: "Martin",
    status: "in_review",
    unread: 1,
    lastAt: "11:14 AM",
    messages: [
      { id: "a", author: "Sasha Whitfield", fromAdmin: true, at: "Today · 11:14 AM", body: "Intake complete. Assigned to R. Chen for architectural and J. Pereira for MEP." },
    ],
  },
  {
    id: "3",
    permit_no: "CLR-2026-0131",
    name: "Manalapan Bayfront",
    address: "1812 S Ocean Blvd, Manalapan",
    county: "Palm Beach",
    status: "permit_issued",
    unread: 0,
    lastAt: "Yesterday",
    messages: [
      { id: "a", author: "Sasha Whitfield", fromAdmin: true, at: "Yesterday · 4:22 PM", body: "Permit issued by Palm Beach County. PB-2026-04812. Packet attached.", attachments: [{ name: "Permit-Packet.pdf", size: "1.2 MB" }] },
    ],
  },
  {
    id: "4",
    permit_no: "CLR-2026-0112",
    name: "Stuart Riverhouse",
    address: "320 SW St Lucie Cres, Stuart",
    county: "Martin",
    status: "inspection_scheduled",
    unread: 0,
    lastAt: "Mon",
    messages: [
      { id: "a", author: "Dana Ortiz", fromAdmin: true, at: "Mon · 10:01 AM", body: "Footer inspection scheduled Friday Jun 12 at 9:00 AM. Virtual walkthrough link sent 30 min prior." },
    ],
  },
];

function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>(SEED);
  const [activeId, setActiveId] = useState<string>(SEED[0].id);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, project_id, sender_role, body, created_at, projects(project_name, address, county, status)")
        .order("created_at", { ascending: true });
      if (cancelled || error || !data || data.length === 0) return;
      const byProject = new Map<string, Thread>();
      for (const m of data as Array<Record<string, unknown>>) {
        const pid = String(m.project_id ?? "");
        if (!pid) continue;
        const proj = (m.projects as Record<string, unknown> | null) ?? {};
        if (!byProject.has(pid)) {
          byProject.set(pid, {
            id: pid,
            permit_no: `CLR-${pid.slice(0, 8)}`,
            name: String(proj.project_name ?? "Project"),
            address: String(proj.address ?? ""),
            county: String(proj.county ?? ""),
            status: (String(proj.status ?? "submitted") as ProjectStatus),
            unread: 0,
            lastAt: "",
            messages: [],
          });
        }
        const t = byProject.get(pid)!;
        const isAdmin = String(m.sender_role ?? "") !== "builder";
        t.messages.push({
          id: String(m.id),
          author: isAdmin ? "Cleared" : "You",
          fromAdmin: isAdmin,
          body: String(m.body ?? ""),
          at: m.created_at ? new Date(String(m.created_at)).toLocaleString() : "",
        });
        t.lastAt = t.messages[t.messages.length - 1].at;
      }
      const next = Array.from(byProject.values());
      if (next.length === 0) return;
      setThreads(next);
      setActiveId(next[0].id);
    })();
    return () => { cancelled = true; };
  }, []);


  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return threads;
    return threads.filter((t) =>
      `${t.name} ${t.permit_no} ${t.address}`.toLowerCase().includes(q),
    );
  }, [threads, query]);

  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  function openThread(id: string) {
    setActiveId(id);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
  }

  function sendMessage() {
    if (!draft.trim() && pending.length === 0) return;
    const m: Msg = {
      id: `m${Date.now()}`,
      author: "You",
      fromAdmin: false,
      body: draft.trim(),
      at: "Just now",
      attachments: pending.length ? pending : undefined,
    };
    setThreads((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, messages: [...t.messages, m], lastAt: "Just now" } : t)),
    );
    setDraft("");
    setPending([]);
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    const next: Attachment[] = Array.from(files).map((f) => ({
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
    }));
    setPending((p) => [...p, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function changeStatus(s: ProjectStatus) {
    setThreads((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: s } : t)));
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="border-b border-obsidian/10 pb-6 mb-6">
          <div className="eyebrow text-obsidian/50">Portfolio Messaging</div>
          <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Messages</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0 border border-obsidian/15 bg-white min-h-[600px]">
          {/* LEFT — project list */}
          <aside className="border-b lg:border-b-0 lg:border-r border-obsidian/10 flex flex-col">
            <div className="p-3 border-b border-obsidian/10">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-obsidian/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by address or permit number…"
                  className="block w-full border border-obsidian/15 bg-paper-warm pl-9 pr-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]"
                />
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto max-h-[600px]">
              {filtered.length === 0 ? (
                <li className="p-8 text-center text-obsidian/45 text-sm">
                  <Inbox className="h-5 w-5 mx-auto mb-2 opacity-50" />
                  No projects.
                </li>
              ) : (
                filtered.map((t) => {
                  const last = t.messages[t.messages.length - 1];
                  const isActive = t.id === active.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => openThread(t.id)}
                        className={`block w-full text-left px-4 py-3 border-b border-obsidian/5 transition-colors ${
                          isActive ? "bg-paper-warm" : "hover:bg-paper-warm/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${t.unread ? "font-medium text-obsidian" : "text-obsidian/85"}`}>
                            {t.name}
                          </span>
                          {t.unread > 0 && (
                            <span className="ml-auto inline-flex h-4 min-w-[16px] items-center justify-center bg-sky text-paper font-mono text-[10px] font-medium px-1 rounded-full">
                              {t.unread}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45 truncate">
                          {t.permit_no} · {t.county}
                        </div>
                        <p className="mt-1.5 text-xs text-obsidian/60 line-clamp-2">{last?.body}</p>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/40">
                          {t.lastAt}
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {/* RIGHT — thread */}
          <section className="flex flex-col min-h-[600px]">
            {/* Thread header */}
            <div className="flex flex-wrap items-start justify-between gap-4 p-4 border-b border-obsidian/10 bg-paper-warm/40">
              <div className="min-w-0">
                <div className="display-serif text-2xl text-obsidian">{active.name}</div>
                <div className="mt-1 text-xs text-obsidian/55">{active.address}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                  {active.permit_no} · {active.county} County
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={active.status} onValueChange={(v) => changeStatus(v as ProjectStatus)}>
                  <SelectTrigger className="h-9 w-[230px] rounded-[3px] border-obsidian/15 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button asChild variant="ghost" size="sm" className="rounded-[3px] gap-1">
                  <a href={`/projects/${active.id}`}>
                    Details <ArrowUpRight className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-paper">
              {active.messages.map((m) => (
                <div key={m.id} className={`flex ${m.fromAdmin ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] ${m.fromAdmin ? "" : "items-end"}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/60">
                        {m.author}
                      </span>
                      {m.fromAdmin && (
                        <span className="border border-obsidian/30 bg-obsidian text-paper px-1.5 py-0.5 font-mono text-[8px] font-medium uppercase tracking-[0.12em] rounded-[2px]">
                          Admin
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-obsidian/40">{m.at}</span>
                    </div>
                    <div
                      className="px-4 py-3 text-sm leading-relaxed rounded-[3px]"
                      style={
                        m.fromAdmin
                          ? { backgroundColor: "var(--obsidian)", color: "var(--paper)" }
                          : { backgroundColor: "color-mix(in oklab, var(--sky) 22%, white)", color: "var(--obsidian)" }
                      }
                    >
                      {m.body}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {m.attachments.map((a) => (
                            <div
                              key={a.name}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs"
                              style={{
                                backgroundColor: m.fromAdmin
                                  ? "color-mix(in oklab, var(--paper) 12%, transparent)"
                                  : "color-mix(in oklab, var(--obsidian) 8%, transparent)",
                                borderRadius: "2px",
                              }}
                            >
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="font-mono truncate">{a.name}</span>
                              <span className="font-mono opacity-60 ml-auto">{a.size}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <div className="border-t border-obsidian/10 bg-white p-3">
              {pending.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pending.map((a, i) => (
                    <div
                      key={`${a.name}-${i}`}
                      className="flex items-center gap-2 border border-obsidian/15 bg-paper-warm px-2 py-1 text-xs rounded-[3px]"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="font-mono truncate max-w-[200px]">{a.name}</span>
                      <button
                        type="button"
                        onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                        className="text-obsidian/40 hover:text-oxblood"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  onChange={(e) => onFiles(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-10 w-10 grid place-items-center border border-obsidian/15 bg-paper-warm hover:bg-paper-warm/70 rounded-[3px] text-obsidian/65"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  className="flex-1 resize-none border border-obsidian/15 bg-paper-warm px-3 py-2.5 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px] min-h-[40px] max-h-32"
                />
                <Button
                  type="button"
                  onClick={sendMessage}
                  variant="dark"
                  className="h-10 rounded-[3px] gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Send
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
