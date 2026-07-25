import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Eye, Loader2 } from "lucide-react";
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

export const Route = createFileRoute("/portal/submissions/$id")({
  head: () => ({
    meta: [
      { title: "Submission — Cleared by Flōridian" },
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

  if (loading) return <div className="mx-auto max-w-4xl px-6 py-12 text-obsidian/60">Loading…</div>;
  if (!sub) return <div className="mx-auto max-w-4xl px-6 py-12 text-obsidian/60">Submission not found.</div>;

  const grouped: Record<string, typeof sub.package_manifest> = {};
  for (const e of sub.package_manifest) {
    (grouped[e.trade] ??= []).push(e);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link to="/portal/submissions" className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-obsidian/60 hover:text-obsidian">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Submissions
      </Link>

      <div className="mt-4 border-b border-obsidian/10 pb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow text-obsidian/50">Submission · {sub.type.toUpperCase()}</div>
          <h1 className="display-serif mt-2 text-3xl text-obsidian">{permit?.project_name ?? "—"}</h1>
          <div className="mt-1 text-sm text-obsidian/60">{permit?.job_address ?? ""}</div>
          <div className="mt-2 text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60">
            Submitted {new Date(sub.created_at).toLocaleString()} · Fee ${(sub.fee_cents / 100).toFixed(2)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-60"
          >
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download Package
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-5">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75 mb-3">Status</div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`inline-flex items-center border rounded-[3px] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
                sub.status === s ? submissionStatusTone(s) : "border-obsidian/15 text-obsidian/60 bg-white hover:bg-obsidian/5"
              }`}
            >
              {submissionStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-5">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Trades Included</div>
        <div className="mt-2 text-sm text-obsidian">{sub.trades_included.join(", ") || "—"}</div>
        {sub.trades_pending.length > 0 && (
          <>
            <div className="mt-4 text-[11px] font-mono uppercase tracking-[0.18em] text-amber-800">Trades Pending</div>
            <div className="mt-2 text-sm text-amber-900">{sub.trades_pending.join(", ")}</div>
          </>
        )}
        {sub.notes && (
          <>
            <div className="mt-4 text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Notes</div>
            <div className="mt-2 text-sm text-obsidian/80 whitespace-pre-line">{sub.notes}</div>
          </>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Package Contents ({sub.package_manifest.length})</div>
        {Object.keys(grouped).length === 0 && (
          <div className="border border-obsidian/12 rounded-[3px] p-4 text-sm text-obsidian/60 bg-white">
            No documents attached.
          </div>
        )}
        {Object.entries(grouped).map(([trade, entries]) => (
          <div key={trade} className="bg-white border border-obsidian/10 rounded-[3px] p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-obsidian mb-3">{trade}</div>
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={`${e.trade_key}-${e.doc_key}`} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="text-obsidian truncate">{e.doc_label}</div>
                    <div className="text-[11px] text-obsidian/55 font-mono truncate">{e.filename}</div>
                  </div>
                  {e.storage_path ? (
                    <button
                      onClick={() => viewFile(e.storage_path)}
                      className="inline-flex items-center gap-1.5 border border-obsidian/15 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-amber-700">No stored file</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
