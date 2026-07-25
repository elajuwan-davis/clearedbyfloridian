import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Pin, PinOff, Save, ChevronUp } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/use-session";
import {
  STATUSES,
  STATUS_LABEL,
  listRequestsWithMeta,
  updateRequestAdmin,
  type FRStatus,
  type FeatureRequestWithMeta,
} from "@/lib/feature-requests-api";
import { notifyShippedFn } from "@/lib/feature-requests.functions";

export const Route = createFileRoute("/admin/feature-requests")({
  head: () => ({
    meta: [
      { title: "Feature Requests · Admin — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminFeatureRequests,
});

const STATUS_TONE: Record<FRStatus, string> = {
  under_review: "border-obsidian/20 bg-secondary text-obsidian/70",
  planned: "border-sky/40 bg-sky/10 text-obsidian",
  in_progress: "border-yellow-500/40 bg-yellow-500/10 text-yellow-900",
  shipped: "border-emerald-600/40 bg-emerald-600/10 text-emerald-800",
  declined: "border-obsidian/15 bg-obsidian/5 text-obsidian/55",
};

function AdminFeatureRequests() {
  const session = useSession();
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["feature-requests"],
    queryFn: listRequestsWithMeta,
    enabled: session.isAdmin,
  });

  const stats = useMemo(() => {
    const total = requests.length;
    const byCategory = new Map<string, number>();
    for (const r of requests) byCategory.set(r.request_type, (byCategory.get(r.request_type) ?? 0) + 1);
    let topCategory = "—";
    let topCount = 0;
    for (const [k, v] of byCategory) if (v > topCount) { topCategory = k; topCount = v; }
    const topThree = [...requests].sort((a, b) => b.vote_count - a.vote_count).slice(0, 3);
    return { total, topCategory, topThree };
  }, [requests]);

  if (!session.isAdmin) {
    return (
      <PortalShell>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <div className="label-eyebrow">◇ Admin · Staff Only</div>
          <h1 className="mt-4 display-serif text-4xl text-obsidian">Restricted</h1>
          <p className="mt-3 text-obsidian/60">This area is for Cleard staff.</p>
          <Link to="/portal" className="mt-6 inline-block text-sm hover:text-accent">← Back to portal</Link>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link to="/admin" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian">
          <ArrowLeft className="h-3 w-3" /> Back to Admin
        </Link>

        <div className="mt-6 border-b hairline pb-6">
          <div className="label-eyebrow text-obsidian/55">◇ Admin · Product Intelligence</div>
          <h1 className="mt-2 display-serif text-4xl text-obsidian">Feature <em>Requests</em></h1>
          <p className="mt-2 text-sm text-obsidian/60">A live roadmap driven directly by GC demand.</p>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Total Requests" value={String(stats.total)} />
          <StatCard label="Most Requested Category" value={stats.topCategory} />
          <div className="border hairline bg-card p-5 rounded-[3px]">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Top 3 Most Upvoted</div>
            <ol className="mt-3 space-y-2">
              {stats.topThree.length === 0 ? (
                <li className="text-sm text-obsidian/50">—</li>
              ) : stats.topThree.map((r, i) => (
                <li key={r.id} className="flex items-baseline gap-2 text-sm">
                  <span className="font-mono text-[10px] text-obsidian/45">{i + 1}.</span>
                  <span className="flex-1 truncate text-obsidian/85">{r.title}</span>
                  <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-obsidian">
                    <ChevronUp className="h-3 w-3" /> {r.vote_count}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* List */}
        <div className="mt-8 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-obsidian/55">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="border hairline bg-card rounded-[3px] py-16 text-center text-sm text-obsidian/55">
              No requests yet.
            </div>
          ) : (
            requests.map((r) => <AdminRow key={r.id} req={r} onChanged={() => qc.invalidateQueries({ queryKey: ["feature-requests"] })} />)
          )}
        </div>
      </div>
    </PortalShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border hairline bg-card p-5 rounded-[3px]">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">{label}</div>
      <div className="mt-3 display-serif text-3xl text-obsidian truncate">{value}</div>
    </div>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function AdminRow({ req, onChanged }: { req: FeatureRequestWithMeta; onChanged: () => void }) {
  const [status, setStatus] = useState<FRStatus>(req.status);
  const [internal, setInternal] = useState(req.internal_note ?? "");
  const [publicResponse, setPublicResponse] = useState(req.public_response ?? "");
  const [pinned, setPinned] = useState(req.pinned);
  const [saving, setSaving] = useState(false);
  const notifyShipped = useServerFn(notifyShippedFn);

  const notifyMut = useMutation({
    mutationFn: (requestId: string) => notifyShipped({ data: { requestId } }),
  });

  const dirty =
    status !== req.status ||
    (internal || "") !== (req.internal_note ?? "") ||
    (publicResponse || "") !== (req.public_response ?? "") ||
    pinned !== req.pinned;

  async function save() {
    setSaving(true);
    try {
      const wasShipped = req.status === "shipped";
      await updateRequestAdmin(req.id, {
        status,
        internal_note: internal || null,
        public_response: publicResponse || null,
        pinned,
      });
      toast.success("Saved");
      if (status === "shipped" && !wasShipped && !req.shipped_notified_at) {
        try {
          const res = await notifyMut.mutateAsync(req.id);
          if (res?.notified) toast.success(`Notified ${res.notified} ${res.notified === 1 ? "person" : "people"}`);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Notify failed");
        }
      }
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const tone = STATUS_TONE[req.status];

  return (
    <div className={`border hairline bg-card rounded-[3px] p-5 ${req.pinned ? "ring-1 ring-oxblood/40" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {req.pinned && (
              <span className="inline-flex items-center gap-1 rounded-[3px] border border-oxblood/40 bg-oxblood/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-oxblood">
                <Pin className="h-3 w-3" /> Pinned
              </span>
            )}
            <span className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${tone}`}>
              {STATUS_LABEL[req.status]}
            </span>
            <Badge variant="outline" className="rounded-[3px] font-normal text-[10px]">{req.request_type}</Badge>
            <Badge variant="outline" className="rounded-[3px] font-normal text-[10px]">Priority · {req.priority}</Badge>
          </div>
          <h3 className="mt-2 display-serif text-xl text-obsidian">{req.title}</h3>
          <p className="mt-2 text-sm text-obsidian/70 whitespace-pre-wrap">{req.description}</p>
          <div className="mt-3 rounded-[3px] border-l-2 border-obsidian/20 bg-secondary/40 px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Workflow Impact</div>
            <p className="mt-1 text-sm text-obsidian/80 whitespace-pre-wrap">{req.workflow_impact}</p>
          </div>
          {req.areas?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {req.areas.map((a) => (
                <span key={a} className="rounded-[3px] border hairline bg-secondary/60 px-2 py-0.5 text-[11px] text-obsidian/65">
                  {a}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">
            Submitted {fmtDate(req.created_at)} · {req.vote_count} {req.vote_count === 1 ? "vote" : "votes"}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1 rounded-[3px] border hairline bg-secondary/40 px-3 py-2">
          <ChevronUp className="h-4 w-4 text-obsidian/60" />
          <span className="font-mono text-lg tabular-nums text-obsidian">{req.vote_count}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
            Status
          </Label>
          <Select value={status} onValueChange={(v) => setStatus(v as FRStatus)}>
            <SelectTrigger className="rounded-[3px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPinned((p) => !p)}
            className="rounded-[3px]"
          >
            {pinned ? <><PinOff className="mr-2 h-4 w-4" /> Unpin</> : <><Pin className="mr-2 h-4 w-4" /> Pin to top</>}
          </Button>
        </div>
        <div className="md:col-span-2">
          <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
            Internal Note <span className="text-obsidian/40 normal-case">(staff only)</span>
          </Label>
          <Textarea
            value={internal}
            onChange={(e) => setInternal(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Not visible to the GC"
            className="rounded-[3px]"
          />
        </div>
        <div className="md:col-span-2">
          <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
            Public Response <span className="text-obsidian/40 normal-case">(visible to submitter & upvoters)</span>
          </Label>
          <Textarea
            value={publicResponse}
            onChange={(e) => setPublicResponse(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Post an update to the submitter and everyone who voted."
            className="rounded-[3px]"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="dark" onClick={save} disabled={!dirty || saving} className="rounded-[3px]">
          <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
