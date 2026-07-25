import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Package, Download, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  listSubmissions,
  submissionStatusLabel,
  submissionStatusTone,
  downloadSubmissionZip,
  type SubmissionRow,
} from "@/lib/submissions-api";
import { getPermit, type PermitRow } from "@/lib/permits-api";

export const Route = createFileRoute("/portal/submissions/")({
  component: SubmissionsListPage,
});

function SubmissionsListPage() {
  const [subs, setSubs] = useState<SubmissionRow[]>([]);
  const [permits, setPermits] = useState<Record<string, PermitRow>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    listSubmissions()
      .then(async (rows) => {
        setSubs(rows);
        // Fetch permits (dedup)
        const ids = Array.from(new Set(rows.map((r) => r.permit_id)));
        const results = await Promise.all(ids.map((id) => getPermit(id).catch(() => null)));
        const map: Record<string, PermitRow> = {};
        results.forEach((r) => { if (r) map[r.id] = r; });
        setPermits(map);
      })
      .catch(() => toast.error("Could not load submissions"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subs;
    return subs.filter((s) => {
      const permit = permits[s.permit_id];
      return (
        permit?.project_name?.toLowerCase().includes(q) ||
        permit?.job_address?.toLowerCase().includes(q) ||
        s.trades_included.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [subs, permits, query]);

  async function handleDownload(sub: SubmissionRow) {
    const permit = permits[sub.permit_id];
    setDownloading(sub.id);
    try {
      await downloadSubmissionZip(sub, permit?.project_name ?? "package");
    } catch (e) {
      toast.error("Download failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="border-b border-obsidian/10 pb-6">
        <div className="eyebrow text-obsidian/50 flex items-center gap-2">
          <Package className="h-3.5 w-3.5" /> Ops Queue
        </div>
        <h1 className="display-serif mt-2 text-4xl text-obsidian">Submissions</h1>
        <p className="mt-2 text-sm text-obsidian/65 max-w-2xl">
          Bundled permit packages submitted by the GC. Ops reviews, then forwards each package to the municipality.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-obsidian/40" />
          <input
            type="search"
            placeholder="Search project, address, trade…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-obsidian/15 bg-white text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading && <div className="text-sm text-obsidian/60">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="border border-obsidian/12 rounded-[3px] p-8 text-center text-sm text-obsidian/60 bg-white">
            No submissions yet. Bundle packages appear here after a GC submits.
          </div>
        )}
        {filtered.map((sub) => {
          const permit = permits[sub.permit_id];
          const docCount = sub.package_manifest.length;
          return (
            <div key={sub.id} className="bg-white border border-obsidian/10 rounded-[3px] p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/portal/submissions/$id"
                    params={{ id: sub.id }}
                    className="text-sm font-medium text-obsidian hover:underline"
                  >
                    {permit?.project_name ?? "—"}
                  </Link>
                  <span className={`inline-flex items-center border rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${sub.type === "partial" ? "border-amber-500/40 bg-amber-50 text-amber-800" : "border-emerald-600/40 bg-emerald-50 text-emerald-700"}`}>
                    {sub.type}
                  </span>
                  <span className={`inline-flex items-center border rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${submissionStatusTone(sub.status)}`}>
                    {submissionStatusLabel(sub.status)}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-obsidian/60">{permit?.job_address ?? ""}</div>
                <div className="mt-2 text-[11px] text-obsidian/60 font-mono uppercase tracking-[0.14em]">
                  {new Date(sub.created_at).toLocaleDateString()} · Trades: {sub.trades_included.join(", ") || "—"}
                  {sub.trades_pending.length > 0 && <span className="text-amber-700"> · Pending: {sub.trades_pending.join(", ")}</span>}
                </div>
                <div className="mt-1 text-[11px] text-obsidian/50 font-mono uppercase tracking-[0.14em]">
                  {docCount} document{docCount === 1 ? "" : "s"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(sub)}
                  disabled={downloading === sub.id}
                  className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-60"
                >
                  {downloading === sub.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Download Package
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
