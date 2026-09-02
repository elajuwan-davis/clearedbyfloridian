import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { AdminOnly } from "@/components/admin-only";
import { listCrmProfilesFn, type CrmProfileRow } from "@/lib/crm.functions";
import { CRM_OPTIONS, CRM_SOURCE_LABEL } from "@/lib/crm-options";

export const Route = createFileRoute("/admin/crms")({
  head: () => ({
    meta: [
      { title: "CRMs · Admin — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <AdminCrms />
    </AdminOnly>
  ),
});

type SortKey = "name" | "company" | "crm" | "crm_other" | "signed_up_at" | "source";

const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: "name", label: "User" },
  { key: "company", label: "Company" },
  { key: "crm", label: "CRM selected" },
  { key: "crm_other", label: "Other value" },
  { key: "signed_up_at", label: "Signup date" },
  { key: "source", label: "Signed up via" },
];

function AdminCrms() {
  const list = useServerFn(listCrmProfilesFn);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-crm-profiles"],
    queryFn: () => list(),
  });

  const [filter, setFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("signed_up_at");
  const [asc, setAsc] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = r.crm ?? "Not answered";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const visible = useMemo(() => {
    const filtered =
      filter === "all"
        ? rows
        : filter === "__unanswered"
          ? rows.filter((r) => !r.crm)
          : rows.filter((r) => r.crm === filter);
    const val = (r: CrmProfileRow) => (r[sortKey] ?? "").toString().toLowerCase();
    return [...filtered].sort((a, b) => {
      const cmp = val(a).localeCompare(val(b));
      return asc ? cmp : -cmp;
    });
  }, [rows, filter, sortKey, asc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
  }

  return (
    <PortalShell>
      <div className="space-y-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Admin
          </div>
          <h1 className="mt-2 text-2xl font-semibold">CRMs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Which project management or CRM software each account reported at signup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border p-4 text-sm">
          {counts.length === 0 && (
            <span className="text-muted-foreground">No responses yet.</span>
          )}
          {counts.map(([label, n], i) => (
            <span key={label} className="flex items-center gap-3">
              {i > 0 && <span className="text-muted-foreground">·</span>}
              <span>
                {label}: <span className="font-semibold tabular-nums">{n}</span>
              </span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Filter
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 border bg-transparent px-2 text-sm"
          >
            <option value="all">All tools</option>
            <option value="__unanswered">Not answered</option>
            {CRM_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground tabular-nums">
            {visible.length} account{visible.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto border">
          <table className="p-table w-full">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key}>
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1"
                    >
                      {c.label}
                      {sortKey === c.key &&
                        (asc ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        ))}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={COLUMNS.length} className="py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && visible.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="py-8 text-center text-muted-foreground">
                    No accounts match this filter.
                  </td>
                </tr>
              )}
              {visible.map((r) => (
                <tr key={r.user_id}>
                  <td>
                    <div>{r.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.email ?? ""}</div>
                  </td>
                  <td>{r.company ?? "—"}</td>
                  <td>{r.crm ?? "—"}</td>
                  <td>{r.crm_other ?? "—"}</td>
                  <td className="tabular-nums">
                    {r.signed_up_at ? new Date(r.signed_up_at).toLocaleDateString() : "—"}
                  </td>
                  <td>{r.source ? (CRM_SOURCE_LABEL[r.source] ?? r.source) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
