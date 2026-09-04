// Victoria · Permit Intelligence — collapsible advisory panel
// Not a chatbot. A proactive feed that reacts to what the GC types.
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Info, AlertTriangle, CheckCircle2, Gauge, Building2, Sparkles, Receipt } from "lucide-react";
import {
  evaluateScopeFlags,
  getCommonCorrections,
  getMunicipalityStats,
  getRecentCorrectionsFor,
  slugifyMunicipality,
  type CorrectionRow,
  type MunicipalityStats,
  type ScopeFlag,
} from "@/lib/intelligence";
import { MUNICIPALITIES } from "@/lib/municipalities";

export type VictoriaPanelProps = {
  mode?: "permit" | "hoa";
  municipality: string;
  trades: string[];
  docsProvided: number;
  docsRequired: number;
  className?: string;
};

type Severity = "good" | "watch" | "critical" | "info";

const sevStyles: Record<Severity, { dot: string; bg: string; text: string; ring: string }> = {
  good: { dot: "bg-emerald-600", bg: "bg-emerald-50", text: "text-emerald-800", ring: "ring-emerald-200" },
  watch: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-900", ring: "ring-amber-200" },
  critical: { dot: "bg-red-600", bg: "bg-red-50", text: "text-red-900", ring: "ring-red-200" },
  info: { dot: "bg-obsidian/60", bg: "bg-obsidian/5", text: "text-obsidian", ring: "ring-obsidian/15" },
};

function severityFromScope(f: ScopeFlag): Severity {
  return f.severity === "info" ? "info" : f.severity === "watch" ? "watch" : "critical";
}

