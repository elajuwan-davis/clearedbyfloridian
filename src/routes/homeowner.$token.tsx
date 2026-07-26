import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { projectStatusMeta, toneClass, type ProjectStatus } from "@/lib/status-badges";

export const Route = createFileRoute("/homeowner/$token")({
  head: () => ({
    meta: [
      { title: "Permit Status — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HomeownerStatusPage,
});

type PublicPermit = {
  id: string;
  project_name: string;
  job_address: string | null;
  city: string | null;
  permit_type: string | null;
  status: string;
  submitted_date: string | null;
  issued_date: string | null;
  expiration_date: string | null;
  municipality: string | null;
};

const TIMELINE: { key: string; label: string }[] = [
  { key: "pre_check", label: "Pre-Check" },
  { key: "cleared_for_takeoff", label: "Cleared for Takeoff" },
  { key: "en_route", label: "En Route" },
  { key: "arrival", label: "Arrival" },
];

function bucketFor(status: string): string {
  if (["submitted", "in_review", "outsourced_permitting"].includes(status)) return "cleared_for_takeoff";
  if (["permit_issued"].includes(status)) return "en_route";
  if (["approved"].includes(status)) return "arrival";
  if (["corrections_required", "on_hold"].includes(status)) return "cleared_for_takeoff";
  return "pre_check";
}

function HomeownerStatusPage() {
  const { token } = Route.useParams();
  const [permit, setPermit] = useState<PublicPermit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("permits")
        .select("id, project_name, job_address, city, permit_type, status, submitted_date, issued_date, expiration_date, municipality")
        .eq("homeowner_share_token", token)
        .maybeSingle();
      if (error || !data) { setLoading(false); return; }
      setPermit(data as PublicPermit);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-obsidian/50">Loading…</div>;
  if (!permit) throw notFound();

  const bucket = bucketFor(permit.status);
  const bucketIdx = TIMELINE.findIndex((t) => t.key === bucket);
  const isDelayed = permit.status === "corrections_required" || permit.status === "on_hold";
  const meta = projectStatusMeta[permit.status as ProjectStatus] ?? { label: permit.status, tone: "neutral" as const };
  const badgeClass = toneClass[meta.tone];

  const victoriaSummary = summarize(permit);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-obsidian/10 py-6">
        <div className="max-w-3xl mx-auto px-6">
          <div className="wordmark text-2xl">Cleard</div>
          <div className="wordmark-subline text-[10px] mt-1">Permit Status</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <section>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50">Project</div>
          <h1 className="display-serif text-3xl md:text-4xl text-obsidian mt-1">{permit.project_name}</h1>
          <div className="text-sm text-obsidian/70 mt-2">
            {permit.job_address}{permit.city ? `, ${permit.city}` : ""}
          </div>
          <div className="text-xs text-obsidian/60 mt-1">Permit Type: {permit.permit_type ?? "—"}</div>
        </section>

        <section>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50 mb-4">Current Status</div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-[3px] text-xs font-medium ${badgeClass}`}>
            {isDelayed ? "Delayed" : meta.label}
          </div>
        </section>

        <section>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50 mb-4">Timeline</div>
          <ol className="flex items-center gap-2">
            {TIMELINE.map((t, i) => {
              const active = i <= bucketIdx;
              return (
                <li key={t.key} className="flex items-center gap-2 flex-1">
                  <div className={`w-3 h-3 rounded-full ${active ? "bg-obsidian" : "bg-obsidian/20"}`} />
                  <div className={`text-xs ${active ? "text-obsidian" : "text-obsidian/40"}`}>{t.label}</div>
                  {i < TIMELINE.length - 1 && <div className={`flex-1 h-px ${i < bucketIdx ? "bg-obsidian" : "bg-obsidian/15"}`} />}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="bg-obsidian/5 border border-obsidian/10 rounded-[3px] p-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-2">Victoria — Status Summary</div>
          <p className="text-sm text-obsidian leading-relaxed">{victoriaSummary}</p>
        </section>

        <footer className="pt-8 border-t border-obsidian/10 text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/40">
          Managed by Cleard · Read-only view · No login required
        </footer>
      </main>
    </div>
  );
}

function summarize(p: PublicPermit): string {
  const muni = p.municipality || p.city || "the municipality";
  if (p.status === "corrections_required") return `Your permit is currently delayed pending corrections requested by ${muni}. Cleard is working to resubmit.`;
  if (p.status === "permit_issued") return `Your permit has been issued by ${muni} and construction is en route.`;
  if (p.status === "approved") return `Your permit has been approved and the Certificate of Occupancy has been issued.`;
  if (p.status === "submitted" || p.status === "in_review") {
    const sub = p.submitted_date ? `submitted to ${muni} on ${p.submitted_date}` : `queued for submission to ${muni}`;
    return `Your permit was ${sub}. Estimated review: 3–4 weeks.`;
  }
  return `Your project is in pre-check. Cleard is preparing the submittal package for ${muni}.`;
}
