import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { isInternalUser } from "@/lib/is-internal-user";
import {
  listGcCompanyProfiles,
  complianceFlags,
  type GcCompanyProfile,
} from "@/lib/gc-company";
import { ShieldAlert, ShieldCheck, AlertTriangle, Lock } from "lucide-react";

export const Route = createFileRoute("/admin/gc-compliance")({
  head: () => ({
    meta: [
      { title: "GC Compliance — Admin — Cleard" },
      {
        name: "description",
        content: "Staff dashboard tracking GC license and insurance compliance status.",
      },
      { property: "og:title", content: "GC Compliance — Admin — Cleard" },
      { property: "og:description", content: "License and insurance compliance across GC clients." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GcComplianceAdmin,
});

type Tab = "expiring" | "expired" | "clear" | "all";

function statusOf(profile: GcCompanyProfile): "expired" | "expiring" | "clear" {
  const flags = complianceFlags(profile);
  if (flags.some((f) => f.level === "blocked")) return "expired";
  if (flags.some((f) => f.level === "warn")) return "expiring";
  return "clear";
}

function StatusBadge({ status }: { status: "expired" | "expiring" | "clear" }) {
  if (status === "expired")
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[3px] bg-red-100 text-red-700">
        <ShieldAlert className="h-3 w-3" /> Expired
      </span>
    );
  if (status === "expiring")
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[3px] bg-amber-100 text-amber-800">
        <AlertTriangle className="h-3 w-3" /> Expiring Soon
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[3px] bg-emerald-100 text-emerald-700">
      <ShieldCheck className="h-3 w-3" /> All Clear
    </span>
  );
}

function GcComplianceAdmin() {
  const [allowed, setAllowed] = useState(false);
  const [profiles, setProfiles] = useState<GcCompanyProfile[]>([]);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    setAllowed(isInternalUser());
    setProfiles(listGcCompanyProfiles());
    const refresh = () => setProfiles(listGcCompanyProfiles());
    window.addEventListener("gc-company:changed", refresh);
    return () => window.removeEventListener("gc-company:changed", refresh);
  }, []);

  const rows = useMemo(() => {
    return profiles
      .map((p) => ({ profile: p, status: statusOf(p), flags: complianceFlags(p) }))
      .filter((r) => {
        if (tab === "all") return true;
        if (tab === "expired") return r.status === "expired";
        if (tab === "expiring") return r.status === "expiring";
        return r.status === "clear";
      });
  }, [profiles, tab]);

  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Lock className="h-8 w-8 mx-auto text-obsidian/40 mb-4" />
        <h1 className="display-serif text-2xl text-obsidian mb-2">Restricted</h1>
        <p className="text-obsidian/60 text-sm">
          This dashboard is limited to Cleard staff. Sign in with an internal account to view GC compliance
          status.
        </p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "expiring", label: "Expiring Soon" },
    { key: "expired", label: "Expired" },
    { key: "clear", label: "All Clear" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <header className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-obsidian/50 mb-2">
          Staff / GC Compliance
        </div>
        <h1 className="display-serif text-4xl text-obsidian">GC License &amp; Insurance</h1>
        <p className="text-obsidian/60 mt-2 text-sm max-w-2xl">
          Monitor license, general liability, workers comp, and bond expirations across every GC client
          firm.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`min-h-[44px] px-4 font-mono text-[10px] uppercase tracking-[0.16em] rounded-[3px] border ${
              tab === t.key
                ? "border-obsidian bg-obsidian text-white"
                : "border-obsidian/20 text-obsidian/60 hover:bg-obsidian/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="border border-obsidian/10 bg-white rounded-[3px] overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-obsidian/[0.03] text-left font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60">
              <th className="px-4 py-3">GC Firm</th>
              <th className="px-4 py-3">License Status</th>
              <th className="px-4 py-3">License Expires</th>
              <th className="px-4 py-3">GL Insurance Expires</th>
              <th className="px-4 py-3">WC Insurance Expires</th>
              <th className="px-4 py-3">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian/10">
            {rows.map(({ profile, status, flags }) => (
              <tr key={profile.id}>
                <td className="px-4 py-3">
                  <div className="text-obsidian font-medium">{profile.legalName}</div>
                  <div className="text-obsidian/50 text-xs">{profile.primaryQualifier.licenseNumber}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={status} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-obsidian/70">
                  {profile.primaryQualifier.expiration}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-obsidian/70">
                  {profile.generalLiability.expiration}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-obsidian/70">{profile.workersComp.expiration}</td>
                <td className="px-4 py-3 text-obsidian/70">{flags.length}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-obsidian/40 text-sm">
                  No GC company profiles match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
