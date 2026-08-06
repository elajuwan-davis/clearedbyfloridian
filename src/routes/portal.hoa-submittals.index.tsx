import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  draft: "p-chip p-chip-neutral",
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
    <>
      <div className="space-y-8 max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label-eyebrow">◇ HOA</div>
            <h1 className="mt-4 font-display text-4xl tracking-tight text-obsidian">HOA Submittals</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ARC / architectural review applications, prepared alongside your permits.
              Every submittal builds the shared community repository.
            </p>
          </div>
          <Button asChild variant="dark" className="rounded-[3px] gap-2">
            <Link to="/portal/hoa-submittals/new">
              <Plus className="h-4 w-4" /> New HOA Submittal
            </Link>
          </Button>
        </header>

        {err && (
          <div className="border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3 rounded-[3px]">{err}</div>
        )}

        {rows === null ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="border border-dashed border-obsidian/15 rounded-[3px] px-6 py-16 text-center">
            <FileText className="mx-auto h-8 w-8 text-obsidian/30" />
            <div className="mt-4 font-display text-2xl text-obsidian">No HOA submittals yet</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload an HOA's ARC form to pre-fill it, or start from the Cleard boilerplate template.
            </p>
            <Button asChild variant="dark" className="mt-6 rounded-[3px] gap-2">
              <Link to="/portal/hoa-submittals/new"><Plus className="h-4 w-4" /> New HOA Submittal</Link>
            </Button>
          </div>
        ) : (
          <div className="border border-obsidian/10 rounded-[3px] overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-paper-warm text-obsidian/70">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Property / HOA</th>
                  <th className="text-left px-4 py-3 font-medium">Project Type</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-obsidian/10">
                    <td className="px-4 py-3">
                      <div className="font-medium text-obsidian">{r.property_address || r.applicant_name || "Untitled"}</div>
                      <div className="text-xs text-muted-foreground">
                        {[r.hoa_name, r.community_name, r.village_name].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-obsidian/80">
                      {r.project_type ? HOA_PROJECT_TYPE_LABELS[r.project_type] : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[r.status]}>
                        {HOA_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-obsidian/60">
                      {new Date(r.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/portal/hoa-submittals/$id"
                        params={{ id: r.id }}
                        className="text-sm text-obsidian underline underline-offset-4 hover:text-obsidian/70"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
