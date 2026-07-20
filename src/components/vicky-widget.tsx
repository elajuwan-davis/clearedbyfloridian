import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { PROJECTS } from "@/lib/projects-data";
import { loadInspections, buildInspections, type Inspection } from "@/lib/inspections";
import { loadSubLibrary, coiLifecycleStatus, type SubRecord } from "@/lib/subcontractor-library";

type Msg = { role: "user" | "vicky"; text: string };

// Phase 1 — canned + light live queries against seeded data.
// Note for Eman: swap `answer()` with a Claude API call passing project context.
// Recommended: claude-sonnet-4-6 (or claude-haiku-4-5-20251001 for speed).
// Requires ANTHROPIC_API_KEY in Supabase env vars + server function proxy.

function findProject(query: string) {
  const q = query.toLowerCase();
  return PROJECTS.find((p) => p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q));
}

function answer(input: string): string {
  const q = input.toLowerCase().trim();

  // Pending inspections on a project
  if (q.includes("inspection") && (q.includes("pending") || q.includes("still") || q.includes("next"))) {
    for (const p of PROJECTS) {
      if (q.includes(p.client.toLowerCase().split(" ")[0]) || q.includes(p.name.toLowerCase().split(" ")[0])) {
        let insp: Inspection[] = [];
        try { insp = loadInspections(p.id, buildInspections(false)); } catch { /* ignore */ }
        const pending = insp.filter((i) => i.status === "pending" || i.status === "scheduled");
        if (q.includes("next")) {
          const next = pending[0];
          return next
            ? `Next inspection on ${p.name}: ${next.code} — ${next.name} (${next.status}).`
            : `${p.name} has no pending inspections.`;
        }
        return pending.length
          ? `${p.name} has ${pending.length} pending inspections: ${pending.map((i) => i.code).join(", ")}.`
          : `${p.name} has no pending inspections — all 9 complete.`;
      }
    }
  }

  // Expired COIs
  if (q.includes("coi") && (q.includes("expired") || q.includes("expiring"))) {
    try {
      const subs: SubRecord[] = loadSubLibrary();
      const flagged = subs.filter((s) => {
        const status = coiLifecycleStatus(s);
        return status === "expired" || status === "expiring_soon";
      });
      return flagged.length
        ? `${flagged.length} subs with COI issues: ${flagged.slice(0, 5).map((s) => s.companyName).join(", ")}.`
        : "All subcontractor COIs are current.";
    } catch {
      return "COI tracking data is not available right now.";
    }
  }

  // Missing documents on a project
  if (q.includes("document") && q.includes("missing")) {
    const p = PROJECTS.find((x) => q.includes(x.client.toLowerCase().split(" ")[0]));
    if (p) {
      return `Standard document check for ${p.name}: NTBO, Owner Authorization, Stamped Plans, Site Survey, Product Approvals, Truss Packet, Energy Calcs. Head to the project's Documents tab for live status.`;
    }
  }

  // Permits in issued status
  if (q.includes("permit") && q.includes("issued")) {
    const issued = PROJECTS.filter((p) => p.status === "permit_issued");
    return `${issued.length} permits are currently in Issued status.`;
  }

  // Projects on hold
  if (q.includes("hold")) {
    const held = PROJECTS.filter((p) => p.status === "on_hold");
    return held.length
      ? `${held.length} projects on hold: ${held.map((p) => p.name).join(", ")}.`
      : "No projects are currently on hold.";
  }

  // Fallback — try project lookup
  const p = findProject(q);
  if (p) {
    return `${p.name} (${p.permit_no}) — ${p.status} · ${p.address}, ${p.city}, ${p.county} County.`;
  }

  return "I can answer questions about pending inspections, expired COIs, missing documents, permit statuses, and project details. Try asking about a specific project by name.";
}

export function VickyWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "vicky", text: "Hi, I'm Vicky. Ask me about pending inspections, COIs, permits, or a specific project." },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const suggestions = useMemo(
    () => [
      "What projects are on hold?",
      "How many permits are Issued?",
      "Which projects have expired COIs?",
    ],
    []
  );

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "user", text: t }, { role: "vicky", text: answer(t) }]);
    setInput("");
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Vicky assistant"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition"
          style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
        >
          <span className="display-serif text-2xl">V</span>
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] rounded-[6px] shadow-2xl flex flex-col border hairline"
          style={{ backgroundColor: "var(--paper)" }}
        >
          <header
            className="flex items-center justify-between px-4 py-3 rounded-t-[6px]"
            style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center border"
                style={{ borderColor: "color-mix(in oklab, var(--paper) 40%, transparent)" }}
              >
                <span className="display-serif text-lg">V</span>
              </div>
              <div>
                <div className="text-sm font-medium">Vicky</div>
                <div className="text-[10px] uppercase tracking-[0.15em] opacity-70">Flōridian AI</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="opacity-80 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className="max-w-[85%] px-3 py-2 text-sm rounded-[6px]"
                  style={
                    m.role === "user"
                      ? { backgroundColor: "var(--obsidian)", color: "var(--paper)" }
                      : { backgroundColor: "color-mix(in oklab, var(--obsidian) 5%, transparent)" }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2 py-1 border hairline rounded-[3px] hover:bg-muted/40"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t hairline flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Vicky..."
              className="flex-1 h-10 px-3 text-sm border hairline rounded-[3px] bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--obsidian)]"
            />
            <button
              type="submit"
              aria-label="Send"
              className="h-10 w-10 rounded-[3px] flex items-center justify-center"
              style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// Hide from icon-only import warnings
export { MessageCircle as VickyIcon };
