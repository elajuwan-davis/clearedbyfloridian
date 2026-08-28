import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BackendReconnecting } from "@/components/backend-reconnecting";
import { isMissingBackendEnvError } from "@/lib/env-error";
import { listTenantPlansFn, setTenantPlanFn, type TenantPlanRow } from "@/lib/tenants.functions";
import { EmptyState, SearchInput, StatusChip, TableShell } from "@/components/ui-kit";

function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

/**
 * Which tier each tenant is on, and the switch between them. A trial tenant sees
 * five places (dashboard, permits, portal logins, messages, account) and a lock on
 * the staff-run tools; a full tenant sees everything.
 */
export function AdminTenantPlansView() {
  const load = useServerFn(listTenantPlansFn);
  const setPlan = useServerFn(setTenantPlanFn);
  const [rows, setRows] = useState<TenantPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = (await load({} as never)) as TenantPlanRow[];
        if (alive) setRows(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load tenants");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  async function move(row: TenantPlanRow, plan: "trial" | "full") {
    if (plan === row.plan) return;
    setSaving(row.id);
    try {
      await setPlan({ data: { tenant_id: row.id, plan } });
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, plan } : r)));
      toast.success(`${row.name} is now ${plan === "full" ? "full access" : "trial"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the plan");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <div className="px-1 py-6 text-[12.5px] text-muted-foreground">Loading tenants…</div>;
  }
  if (error) {
    return isMissingBackendEnvError(error) ? (
      <BackendReconnecting />
    ) : (
      <div className="p-plate p-4 text-[12.5px] text-[var(--p-danger)]">{error}</div>
    );
  }
  if (rows.length === 0) return <EmptyState title="No tenants yet" />;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.owner_email ?? "").toLowerCase().includes(q),
      )
    : rows;
  const trialCount = rows.filter((r) => r.plan === "trial").length;

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11.5px] text-muted-foreground">
          {rows.length} tenants · {trialCount} on trial
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Search tenant or owner" />
      </div>
      <TableShell>
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Owner</th>
            <th>Created</th>
            <th className="text-right">Members</th>
            <th>Plan</th>
            <th className="text-right">Switch to</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td className="min-w-0">
                <div className="truncate text-[12.5px] font-medium">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.status}</div>
              </td>
              <td className="text-[12.5px] text-muted-foreground">{r.owner_email ?? "—"}</td>
              <td className="whitespace-nowrap text-[11.5px] tabular-nums text-muted-foreground">
                {fmt(r.created_at)}
              </td>
              <td className="text-right text-[12.5px] tabular-nums">{r.member_count}</td>
              <td>
                <StatusChip tone={r.plan === "full" ? "success" : "warning"}>
                  {r.plan === "full" ? "Full access" : "Trial"}
                </StatusChip>
              </td>
              <td className="text-right">
                <button
                  type="button"
                  className="p-btn"
                  disabled={saving === r.id}
                  onClick={() => move(r, r.plan === "full" ? "trial" : "full")}
                >
                  {saving === r.id ? "Saving…" : r.plan === "full" ? "Trial" : "Full access"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      {filtered.length === 0 ? (
        <div className="px-3 py-10 text-center text-[12px] text-muted-foreground">
          No tenant matches “{query}”.
        </div>
      ) : null}
    </>
  );
}
