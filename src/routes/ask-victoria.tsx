import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Plus, Send, Sparkle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/ask-victoria")({
  head: () => ({
    meta: [
      { title: "Ask Victoria — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AskVictoriaPage,
});

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Thread = { id: string; title: string; updatedAt: number; messages: Msg[] };

const DAILY_LIMIT = 50;
const STORAGE_KEY = "victoria:threads:v1";
const USAGE_KEY = "victoria:usage:v1";

const uid = () => Math.random().toString(36).slice(2, 10);
const todayKey = () => new Date().toISOString().slice(0, 10);

function mockReply(q: string): string {
  const t = q.toLowerCase();

  const COUNTIES_ANSWER =
    "Cleard services **five Florida counties**:\n\n" +
    "• **Broward** — Fort Lauderdale, Hollywood, Pompano Beach, Coral Springs, Davie, Pembroke Pines, Miramar, Hallandale Beach\n" +
    "• **Palm Beach** — West Palm Beach, Boca Raton, Delray Beach, Boynton Beach, Jupiter, Palm Beach Gardens, Wellington, North Palm Beach, Palm Beach, Westlake\n" +
    "• **Martin** — Stuart, Hobe Sound, Jensen Beach, Palm City\n" +
    "• **St. Lucie** — Port St. Lucie, Fort Pierce\n" +
    "• **Indian River** — Vero Beach, Sebastian";

  const FEES_ANSWER =
    "Cleard invoices two line items at submittal:\n\n" +
    "• **Permitting Fee** — construction value × **1.5%**\n" +
    "• **Private Provider & Admin Fee** — flat **$8,856**\n\n" +
    "Using a private provider also entitles the project to up to a **50% reduction** in county permit fees under FS §553.791 and HB 803.";

  const TIMELINES_ANSWER =
    "Statutory timelines on every Cleard project:\n\n" +
    "• **10 business days** — private provider plan review\n" +
    "• **10 business days** — county to issue the permit after affidavit is filed (permit-or-cite under FS §553.791)\n" +
    "• **48 hours** — correction window after a failed inspection\n" +
    "• **2 business days** — county to issue the Certificate of Occupancy after the final certificate of compliance is filed";

  const SERVICES_ANSWER =
    "Cleard provides, under **FS §553.791**:\n\n" +
    "• Private provider **plan review**\n" +
    "• Private provider **inspections** — structural, MEP, gas, and pool\n" +
    "• **Permit submittal and tracking** across all five service counties\n" +
    "• Real-time virtual inspections with a 48-hour correction window";

  const cityMatch = [
    "fort lauderdale","hollywood","pompano","coral springs","davie","pembroke pines","miramar","hallandale",
    "west palm","boca raton","delray","boynton","jupiter","palm beach gardens","wellington","north palm beach","westlake","palm beach",
    "stuart","hobe sound","jensen beach","palm city",
    "port st. lucie","port st lucie","fort pierce","st. lucie","st lucie",
    "vero beach","sebastian","indian river",
    "broward","martin",
  ].some((c) => t.includes(c));

  if (t.includes("county") || t.includes("counties") || t.includes("service area") || t.includes("where") || t.includes("coverage") || t.includes("jurisdiction") || t.includes("location") || t.includes("cities"))
    return COUNTIES_ANSWER;

  if (t.includes("fee") || t.includes("cost") || t.includes("price") || t.includes("pricing") || t.includes("how much") || t.includes("invoice") || t.includes("admin fee") || t.includes("1.5") || t.includes("8856") || t.includes("8,856"))
    return FEES_ANSWER;

  if (t.includes("timeline") || t.includes("how long") || t.includes("turnaround") || t.includes("deadline") || t.includes("days") || t.includes("10 business") || t.includes("review time"))
    return TIMELINES_ANSWER;

  if (t.includes("553.791") || t.includes("private provider") || t.includes("hb 803"))
    return "Under **FS §553.791**, Cleard acts as a licensed private provider performing plan review and inspections in lieu of the local building official. The county must reduce the permit fee accordingly — **up to 50%** when both plan review and inspections are handled privately (HB 803, eff. Jul 1 2026). Statutory clock: **10 business days** for the county to issue the permit after the affidavit of intent is filed, and **2 business days** for the CO after the final certificate of compliance.";

  if (t.includes("inspection"))
    return "Cleard performs **real-time virtual inspections** — structural, MEP, gas, and pool — with a **48-hour correction window**. If an inspection fails, findings are posted to the project record and the trade has 48 hours to remediate before re-inspection.";

  if (t.includes("co") || t.includes("certificate of occupancy") || t.includes("compliance"))
    return "Once the final certificate of compliance is filed by the private provider, the local building official has **2 business days** to issue the Certificate of Occupancy on a residential project (§553.791(11)).";

  if (t.includes("service") || t.includes("what do you do") || t.includes("offer") || t.includes("scope"))
    return SERVICES_ANSWER;

  if (cityMatch)
    return COUNTIES_ANSWER;

  if (t.includes("contact") || t.includes("email") || t.includes("reach") || t.includes("get started") || t.includes("sign up") || t.includes("onboard"))
    return "Cleard is available **exclusively to GC clients of Cleard**. For onboarding or project submittals, reach the team at **permits@floridianinc.com**.";

  if (t.includes("who") && (t.includes("you") || t.includes("cleared") || t.includes("victoria")))
    return "I'm **Victoria**, the AI permitting assistant for **Cleard** — Cleard's private-provider permitting arm under FS §553.791. I can answer questions about our service counties, fees, statutory timelines, and inspection process. Ask me anything about a project in Broward, Palm Beach, Martin, St. Lucie, or Indian River County.";

  return "I can answer questions about **Cleard** — our five service counties (Broward, Palm Beach, Martin, St. Lucie, Indian River), private-provider services under FS §553.791, statutory timelines (10 / 10 / 48hr / 2 business days), and fees (1.5% + $8,856 flat at submittal). What would you like to know?";
}

function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Thread[];
  } catch {
    return [];
  }
}

