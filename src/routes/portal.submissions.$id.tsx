import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getSubmission,
  updateSubmissionStatus,
  submissionStatusLabel,
  submissionStatusTone,
  downloadSubmissionZip,
  viewManifestFile,
  type SubmissionRow,
  type SubmissionStatus,
} from "@/lib/submissions-api";
import { getPermit, type PermitRow } from "@/lib/permits-api";
import { PageShell, Panel, StatusChip } from "@/components/ui-kit";

export const Route = createFileRoute("/portal/submissions/$id")({
  head: () => ({
    meta: [
      { title: "Submission — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubmissionDetailPage,
});

const STATUSES: SubmissionStatus[] = ["received", "in_review", "submitted_to_muni", "complete"];

function SubmissionDetailPage() {
  const { id } = Route.useParams();
  const [sub, setSub] = useState<SubmissionRow | null>(null);
  const [permit, setPermit] = useState<PermitRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSubmission(id);
        if (!s) throw notFound();
        setSub(s);
        const p = await getPermit(s.permit_id).catch(() => null);
        setPermit(p);
      } catch {
        toast.error("Could not load submission");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function changeStatus(next: SubmissionStatus) {
    if (!sub) return;
    try {
      const updated = await updateSubmissionStatus(sub.id, next);
      setSub(updated);
      toast.success("Status updated");
    } catch (e) {
      toast.error("Update failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function handleDownload() {
    if (!sub) return;
    setDownloading(true);
    try {
      await downloadSubmissionZip(sub, permit?.project_name ?? "package");
    } catch (e) {
      toast.error("Download failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setDownloading(false);
    }
  }

  async function viewFile(path: string | null) {
    if (!path) { toast.error("No stored file"); return; }
    try {
      const url = await viewManifestFile(path);
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Could not open file");
    }
  }

  if (loading) return <div className="px-6 py-12 text-muted-foreground">Loading…</div>;
  if (!sub) return <div className="px-6 py-12 text-muted-foreground">Submission not found.</div>;

  const grouped: Record<string, typeof sub.package_manifest> = {};
  for (const e of sub.package_manifest) {
    (grouped[e.trade] ??= []).push(e);
  }

  return (
    <PageShell
      crumbs={[{ label: "Submissions", to: "/portal/submissions" }, { label: permit?.project_name ?? "Submission" }]}
      title={permit?.project_name ?? "—"}
      meta={`${sub.type.toUpperCase()} · ${permit?.job_address ?? ""} · Submitted ${new Date(sub.created_at).toLocaleDateString()} · Fee $${(sub.fee_cents / 100).toFixed(2)}`}
      actions={
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="p-btn p-btn-ghost"
        >
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Download Package
        </button>
      }
    >
      <div className="space-y-4">
        <Panel title="Status">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                className={`p-btn p-btn-sm ${
                  sub.status === s ? submissionStatusTone(s) : "p-btn-ghost"
                }`}
              >
                {submissionStatusLabel(s)}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Trades">
          <div className="text-[12.5px]">{sub.trades_included.join(", ") || "—"}</div>
          {sub.trades_pending.length > 0 && (
            <>
              <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--p-warning)]">Trades Pending</div>
              <div className="mt-1 text-[12.5px]">{sub.trades_pending.join(", ")}</div>
            </>
          )}
          {sub.notes && (
            <>
              <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Notes</div>
              <div className="mt-1 whitespace-pre-line text-[12.5px] text-muted-foreground">{sub.notes}</div>
            </>
          )}
        </Panel>

        <Panel title="Package Contents" meta={`${sub.package_manifest.length} files`} bodyClassName="px-0 pb-0" padded={Object.keys(grouped).length === 0}>
          {Object.keys(grouped).length === 0 && (
            <div className="text-[12.5px] text-muted-foreground">No documents attached.</div>
          )}
          {Object.entries(grouped).map(([trade, entries], i) => (
            <div key={trade} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--p-border)" }}>
              <div className="px-3 pt-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{trade}</div>
              <ul className="p-divide">
                {entries.map((e) => (
                  <li key={`${e.trade_key}-${e.doc_key}`} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px]">{e.doc_label}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{e.filename}</div>
                    </div>
                    {e.storage_path ? (
                      <button
                        onClick={() => viewFile(e.storage_path)}
                        className="p-btn p-btn-ghost p-btn-sm shrink-0"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                    ) : (
                      <StatusChip tone="warning" className="shrink-0">No stored file</StatusChip>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Panel>
      </div>
    </PageShell>
  );
}
