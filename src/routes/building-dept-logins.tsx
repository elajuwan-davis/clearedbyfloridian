import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import {
  ChevronDown, Copy, Eye, EyeOff, FileText, Plus, Search, Check, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/building-dept-logins")({
  head: () => ({
    meta: [
      { title: "Building Dept Logins — Cleard by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuildingDeptLoginsPage,
});

type DocLink = { label: string; expires: string }; // ISO date or "—"
type Login = {
  id: string;
  municipality: string;
  county: string;
  status: "active" | "needs_updated";
  portalUrl: string;
  registration: string;
  username: string;
  password: string;
  ePlan: boolean;
  derm: boolean;
  docs: DocLink[];
};

const LOGINS: Login[] = [
  {
    id: "pb-county", municipality: "Palm Beach County", county: "Palm Beach", status: "active",
    portalUrl: "https://epzb.pbcgov.org", registration: "Contractor Registration #CRC-0294831",
    username: "coastline.builders", password: "PBcz!2026-Trade$",
    ePlan: true, derm: false,
    docs: [
      { label: "COI — Certificate of Insurance", expires: "2027-03-12" },
      { label: "WC — Workers Compensation", expires: "2026-11-30" },
      { label: "Occupational License", expires: "2026-09-01" },
      { label: "BTR — Business Tax Receipt", expires: "2026-09-30" },
      { label: "Qualifier Driver's License", expires: "2028-04-22" },
    ],
  },
  {
    id: "palm-beach-town", municipality: "Town of Palm Beach", county: "Palm Beach", status: "active",
    portalUrl: "https://townofpalmbeach.com/permitting", registration: "Local Reg #TPB-2024-1187",
    username: "j.mendez@coastlinebuilders.com", password: "OceanBlvd!88Manalapan",
    ePlan: true, derm: false,
    docs: [
      { label: "COI — Certificate of Insurance", expires: "2027-03-12" },
      { label: "WC — Workers Compensation", expires: "2026-11-30" },
      { label: "Local BTR", expires: "2026-09-30" },
    ],
  },
  {
    id: "manalapan", municipality: "Town of Manalapan", county: "Palm Beach", status: "needs_updated",
    portalUrl: "https://manalapan.org/permits", registration: "Local Reg #MAN-2025-0341",
    username: "coastline.gc", password: "T3mp!Manalapan",
    ePlan: false, derm: false,
    docs: [
      { label: "COI — Certificate of Insurance", expires: "2026-04-01" }, // expired vs Jun 2026
      { label: "Local BTR", expires: "2026-09-30" },
    ],
  },
  {
    id: "martin-county", municipality: "Martin County", county: "Martin", status: "active",
    portalUrl: "https://www.martin.fl.us/building", registration: "County Reg #MC-CG-19044",
    username: "coastline.builders", password: "Stuart!River2026",
    ePlan: true, derm: false,
    docs: [
      { label: "COI — Certificate of Insurance", expires: "2027-03-12" },
      { label: "WC — Workers Compensation", expires: "2026-11-30" },
      { label: "BTR — Business Tax Receipt", expires: "2026-09-30" },
      { label: "Qualifier Driver's License", expires: "2028-04-22" },
    ],
  },
  {
    id: "indian-river-county", municipality: "Indian River County", county: "Indian River", status: "active",
    portalUrl: "https://www.ircgov.com/building", registration: "County Reg #IRC-GC-4421",
    username: "coastline.gc", password: "VeroOceanDr!26",
    ePlan: true, derm: false,
    docs: [
      { label: "COI — Certificate of Insurance", expires: "2027-03-12" },
      { label: "Local BTR", expires: "2026-12-31" },
    ],
  },
  {
    id: "st-lucie", municipality: "St. Lucie County", county: "St. Lucie", status: "needs_updated",
    portalUrl: "https://www.stlucieco.gov/building", registration: "County Reg #SLC-GC-7782",
    username: "coastline.builders", password: "PortStLucie!2026",
    ePlan: true, derm: false,
    docs: [
      { label: "Occupational License", expires: "2026-05-15" }, // expired
      { label: "WC — Workers Compensation", expires: "2026-11-30" },
    ],
  },
];

const TODAY = new Date("2026-06-07");

function fmtDate(iso: string) {
  if (!iso || iso === "—") return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function isExpired(iso: string) {
  if (!iso || iso === "—") return false;
  return new Date(iso).getTime() < TODAY.getTime();
}

function BuildingDeptLoginsPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(LOGINS[0].id);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return LOGINS;
    return LOGINS.filter((l) =>
      `${l.municipality} ${l.county} ${l.registration}`.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <PortalShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-8">
          <div>
            <div className="eyebrow text-obsidian/50">Credentials Vault</div>
            <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Building Dept Logins</h1>
            <p className="mt-2 text-sm text-obsidian/60">
              Encrypted portal credentials, contractor registrations, and document expirations.
            </p>
          </div>
          <Button asChild variant="dark" className="rounded-[3px] gap-2">
            <Link to="/building-dept-logins/submit">
              <Plus className="h-4 w-4" /> Submit New Login
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mt-6 relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-obsidian/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search municipalities…"
            className="block w-full border border-obsidian/15 bg-white pl-9 pr-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]"
          />
        </div>

        {/* Accordion list */}
        <div className="mt-8 border border-obsidian/15 bg-white">
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-obsidian/50">No municipalities match.</div>
          )}
          {filtered.map((l) => {
            const isOpen = open === l.id;
            const expiredCount = l.docs.filter((d) => isExpired(d.expires)).length;
            return (
              <div key={l.id} className="border-b border-obsidian/10 last:border-0">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : l.id)}
                  className="w-full flex flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-paper-warm/50 transition-colors"
                >
                  <ChevronDown className={`h-4 w-4 text-obsidian/40 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-obsidian truncate">{l.municipality}</div>
                    <div className="text-xs text-obsidian/55 truncate">{l.county} County</div>
                  </div>
                  {expiredCount > 0 && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-oxblood border border-oxblood/30 bg-oxblood/10 px-2 py-0.5 rounded-[2px]">
                      {expiredCount} expired
                    </span>
                  )}
                  <StatusBadge status={l.status} />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-12 pb-6 pt-1 space-y-6">
                    {/* Portal + registration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <Field label="Portal">
                        <a
                          href={l.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-sky hover:opacity-70"
                        >
                          {l.portalUrl.replace(/^https?:\/\//, "")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Field>
                      <Field label="Registration">
                        <div className="text-sm text-obsidian">{l.registration}</div>
                      </Field>

                      <Field label="Username">
                        <CopyValue value={l.username} mono />
                      </Field>
                      <Field label="Password">
                        <PasswordValue value={l.password} />
                      </Field>

                      <Field label="Portal Features">
                        <div className="flex gap-2">
                          <FeatureTag on={l.ePlan} label="ePlan" />
                          <FeatureTag on={l.derm} label="DERM" />
                        </div>
                      </Field>
                    </div>

                    {/* Documents */}
                    <div>
                      <div className="eyebrow text-obsidian/55 mb-3">Documents on file</div>
                      <ul className="border border-obsidian/10 divide-y divide-obsidian/5">
                        {l.docs.map((d) => {
                          const expired = isExpired(d.expires);
                          return (
                            <li key={d.label} className="flex items-center gap-3 px-4 py-3">
                              <FileText className="h-4 w-4 text-obsidian/40 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-obsidian truncate">{d.label}</div>
                              </div>
                              <div
                                className="font-mono text-[11px] tabular-nums"
                                style={{ color: expired ? "var(--accent)" : "var(--obsidian)" }}
                              >
                                {expired ? "Expired " : "Exp. "}{fmtDate(d.expires)}
                              </div>
                              <button
                                type="button"
                                className="font-mono text-[10px] uppercase tracking-[0.12em] text-sky hover:opacity-70"
                              >
                                View
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PortalShell>
  );
}

function StatusBadge({ status }: { status: Login["status"] }) {
  const cls =
    status === "active"
      ? "bg-emerald-600/10 text-emerald-700 border-emerald-600/30"
      : "bg-amber-500/10 text-amber-700 border-amber-600/30";
  const label = status === "active" ? "Active" : "Needs Updated";
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] rounded-[2px] ${cls}`}>
      {label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow text-obsidian/45 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* */ }
      }}
      className="p-1.5 text-obsidian/40 hover:text-obsidian transition-colors"
      aria-label="Copy"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CopyValue({ value, mono }: { value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-1 border border-obsidian/10 bg-paper-warm/50 px-3 py-1.5 rounded-[3px]">
      <span className={`flex-1 min-w-0 truncate text-sm text-obsidian ${mono ? "font-mono tabular-nums" : ""}`}>{value}</span>
      <CopyButton value={value} />
    </div>
  );
}

function PasswordValue({ value }: { value: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex items-center gap-1 border border-obsidian/10 bg-paper-warm/50 px-3 py-1.5 rounded-[3px]">
      <span className="flex-1 min-w-0 truncate text-sm text-obsidian font-mono tabular-nums">
        {shown ? value : "•".repeat(Math.min(value.length, 14))}
      </span>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="p-1.5 text-obsidian/40 hover:text-obsidian transition-colors"
        aria-label={shown ? "Hide" : "Show"}
      >
        {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <CopyButton value={value} />
    </div>
  );
}

function FeatureTag({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 border rounded-[2px]"
      style={
        on
          ? { color: "var(--sky)", borderColor: "color-mix(in oklab, var(--sky) 35%, transparent)", backgroundColor: "color-mix(in oklab, var(--sky) 8%, transparent)" }
          : { color: "color-mix(in oklab, var(--obsidian) 45%, transparent)", borderColor: "color-mix(in oklab, var(--obsidian) 15%, transparent)" }
      }
    >
      {on && <Check className="h-3 w-3" />}
      {label}
    </span>
  );
}
