import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { getSubProjectViewFn, getSubProjectDocUrlFn, type SubPortalView } from "@/lib/sub-portal.functions";
import { NocAwarenessRibbon } from "@/components/noc-awareness-ribbon";
import { TradesOnJobPanel } from "@/components/trades-on-job-panel";

export const Route = createFileRoute("/sub-portal/$token")({
  head: () => ({
    meta: [
      { title: "Project Documents — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubPortalPage,
});

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SubPortalPage() {
  const { token } = Route.useParams();
  const [view, setView] = useState<SubPortalView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    getSubProjectViewFn({ data: { token } })
      .then((v) => { if (!v) setNotFound(true); else setView(v); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  async function openDoc(path: string) {
    setOpening(path);
    try {
      const { url } = await getSubProjectDocUrlFn({ data: { token, path } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      alert("Could not open document: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setOpening(null);
    }
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-paper-warm/40 text-obsidian/60">Loading…</div>;
  }

  if (notFound || !view) {
    return (
      <div className="min-h-screen grid place-items-center bg-paper-warm/40 px-4">
        <div className="max-w-md text-center">
          <div className="wordmark text-4xl text-obsidian">Cleared</div>
          <p className="mt-6 text-sm text-obsidian/65">
            This project access link is invalid, expired, or the general contractor hasn't confirmed you on this job yet.
            Please contact your GC.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-warm/40 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <div className="wordmark text-4xl text-obsidian">Cleared</div>
          <div className="wordmark-subline mt-1 text-obsidian/55">by Flōridian</div>
        </div>

        <div className="mt-10 border-b border-obsidian/10 pb-6">
          <div className="eyebrow text-obsidian/50">Project Documents · {view.self.trade}</div>
          <h1 className="display-serif mt-3 text-3xl sm:text-4xl text-obsidian">{view.projectName}</h1>
          <div className="mt-2 text-sm text-obsidian/65">{view.jobAddress}</div>
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
            {view.permitNumber && <span>Permit {view.permitNumber}</span>}
            <span>Status: {statusLabel(view.status)}</span>
            {view.municipality && <span>{view.municipality}</span>}
          </div>
        </div>

        {view.hasNoc && (
          <div className="mt-6">
            <NocAwarenessRibbon scopeKey={`sub-portal:${view.permitId}`} />
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75 mb-3">Documents on File</div>
            {view.documents.length === 0 ? (
              <div className="border border-dashed border-obsidian/15 bg-white rounded-[3px] p-8 text-center text-[13px] text-obsidian/55">
                No project documents have been shared yet.
              </div>
            ) : (
              <ul className="divide-y divide-obsidian/10 border border-obsidian/10 bg-white rounded-[3px]">
                {view.documents.map((d) => (
                  <li key={d.key + (d.path ?? "")} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm text-obsidian">
                        <FileText className="h-3.5 w-3.5 text-obsidian/50 shrink-0" />
                        <span className="truncate">{d.label}</span>
                      </div>
                      {d.uploaded_at && (
                        <div className="mt-0.5 text-[11px] font-mono text-obsidian/45">
                          Uploaded {new Date(d.uploaded_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => d.path && openDoc(d.path)}
                      disabled={!d.path || opening === d.path}
                      className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-50"
                    >
                      {opening === d.path ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                      View
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-obsidian/45">
              You see project-level documents only. Other subcontractors' insurance, W-9s, and license files are private.
            </p>
          </div>

          <div>
            <TradesOnJobPanel trades={view.trades} />
          </div>
        </div>
      </div>
    </div>
  );
}