function fmtMoney(cents: number | null | undefined) {
  if (!cents) return "—";
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function VictoriaIntelligencePanel({
  mode = "permit",
  municipality,
  trades,
  docsProvided,
  docsRequired,
  className,
}: VictoriaPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState<MunicipalityStats | null>(null);
  const [common, setCommon] = useState<CorrectionRow[]>([]);
  const [priorWarnings, setPriorWarnings] = useState<CorrectionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const muniMeta = useMemo(
    () => MUNICIPALITIES.find((m) => m.name.toLowerCase() === (municipality || "").toLowerCase()) ?? null,
    [municipality],
  );
  const slug = useMemo(() => slugifyMunicipality(municipality) ?? "", [municipality]);
  const scopeFlags = useMemo(
    () => evaluateScopeFlags(trades, muniMeta ? { name: muniMeta.name, county: muniMeta.county } : null),
    [trades, muniMeta],
  );

  useEffect(() => {
    if (!slug) {
      setStats(null);
      setCommon([]);
      setPriorWarnings([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getMunicipalityStats(slug),
      getCommonCorrections(slug, trades[0] ?? null, 4),
      getRecentCorrectionsFor(slug, trades, 3),
    ])
      .then(([s, c, r]) => {
        if (cancelled) return;
        setStats(s);
        setCommon(c);
        setPriorWarnings(r);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, trades.join("|")]);

  const readiness = docsRequired > 0 ? Math.round((docsProvided / docsRequired) * 100) : 0;
  const readinessSev: Severity = readiness >= 90 ? "good" : readiness >= 60 ? "watch" : "critical";
  const notificationCount =
    scopeFlags.filter((f) => f.severity !== "info").length +
    priorWarnings.length +
    (readiness < 90 ? 1 : 0);

  const feeLow = stats?.avg_permit_fee_cents ? Math.round(stats.avg_permit_fee_cents * 0.85) : null;
  const feeHigh = stats?.avg_permit_fee_cents ? Math.round(stats.avg_permit_fee_cents * 1.15) : null;

  // Collapsed slim bar
  if (collapsed) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center justify-between gap-3 border border-obsidian/15 bg-white rounded-[3px] px-4 py-3 hover:border-obsidian/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-obsidian" strokeWidth={1.5} />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian">
              Victoria · Permit Intelligence
            </span>
          </div>
          <div className="flex items-center gap-2">
            {notificationCount > 0 && (
              <span className="rounded-full bg-obsidian text-paper font-mono text-[10px] px-2 py-0.5 leading-none">
                {notificationCount}
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-obsidian/60" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <aside
      className={
        (className ?? "") +
        " border border-obsidian/12 bg-white rounded-[3px] overflow-hidden"
      }
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-obsidian/10 bg-obsidian text-paper">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/60">
              {mode === "hoa" ? "HOA Submittal" : "Permit Intelligence"}
            </div>
            <div className="display-serif text-base leading-none mt-0.5">Victoria</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="text-paper/70 hover:text-paper font-mono text-[10px] uppercase tracking-[0.18em]"
        >
          Minimize
        </button>
      </header>

      <div className="divide-y divide-obsidian/10">
        {/* Municipality Intel */}
        <Section icon={<Building2 className="h-3.5 w-3.5" />} title="Municipality Intel">
          {!municipality ? (
            <Empty>Select a municipality to see historical data.</Empty>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-obsidian/70">
                {muniMeta ? `${muniMeta.name}${muniMeta.county ? ` · ${muniMeta.county} County` : ""}` : municipality}
              </div>
              {stats && stats.sample_size > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Avg fee" value={fmtMoney(stats.avg_permit_fee_cents)} />
                  <Stat label="Avg approval" value={stats.avg_days_to_resolution ? `${stats.avg_days_to_resolution}d` : "—"} />
                  <Stat label="First response" value={stats.avg_days_to_response ? `${stats.avg_days_to_response}d` : "—"} />
                  <Stat label="Approval rate" value={stats.approval_rate != null ? `${Math.round(stats.approval_rate * 100)}%` : "—"} />
                </div>
              ) : (
                <Empty>{loading ? "Loading…" : `No historical data yet for ${municipality}.`}</Empty>
              )}
              {common.length > 0 && (
                <div className="mt-2">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-obsidian/55 mb-1">
                    Most common correction
                  </div>
                  <Bullet sev="watch">{common[0].correction_text}</Bullet>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Scope Flags */}
        <Section icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Scope Flags">
          {trades.length === 0 ? (
            <Empty>Add scopes/trades to see targeted advisories.</Empty>
          ) : scopeFlags.length === 0 ? (
            <Bullet sev="good">No scope-specific flags for this combination.</Bullet>
          ) : (
            <ul className="space-y-2">
              {scopeFlags.map((f, i) => (
                <li key={i}>
                  <Bullet sev={severityFromScope(f)}>{f.message}</Bullet>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Prior Submittal Warnings */}
        <Section icon={<Info className="h-3.5 w-3.5" />} title="Prior Warnings">
          {!slug ? (
            <Empty>Select a municipality first.</Empty>
          ) : priorWarnings.length === 0 ? (
            <Bullet sev="good">No recent flags in this city for these trades.</Bullet>
          ) : (
            <ul className="space-y-2">
              {priorWarnings.map((c) => (
                <li key={c.id}>
                  <Bullet sev="watch">
                    <span className="block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/55 mb-0.5">
                      {c.trade ?? "General"} · {new Date(c.last_seen_at).toLocaleDateString()}
                    </span>
                    {c.correction_text}
                  </Bullet>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Readiness */}
        <Section icon={<Gauge className="h-3.5 w-3.5" />} title="Readiness Score">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="display-serif text-2xl text-obsidian">{readiness}%</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                {docsProvided} / {docsRequired} docs
              </span>
            </div>
            <div className="h-1.5 w-full bg-obsidian/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${sevStyles[readinessSev].dot} transition-all`}
                style={{ width: `${Math.min(100, readiness)}%` }}
              />
            </div>
            {readiness < 100 && (
              <p className="text-[11px] text-obsidian/60">
                {readiness < 60
                  ? "Not ready — key documents still missing."
                  : readiness < 90
                    ? "Almost there — a few docs still outstanding."
                    : "Nearly ready to submit."}
              </p>
            )}
          </div>
        </Section>

        {/* Fee Estimate */}
        {mode === "permit" && (
          <Section icon={<Receipt className="h-3.5 w-3.5" />} title="Fee Estimate">
            {!stats || !stats.avg_permit_fee_cents ? (
              <Empty>No fee data yet for this municipality.</Empty>
            ) : (
              <div className="space-y-1">
                <div className="display-serif text-xl text-obsidian">
                  {fmtMoney(feeLow)} – {fmtMoney(feeHigh)}
                </div>
                <p className="text-[11px] text-obsidian/60">
                  Based on {stats.sample_size} similar permit{stats.sample_size === 1 ? "" : "s"} in {muniMeta?.name ?? municipality}.
                </p>
              </div>
            )}
          </Section>
        )}
      </div>
    </aside>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2 text-obsidian/70">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-[0.22em]">{title}</span>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-obsidian/10 rounded-[3px] px-2 py-1.5 bg-paper">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-obsidian/50">{label}</div>
      <div className="text-sm text-obsidian mt-0.5">{value}</div>
    </div>
  );
}

function Bullet({ sev, children }: { sev: Severity; children: React.ReactNode }) {
  const s = sevStyles[sev];
  const Icon = sev === "good" ? CheckCircle2 : sev === "info" ? Info : AlertTriangle;
  return (
    <div className={`flex items-start gap-2 border ${s.ring} ${s.bg} rounded-[3px] px-2.5 py-2`}>
      <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${s.dot} shrink-0`} />
      <div className={`text-xs leading-snug ${s.text} flex-1`}>{children}</div>
      <Icon className={`h-3.5 w-3.5 ${s.text} shrink-0 mt-0.5`} strokeWidth={1.75} />
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-obsidian/50 ">{children}</div>;
}
