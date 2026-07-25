import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stamp, CheckCircle2 } from "lucide-react";
import {
  listNotaryRequests,
  completeNotary,
  notaryBadge,
  NOTARY_EVT,
  type NotaryRequest,
} from "@/lib/notary-requests";
import { addDoc } from "@/lib/project-documents";

export const Route = createFileRoute("/portal/notary-queue")({
  component: NotaryQueuePage,
});

function NotaryQueuePage() {
  const [reqs, setReqs] = useState<NotaryRequest[]>([]);

  useEffect(() => {
    const refresh = () => setReqs(listNotaryRequests());
    refresh();
    window.addEventListener(NOTARY_EVT, refresh);
    return () => window.removeEventListener(NOTARY_EVT, refresh);
  }, []);

  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Internal · Ops Queue</div>
        <h1 className="display-serif mt-1 text-4xl text-obsidian">Notary Requests</h1>
        <p className="mt-2 text-sm text-obsidian/60">
          In-house remote online notarization pursuant to Florida Statute §117.265. Notifications route to info@cleard.com.
        </p>

        <div className="mt-8 space-y-3">
          {reqs.length === 0 && (
            <div className="border border-obsidian/12 bg-white p-10 text-center rounded-[3px]">
              <Stamp className="mx-auto h-6 w-6 text-obsidian/40" />
              <div className="mt-3 text-sm text-obsidian/60">No notary requests in the queue.</div>
            </div>
          )}
          {reqs.map((r) => <NotaryRow key={r.id} r={r} />)}
        </div>
      </div>
    </>
  );
}

function NotaryRow({ r }: { r: NotaryRequest }) {
  const badge = notaryBadge(r.status);
  const [notarizedFilename, setNotarizedFilename] = useState("");

  return (
    <div className="border border-obsidian/12 bg-white rounded-[3px] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[3px] inline-flex items-center gap-1 ${badge.className}`}>
              {badge.iconSeal && <Stamp className="h-2.5 w-2.5" />} {badge.label}
            </span>
            <Link
              to="/portal/projects/$id" params={{ id: r.projectId }}
              className="text-sm font-semibold text-obsidian hover:underline"
            >
              {r.projectName}
            </Link>
          </div>
          <div className="mt-1 text-sm text-obsidian">{r.documentName}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/55">
            Submitted {r.createdAt.slice(0, 10)} by {r.clientName ?? r.createdBy}
          </div>
          {r.notes && <div className="mt-2 text-xs text-obsidian/70 italic">"{r.notes}"</div>}
        </div>
      </div>

      {r.status === "requested" && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-obsidian/8 pt-4">
          <div className="flex-1 min-w-[260px]">
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Notarized filename</label>
            <Input value={notarizedFilename} onChange={(e) => setNotarizedFilename(e.target.value)} placeholder="notarized-owner-auth.pdf" className="mt-1.5 rounded-[3px]" />
          </div>
          <Button variant="dark" className="rounded-[3px]" disabled={!notarizedFilename.trim()} onClick={async () => {
            const name = notarizedFilename.trim();
            completeNotary(r.id, name);
            try {
              await addDoc({ projectId: r.projectId, type: "Civil / Other", filename: `[Notarized] ${name}`, uploadedBy: "Cleard Notary" });
            } catch { /* non-blocking */ }
          }}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
          </Button>
        </div>
      )}

      {r.status === "completed" && r.notarizedFilename && (
        <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/55">
          Completed {r.completedAt?.slice(0, 10)} · {r.notarizedFilename}
        </div>
      )}
    </div>
  );
}