function loadUsage(): { date: string; count: number } {
  if (typeof window === "undefined") return { date: todayKey(), count: 0 };
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw) as { date: string; count: number };
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

function AskVictoriaPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [usage, setUsage] = useState({ date: todayKey(), count: 0 });
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Bootstrap from localStorage
  useEffect(() => {
    const loaded = loadThreads();
    if (loaded.length === 0) {
      const t: Thread = { id: uid(), title: "New conversation", updatedAt: Date.now(), messages: [] };
      setThreads([t]);
      setActiveId(t.id);
    } else {
      setThreads(loaded);
      setActiveId(loaded[0].id);
    }
    setUsage(loadUsage());
  }, []);

  // Persist
  useEffect(() => {
    if (typeof window === "undefined" || threads.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  const active = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, thinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId]);

  function newChat() {
    const t: Thread = { id: uid(), title: "New conversation", updatedAt: Date.now(), messages: [] };
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
  }

  function deleteThread(id: string) {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const t: Thread = { id: uid(), title: "New conversation", updatedAt: Date.now(), messages: [] };
        setActiveId(t.id);
        return [t];
      }
      if (activeId === id) setActiveId(next[0].id);
      return next;
    });
  }

  function send() {
    const text = input.trim();
    if (!text || !active || thinking) return;
    if (usage.count >= DAILY_LIMIT) return;

    const userMsg: Msg = { id: uid(), role: "user", content: text };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? {
              ...t,
              messages: [...t.messages, userMsg],
              title: t.messages.length === 0 ? text.slice(0, 48) : t.title,
              updatedAt: Date.now(),
            }
          : t,
      ),
    );
    setInput("");
    setUsage((u) => ({ date: todayKey(), count: u.count + 1 }));
    setThinking(true);

    setTimeout(() => {
      const reply: Msg = { id: uid(), role: "assistant", content: mockReply(text) };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, messages: [...t.messages, reply], updatedAt: Date.now() } : t,
        ),
      );
      setThinking(false);
      inputRef.current?.focus();
    }, 650 + Math.random() * 500);
  }

  const limitReached = usage.count >= DAILY_LIMIT;

  return (
    <PortalShell>
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -my-6 md:-my-10 h-[calc(100vh-3.5rem)] flex">
        {/* Left rail */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-obsidian/10 bg-paper-warm/40">
          <div className="p-3 border-b border-obsidian/10">
            <Button onClick={newChat} variant="dark" className="w-full rounded-[3px] gap-2 justify-start">
              <Plus className="h-4 w-4" /> New chat
            </Button>
          </div>
          <div className="px-3 pt-4 pb-2 eyebrow text-obsidian/45">History</div>
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
            {threads.length === 0 && (
              <div className="px-3 py-2 text-xs text-obsidian/45">No conversations yet.</div>
            )}
            {threads.map((t) => {
              const isActive = t.id === activeId;
              return (
                <div
                  key={t.id}
                  className="group relative flex items-center"
                  style={{
                    backgroundColor: isActive ? "color-mix(in oklab, var(--sky) 10%, transparent)" : "transparent",
                    borderRadius: "3px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    className="flex-1 min-w-0 text-left px-3 py-2 text-[13px] text-obsidian truncate hover:text-obsidian"
                  >
                    {t.title}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 text-obsidian/40 hover:text-oxblood transition-opacity"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Chat */}
        <section className="flex-1 min-w-0 flex flex-col">
          <header className="px-4 sm:px-8 py-5 border-b border-obsidian/10 flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow text-obsidian/50">AI Permitting Assistant</div>
              <h1 className="display-serif text-3xl text-obsidian mt-1">Ask Victoria</h1>
            </div>
            <div className="font-mono text-[11px] tabular-nums uppercase tracking-[0.14em] text-obsidian/55 border border-obsidian/15 px-2.5 py-1 rounded-[3px]">
              {usage.count}/{DAILY_LIMIT} today
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
            {active && active.messages.length === 0 ? (
              <div className="mx-auto max-w-xl text-center pt-16">
                <div
                  className="mx-auto h-16 w-16 grid place-items-center rounded-full mb-5"
                  style={{
                    backgroundColor: "var(--obsidian)",
                    color: "var(--paper)",
                  }}
                >
                  <Sparkle className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <h2 className="display-serif text-3xl text-obsidian">Hi, I am <em>Victoria</em>.</h2>
                <p className="mt-3 text-sm text-obsidian/65 leading-relaxed">
                  Ask me anything about permitting, Florida statutes, or county requirements.
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/40">
                  50 questions per day
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {active?.messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <div
                        className="max-w-[80%] px-4 py-2.5 text-sm rounded-[3px]"
                        style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
                      >
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-3">
                      <div
                        className="h-8 w-8 shrink-0 grid place-items-center rounded-full"
                        style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
                      >
                        <Sparkle className="h-4 w-4" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 text-sm text-obsidian leading-relaxed whitespace-pre-wrap">
                        {renderInline(m.content)}
                      </div>
                    </div>
                  ),
                )}
                {thinking && (
                  <div className="flex gap-3">
                    <div
                      className="h-8 w-8 shrink-0 grid place-items-center rounded-full"
                      style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
                    >
                      <Sparkle className="h-4 w-4 animate-pulse" strokeWidth={1.5} />
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian/45 self-center">
                      Victoria is thinking…
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-obsidian/10 px-4 sm:px-8 py-4 bg-paper-warm/30">
            <div className="mx-auto max-w-3xl">
              {limitReached && (
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-oxblood">
                  Daily limit reached — resets at midnight.
                </div>
              )}
              <div className="flex items-end gap-2 border border-obsidian/15 bg-white rounded-[3px] focus-within:border-obsidian/40 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  disabled={limitReached || thinking}
                  placeholder="Ask about FS 553.791, county fees, inspection windows…"
                  className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-obsidian placeholder:text-obsidian/40 focus:outline-none max-h-40"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!input.trim() || thinking || limitReached}
                  className="m-1.5 h-9 w-9 grid place-items-center rounded-[3px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}

// Lightweight **bold** renderer — keeps editorial polish without a markdown dep.
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-obsidian">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
