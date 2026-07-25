import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listSubs, coiLifecycle, updateSubApi, type SubRow } from "@/lib/subs-api";
import { verifyDbprLicense, dbprLookupUrl, type DbprResult } from "@/lib/dbpr-api";
import { AlertTriangle, ShieldCheck, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance — Cleard by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompliancePage,
});

function CompliancePage() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});

  useEffect(() => {
    listSubs()
      .then(setSubs)
      .finally(() => setLoading(false));
  }, []);

  async function verify(sub: SubRow) {
    if (!sub.license_number) {
      toast.error("No license number on file");
      return;
    }
    setVerifying((v) => ({ ...v, [sub.id]: true }));
    try {
      const r: DbprResult = await verifyDbprLicense(sub.license_number);
      await updateSubApi(sub.id, {
        // Cast because generated types haven't picked up new columns yet
        ...( {
          dbpr_verified_at: r.checked_at,
          dbpr_status: r.status,
          dbpr_holder_name: r.holder_name ?? null,
          dbpr_license_type: r.license_type ?? null,
          dbpr_expiration: r.expiration ?? null,
        } as any ),
      });
      setSubs((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? ({ ...s,
                dbpr_verified_at: r.checked_at,
                dbpr_status: r.status,
                dbpr_holder_name: r.holder_name ?? null,
                dbpr_license_type: r.license_type ?? null,
                dbpr_expiration: r.expiration ?? null,
              } as unknown as SubRow)
            : s,
        ),
      );
      toast.success(`DBPR: ${r.status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setVerifying((v) => ({ ...v, [sub.id]: false }));
    }
  }

  const withCoiExpiring = subs.filter((s) => {
    const c = coiLifecycle(s);
    return c === "expired" || c === "expiring_soon";
  });

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-obsidian/50 mb-2">
            Insurance · Licensing
          </div>
          <h1 className="display-serif text-4xl text-obsidian">Compliance</h1>
          <p className="text-obsidian/60 mt-2 text-sm max-w-2xl">
            COI expiration monitoring and DBPR license verification across every subcontractor in your bench.
          </p>
        </header>

        {/* COI Alerts */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="display-serif text-2xl text-obsidian">COI Alerts</h2>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-obsidian/50">
              {withCoiExpiring.length} needs attention
            </div>
          </div>
          {loading ? (
            <div className="text-sm text-obsidian/50">Loading…</div>
          ) : withCoiExpiring.length === 0 ? (
            <div className="border border-obsidian/10 bg-white p-6 rounded-[3px] flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div className="text-sm text-obsidian/70">All COIs on file are 60+ days from expiration.</div>
            </div>
          ) : (
            <div className="border border-obsidian/10 bg-white rounded-[3px] divide-y divide-obsidian/10">
              {withCoiExpiring.map((s) => {
                const c = coiLifecycle(s);
                return (
                  <div key={s.id} className="p-4 flex items-center gap-4">
                    <AlertTriangle
                      className={`h-5 w-5 ${c === "expired" ? "text-red-600" : "text-amber-600"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-obsidian font-medium">{s.company_name}</div>
                      <div className="text-obsidian/55 text-xs mt-0.5">
                        {s.trade || "—"} · Exp {s.coi_expiration || "—"}
                      </div>
                    </div>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-1 rounded-[3px] ${
                        c === "expired" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c === "expired" ? "Expired" : "Expiring Soon"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* DBPR Verification */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="display-serif text-2xl text-obsidian">DBPR License Verification</h2>
          </div>
          <div className="border border-obsidian/10 bg-white rounded-[3px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-obsidian/[0.03] text-left font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">License #</th>
                  <th className="px-4 py-3">DBPR Status</th>
                  <th className="px-4 py-3">Holder</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian/10">
                {subs.map((s) => {
                  const dbpr = (s as any).dbpr_status as string | null;
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-3 text-obsidian">{s.company_name}</td>
                      <td className="px-4 py-3 font-mono text-obsidian/70">{s.license_number || "—"}</td>
                      <td className="px-4 py-3">
                        <DbprBadge status={dbpr} />
                      </td>
                      <td className="px-4 py-3 text-obsidian/70">{(s as any).dbpr_holder_name || "—"}</td>
                      <td className="px-4 py-3 text-obsidian/70 font-mono text-xs">
                        {(s as any).dbpr_expiration || "—"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => verify(s)}
                          disabled={!s.license_number || verifying[s.id]}
                          className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-40"
                        >
                          {verifying[s.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                          Verify
                        </button>
                        {s.license_number && (
                          <a
                            href={dbprLookupUrl(s.license_number)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 ml-2 text-obsidian/40 hover:text-obsidian"
                            title="Open DBPR"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {subs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-obsidian/40 text-sm">
                      No subcontractors on file.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function DbprBadge({ status }: { status: string | null }) {
  const cls: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    expired: "bg-red-100 text-red-700",
    inactive: "bg-red-100 text-red-700",
    not_found: "bg-amber-100 text-amber-800",
    unknown: "bg-obsidian/10 text-obsidian/60",
  };
  const label: Record<string, string> = {
    active: "Verified · Active",
    expired: "Expired",
    inactive: "Inactive",
    not_found: "Not Found",
    unknown: "Unknown",
  };
  const key = status ?? "unknown";
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[3px] ${cls[key] ?? cls.unknown}`}>
      {label[key] ?? key}
    </span>
  );
}
