import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listSubs, coiLifecycle, updateSubApi, type SubRow } from "@/lib/subs-api";
import { verifyDbprLicense, dbprLookupUrl, type DbprResult } from "@/lib/dbpr-api";
import { AlertTriangle, ShieldCheck, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PageShell, Split, Panel, StatTile, StatusChip, TableShell, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/portal/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance — Cleard" },
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
  const expiredCount = subs.filter((s) => coiLifecycle(s) === "expired").length;

  return (
    <PageShell
      crumbs={[{ label: "Workspace" }, { label: "Compliance" }]}
      title="Compliance"
      meta={loading ? "Loading…" : `${subs.length} subcontractors on file`}
    >
      <Split
        asideWidth={300}
        main={
          <div className="space-y-4">
            <Panel title="DBPR License Verification" padded={false}>
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-10 text-[12.5px] text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : subs.length === 0 ? (
                <EmptyState title="No subcontractors on file." />
              ) : (
                <TableShell>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>License #</th>
                      <th>DBPR Status</th>
                      <th>Holder</th>
                      <th>Expires</th>
                      <th className="w-[1%]" />
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s) => {
                      const dbpr = (s as any).dbpr_status as string | null;
                      return (
                        <tr key={s.id}>
                          <td className="font-medium">{s.company_name}</td>
                          <td className="text-muted-foreground">{s.license_number || "—"}</td>
                          <td><DbprBadge status={dbpr} /></td>
                          <td className="text-muted-foreground">{(s as any).dbpr_holder_name || "—"}</td>
                          <td className="text-muted-foreground">{(s as any).dbpr_expiration || "—"}</td>
                          <td>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => verify(s)}
                                disabled={!s.license_number || verifying[s.id]}
                                className="p-btn p-btn-ghost p-btn-sm"
                              >
                                {verifying[s.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                Verify
                              </button>
                              {s.license_number && (
                                <a
                                  href={dbprLookupUrl(s.license_number)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-btn p-btn-quiet p-btn-sm"
                                  title="Open DBPR"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableShell>
              )}
            </Panel>
          </div>
        }
        aside={
          <>
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="Needs Attention" value={withCoiExpiring.length} tone={withCoiExpiring.length ? "warning" : "neutral"} />
              <StatTile label="Expired COIs" value={expiredCount} tone={expiredCount ? "danger" : "neutral"} />
            </div>
            <Panel title="COI Alerts" meta={`${withCoiExpiring.length} needs attention`} padded={false}>
              {loading ? (
                <div className="px-3 py-4 text-[12px] text-muted-foreground">Loading…</div>
              ) : withCoiExpiring.length === 0 ? (
                <div className="flex items-center gap-2.5 px-3 py-3">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--p-success)]" />
                  <div className="text-[12px] text-muted-foreground">All COIs on file are 60+ days from expiration.</div>
                </div>
              ) : (
                <div className="p-divide">
                  {withCoiExpiring.map((s) => {
                    const c = coiLifecycle(s);
                    return (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                        <AlertTriangle
                          className="h-4 w-4 shrink-0"
                          style={{ color: c === "expired" ? "var(--p-danger)" : "var(--p-warning)" }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12.5px] font-medium">{s.company_name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {s.trade || "—"} · Exp {s.coi_expiration || "—"}
                          </div>
                        </div>
                        <StatusChip tone={c === "expired" ? "danger" : "warning"}>
                          {c === "expired" ? "Expired" : "Expiring"}
                        </StatusChip>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </>
        }
      />
    </PageShell>
  );
}

function DbprBadge({ status }: { status: string | null }) {
  const tone: Record<string, "success" | "danger" | "warning" | "neutral"> = {
    active: "success",
    expired: "danger",
    inactive: "danger",
    not_found: "warning",
    unknown: "neutral",
  };
  const label: Record<string, string> = {
    active: "Verified · Active",
    expired: "Expired",
    inactive: "Inactive",
    not_found: "Not Found",
    unknown: "Unknown",
  };
  const key = status ?? "unknown";
  return <StatusChip tone={tone[key] ?? "neutral"}>{label[key] ?? key}</StatusChip>;
}
