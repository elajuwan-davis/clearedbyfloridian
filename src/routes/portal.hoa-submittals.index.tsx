import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, EmptyState } from "@/components/ui-kit";
import {
  listHoaSubmittals,
  HOA_STATUS_LABELS,
  HOA_PROJECT_TYPE_LABELS,
  type HoaSubmittalRow,
  type HoaStatus,
} from "@/lib/hoa-submittals";

export const Route = createFileRoute("/portal/hoa-submittals/")({
  head: () => ({
    meta: [
      { title: "HOA Submittals — Cleard" },
      { name: "description", content: "Manage HOA/ARC submittals for your projects." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HoaSubmittalsIndex,
});

const STATUS_BADGE: Record<HoaStatus, string> = {
  draft: "p-chip p-chip-info",
  submitted_to_hoa: "p-chip p-chip-info",
  pending_arc_meeting: "p-chip p-chip-warning",
  approved: "p-chip p-chip-success",
  conditionally_approved: "p-chip p-chip-warning",
  denied: "p-chip p-chip-danger",
};

function HoaSubmittalsIndex() {
  const [rows, setRows] = useState<HoaSubmittalRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listHoaSubmittals().then(setRows).catch((e) => setErr(String(e?.message ?? e)));
  }, []);

  return (
    <PageShell
      crumbs={[{ label: "Portal", to: "/dashboard" }, { label: "HOA Submittals" }]}
      title="HOA Submittals"
      meta="ARC / architectural review"
      actions={
        <Button asChild className="gap-2">
          <Link to="/portal/hoa-submittals/new">
            <Plus className="h-4 w-4" /> New submittal
          </Link>
        </Button>
      }
    >
      {err && (
        <div className="mb-4 border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3 rounded-lg">{err}</div>
      )}

      {rows === null ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-obsidian/30" />}
          title="No HOA submittals yet"
          description="Upload an HOA's ARC form to pre-fill it, or start from the Cleard boilerplate template."
          action={
            <Button asChild className="gap-2">
              <Link to="/portal/hoa-submittals/new"><Plus className="h-4 w-4" /> New submittal</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[color:var(--line)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Property / HOA</th>
                <th>Project Type</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="font-medium text-obsidian">{r.property_address || r.applicant_name || "Untitled"}</div>
                    <div className="text-xs text-muted-foreground">
                      {[r.hoa_name, r.community_name, r.village_name].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="text-obsidian/80">
                    {r.project_type ? HOA_PROJECT_TYPE_LABELS[r.project_type] : "—"}
                  </td>
                  <td>
                    <span className={STATUS_BADGE[r.status]}>
                      {HOA_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="text-xs text-obsidian/60">
                    {new Date(r.updated_at).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <Link
                      to="/portal/hoa-submittals/$id"
                      params={{ id: r.id }}
                      className="p-btn p-btn-ghost p-btn-sm"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
