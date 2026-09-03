import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PortalShell } from "@/components/portal-shell";
import { AdminOnly } from "@/components/admin-only";
import { listLeads } from "@/lib/leads";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Landing page leads · Admin — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <AdminLeads />
    </AdminOnly>
  ),
});

const COLUMNS = [
  "Name",
  "Company",
  "Email",
  "County",
  "Permit type",
  "Days",
  "Fees",
  "Source",
  "Page URL",
  "Created",
];

function AdminLeads() {
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: listLeads,
  });

  return (
    <PortalShell>
      <div className="mx-auto max-w-7xl px-5 py-8">
        <h1 className="text-2xl font-semibold">Landing page leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submissions from the permit-timeline landing pages, newest first.
        </p>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="mt-8 text-sm text-destructive">{(error as Error).message}</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">No leads yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-md border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.company ?? "—"}</td>
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2">{r.county ?? "—"}</td>
                    <td className="px-3 py-2">{r.permit_type ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {r.estimate_days_low != null && r.estimate_days_high != null
                        ? `${r.estimate_days_low}–${r.estimate_days_high}`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {r.estimate_fee_low != null && r.estimate_fee_high != null
                        ? `$${r.estimate_fee_low.toLocaleString()}–$${r.estimate_fee_high.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">{r.source}</td>
                    <td className="max-w-[280px] break-all px-3 py-2 text-xs">
                      {r.page_url ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
