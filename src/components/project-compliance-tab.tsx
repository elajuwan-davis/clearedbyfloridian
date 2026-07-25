import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { listSubs, type SubRow } from "@/lib/subs-api";
import { scanCoiFn, scanW9Fn, verifyLicenseFn } from "@/lib/compliance.functions";
import { dbprLookupUrl } from "@/lib/dbpr-api";

type Tri = "verified" | "review" | "issue" | "missing";

function coiTri(s: SubRow): Tri {
  const v = (s as any).coi_status as string | null;
  if (v === "verified") return "verified";
  if (v === "needs_review") return "review";
  if (!s.coi_file_path) return "missing";
  return "review";
}
function w9Tri(s: SubRow): Tri {
  const v = (s as any).w9_status as string | null;
  if (v === "verified") return "verified";
  if (v === "incomplete") return "review";
  if (!s.w9_file_path) return "missing";
  return "review";
}
function licenseTri(s: SubRow): Tri {
  const v = (s as any).license_status as string | null;
  if (v === "verified") return "verified";
  if (v === "issue") return "issue";
  if (!s.license_number) return "missing";
  return "review";
}

function Badge({ tri, label }: { tri: Tri; label: string }) {
  const cls =
    tri === "verified"
      ? "bg-emerald-100 text-emerald-800"
      : tri === "issue"
      ? "bg-red-100 text-red-700"
      : tri === "review"
      ? "bg-amber-100 text-amber-800"
      : "bg-obsidian/10 text-obsidian/50";
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[3px] ${cls}`}>
      {label}
    </span>
  );
}

function statusLabel(tri: Tri, kind: "coi" | "license" | "w9") {
  if (tri === "verified") return kind === "license" ? "Verified" : kind === "coi" ? "Verified" : "W-9 Verified";
  if (tri === "issue") return "License Issue";
  if (tri === "review") return kind === "coi" ? "Needs Review" : kind === "w9" ? "Incomplete" : "Review";
  return "Missing";
}

export function ProjectComplianceTab({ projectSubIds }: { projectSubIds?: string[] }) {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<SubRow | null>(null);

  async function refresh() {
    const rows = await listSubs();
    const scoped = projectSubIds?.length
      ? rows.filter((r) => projectSubIds.includes(r.id) || projectSubIds.includes(r.company_name))
      : rows;
    setSubs(scoped);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runScan(sub: SubRow, kind: "coi" | "w9" | "license") {
    setBusy((b) => ({ ...b, [sub.id]: kind }));
    try {
      if (kind === "coi") await scanCoiFn({ data: { subId: sub.id } });
      else if (kind === "w9") await scanW9Fn({ data: { subId: sub.id } });
      else await verifyLicenseFn({ data: { subId: sub.id } });
      toast.success(`${kind.toUpperCase()} rescanned`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[sub.id];
        return next;
      });
    }
  }

  if (loading) return <div className="text-sm text-obsidian/50">Loading compliance data…</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-obsidian/50">Compliance Intelligence</div>
          <h3 className="display-serif text-xl text-obsidian mt-1">Sub Documentation Status</h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
          <ShieldCheck className="h-3.5 w-3.5" /> Auto-scanned on upload
        </div>
      </div>

      <div className="border border-obsidian/10 bg-white rounded-[3px] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-obsidian/[0.03] text-left font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60">
              <th className="px-4 py-3">Sub</th>
              <th className="px-4 py-3">Trade</th>
              <th className="px-4 py-3">COI</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3">W-9</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian/10">
            {subs.map((s) => {
              const coi = coiTri(s);
              const lic = licenseTri(s);
              const w9 = w9Tri(s);
              const updated =
                (s as any).coi_verified_at ||
                (s as any).w9_verified_at ||
                (s as any).dbpr_verified_at ||
                s.updated_at;
              return (
                <tr
                  key={s.id}
                  className="hover:bg-obsidian/[0.02] cursor-pointer"
                  onClick={() => setSelected(s)}
                >
                  <td className="px-4 py-3 text-obsidian font-medium">{s.company_name}</td>
                  <td className="px-4 py-3 text-obsidian/70">{s.trade || "—"}</td>
                  <td className="px-4 py-3"><Badge tri={coi} label={statusLabel(coi, "coi")} /></td>
                  <td className="px-4 py-3"><Badge tri={lic} label={statusLabel(lic, "license")} /></td>
                  <td className="px-4 py-3"><Badge tri={w9} label={statusLabel(w9, "w9")} /></td>
                  <td className="px-4 py-3 font-mono text-[10px] text-obsidian/50">
                    {updated ? new Date(updated).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/40">
                      View →
                    </span>
                  </td>
                </tr>
              );
            })}
            {subs.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-obsidian/40 text-sm">
                  No subcontractors on this project yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <ComplianceDetail
          sub={selected}
          onClose={() => setSelected(null)}
          onRescan={runScan}
          busyKind={busy[selected.id]}
        />
      )}
    </div>
  );
}

function ComplianceDetail({
  sub,
  onClose,
  onRescan,
  busyKind,
}: {
  sub: SubRow;
  onClose: () => void;
  onRescan: (sub: SubRow, kind: "coi" | "w9" | "license") => void;
  busyKind?: string;
}) {
  const coiFlags = ((sub as any).coi_flags as string[] | null) || [];
  const w9Flags = ((sub as any).w9_flags as string[] | null) || [];
  const coiExtracted = (sub as any).coi_extracted as any;
  const w9Extracted = (sub as any).w9_extracted as any;
  const dbprStatus = (sub as any).dbpr_status as string | null;

  return (
    <div
      className="fixed inset-0 z-50 bg-obsidian/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[3px] max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-obsidian/10 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-obsidian/50">Compliance Detail</div>
            <h3 className="display-serif text-2xl text-obsidian mt-1">{sub.company_name}</h3>
            <div className="text-xs text-obsidian/55 mt-0.5">{sub.trade || "—"}</div>
          </div>
          <button
            className="text-obsidian/40 hover:text-obsidian text-2xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* COI */}
          <Section
            title="Certificate of Insurance"
            fileName={sub.coi_file_name}
            action={
              <button
                className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-obsidian/5 disabled:opacity-40"
                disabled={!sub.coi_file_path || busyKind === "coi"}
                onClick={() => onRescan(sub, "coi")}
              >
                {busyKind === "coi" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Rescan
              </button>
            }
          >
            {coiExtracted?.policies?.length ? (
              <div className="space-y-2">
                {coiExtracted.policies.map((p: any, i: number) => (
                  <div key={i} className="text-xs text-obsidian/70 grid grid-cols-4 gap-2">
                    <div className="font-medium text-obsidian">{p.type}</div>
                    <div>Exp: {p.expiration_date || "—"}</div>
                    <div>Per-Occ: {p.per_occurrence_cents ? `$${(p.per_occurrence_cents / 100).toLocaleString()}` : "—"}</div>
                    <div>Agg: {p.aggregate_cents ? `$${(p.aggregate_cents / 100).toLocaleString()}` : "—"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-obsidian/40">Not yet scanned.</div>
            )}
            <FlagsList flags={coiFlags} />
          </Section>

          {/* License */}
          <Section
            title="DBPR License"
            fileName={sub.license_number ? `#${sub.license_number}` : null}
            action={
              <div className="flex items-center gap-2">
                {sub.license_number && (
                  <a
                    href={dbprLookupUrl(sub.license_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-obsidian/40 hover:text-obsidian"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-obsidian/5 disabled:opacity-40"
                  disabled={!sub.license_number || busyKind === "license"}
                  onClick={() => onRescan(sub, "license")}
                >
                  {busyKind === "license" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Reverify
                </button>
              </div>
            }
          >
            <div className="text-xs text-obsidian/70 grid grid-cols-2 gap-2">
              <div>Status: <span className="font-medium text-obsidian">{dbprStatus || "not checked"}</span></div>
              <div>Holder: {(sub as any).dbpr_holder_name || "—"}</div>
              <div>Type: {(sub as any).dbpr_license_type || "—"}</div>
              <div>Expires: {(sub as any).dbpr_expiration || "—"}</div>
            </div>
          </Section>

          {/* W-9 */}
          <Section
            title="Form W-9"
            fileName={sub.w9_file_name}
            action={
              <button
                className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-obsidian/5 disabled:opacity-40"
                disabled={!sub.w9_file_path || busyKind === "w9"}
                onClick={() => onRescan(sub, "w9")}
              >
                {busyKind === "w9" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Rescan
              </button>
            }
          >
            {w9Extracted ? (
              <div className="text-xs text-obsidian/70 grid grid-cols-2 gap-2">
                <div>Legal Name: <span className="text-obsidian">{w9Extracted.legal_business_name || "—"}</span></div>
                <div>Type: {w9Extracted.business_type || "—"}</div>
                <div>Tax ID: {w9Extracted.tax_id_present ? "Present" : "Missing"}</div>
                <div>Signature: {w9Extracted.signature_present ? "Present" : "Missing"}</div>
                <div>Date Signed: {w9Extracted.date_signed || "—"}</div>
              </div>
            ) : (
              <div className="text-xs text-obsidian/40">Not yet scanned.</div>
            )}
            <FlagsList flags={w9Flags} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  fileName,
  action,
  children,
}: {
  title: string;
  fileName: string | null | undefined;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-obsidian/10 rounded-[3px] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/50">{title}</div>
          <div className="text-sm text-obsidian mt-0.5">{fileName || "No file on record"}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function FlagsList({ flags }: { flags: string[] }) {
  if (!flags.length) return null;
  return (
    <div className="mt-3 border-t border-obsidian/10 pt-3 space-y-1">
      {flags.map((f, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{f}</span>
        </div>
      ))}
    </div>
  );
}
