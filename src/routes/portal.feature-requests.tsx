import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ChevronUp, Pin, Filter } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/lib/use-session";
import {
  REQUEST_TYPES,
  PLATFORM_AREAS,
  PRIORITIES,
  STATUSES,
  STATUS_LABEL,
  listRequestsWithMeta,
  createRequest,
  toggleVote,
  type FRStatus,
  type FeatureRequestWithMeta,
  type RequestType,
  type Priority,
} from "@/lib/feature-requests-api";

export const Route = createFileRoute("/portal/feature-requests")({
  head: () => ({
    meta: [
      { title: "Feature Requests — Cleard Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FeatureRequestsPage,
});

type Sort = "votes" | "recent" | "status";
type Tab = "all" | "mine";

const STATUS_TONE: Record<FRStatus, string> = {
  under_review: "border-obsidian/20 bg-secondary text-obsidian/70",
  planned: "border-sky/40 bg-sky/10 text-obsidian",
  in_progress: "border-yellow-500/40 bg-yellow-500/10 text-yellow-900",
  shipped: "border-emerald-600/40 bg-emerald-600/10 text-emerald-800",
  declined: "border-obsidian/15 bg-obsidian/5 text-obsidian/55",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function FeatureRequestsPage() {
  const qc = useQueryClient();
  const session = useSession();
  const [openForm, setOpenForm] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<Sort>("votes");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["feature-requests"],
    queryFn: listRequestsWithMeta,
  });

  const filtered = useMemo(() => {
    let rows = requests;
    if (tab === "mine" && session.userId) {
      rows = rows.filter((r) => r.created_by === session.userId);
    }
    const sorted = [...rows];
    if (sort === "votes") sorted.sort((a, b) => b.vote_count - a.vote_count);
    else if (sort === "recent") sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else sorted.sort((a, b) => a.status.localeCompare(b.status));
    // pinned always float
    sorted.sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
    return sorted;
  }, [requests, tab, sort, session.userId]);

  async function onVote(r: FeatureRequestWithMeta) {
    try {
      await toggleVote(r.id, r.user_has_voted);
      qc.invalidateQueries({ queryKey: ["feature-requests"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vote failed");
    }
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b hairline pb-6">
          <div>
            <div className="label-eyebrow text-obsidian/55">◇ Feedback</div>
            <h1 className="mt-2 display-serif text-4xl text-obsidian">
              Feature <em>Requests</em>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-obsidian/60">
              Tell us what to build next. Upvote the requests that matter to your team — the ones
              with the most support ship first.
            </p>
          </div>
          <Button onClick={() => setOpenForm(true)} variant="dark" className="rounded-[3px]">
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        </div>

        {/* Tabs + sort */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex border hairline rounded-[3px] overflow-hidden">
            {(["all", "mine"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                  tab === t ? "bg-obsidian text-paper" : "text-obsidian/60 hover:bg-secondary"
                }`}
              >
                {t === "all" ? "Public Board" : "My Requests"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-obsidian/45" />
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Sort
            </Label>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-9 w-[160px] rounded-[3px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="votes">Most Voted</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List */}
        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-obsidian/55">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="border hairline bg-card rounded-[3px] py-16 text-center">
              <p className="text-sm text-obsidian/60">
                {tab === "mine" ? "You haven't submitted any requests yet." : "No requests yet — be the first."}
              </p>
              <Button onClick={() => setOpenForm(true)} className="mt-4 rounded-[3px]" variant="outline">
                <Plus className="mr-2 h-4 w-4" /> New Request
              </Button>
            </div>
          ) : (
            filtered.map((r) => (
              <RequestCard key={r.id} req={r} onVote={onVote} />
            ))
          )}
        </div>
      </div>

      <NewRequestDialog open={openForm} onOpenChange={setOpenForm} onCreated={() => qc.invalidateQueries({ queryKey: ["feature-requests"] })} />
    </PortalShell>
  );
}

function RequestCard({ req, onVote }: { req: FeatureRequestWithMeta; onVote: (r: FeatureRequestWithMeta) => void }) {
  const tone = STATUS_TONE[req.status];
  return (
    <div className={`flex gap-4 border hairline bg-card rounded-[3px] p-5 ${req.pinned ? "ring-1 ring-oxblood/40" : ""}`}>
      {/* Vote pill */}
      <button
        onClick={() => onVote(req)}
        className={`shrink-0 flex flex-col items-center justify-center w-14 rounded-[3px] border hairline px-2 py-2 transition-colors ${
          req.user_has_voted ? "bg-obsidian text-paper border-obsidian" : "bg-background hover:bg-secondary"
        }`}
        aria-label={req.user_has_voted ? "Remove vote" : "Upvote"}
      >
        <ChevronUp className="h-4 w-4" strokeWidth={2} />
        <span className="mt-0.5 font-mono text-sm tabular-nums">{req.vote_count}</span>
      </button>

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
          <Badge variant="outline" className="rounded-[3px] font-normal text-[10px]">
            {req.request_type}
          </Badge>
        </div>
        <h3 className="mt-2 display-serif text-xl text-obsidian">{req.title}</h3>
        <p className="mt-2 text-sm text-obsidian/70 line-clamp-2 whitespace-pre-wrap">{req.description}</p>
        {req.areas?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {req.areas.map((a) => (
              <span key={a} className="rounded-[3px] border hairline bg-secondary/60 px-2 py-0.5 text-[11px] text-obsidian/65">
                {a}
              </span>
            ))}
          </div>
        )}
        {req.public_response && (
          <div className="mt-3 rounded-[3px] border-l-2 border-sky bg-sky/5 px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Cleard Response</div>
            <p className="mt-1 text-sm text-obsidian/80 whitespace-pre-wrap">{req.public_response}</p>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">
          <span>Priority · {req.priority}</span>
          <span>Submitted {fmtDate(req.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

function NewRequestDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [requestType, setRequestType] = useState<RequestType>("New Feature");
  const [title, setTitle] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [workflowImpact, setWorkflowImpact] = useState("");
  const [priority, setPriority] = useState<Priority>("Would use regularly");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setRequestType("New Feature");
    setTitle("");
    setAreas([]);
    setDescription("");
    setWorkflowImpact("");
    setPriority("Would use regularly");
  }

  function toggleArea(a: string) {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function onSubmit() {
    const t = title.trim();
    const d = description.trim();
    const w = workflowImpact.trim();
    if (!t) return toast.error("Add a title");
    if (t.length > 200) return toast.error("Title must be under 200 characters");
    if (!d) return toast.error("Describe the request");
    if (d.length > 2000) return toast.error("Description must be under 2000 characters");
    if (!w) return toast.error("Tell us how this improves your workflow");
    if (w.length > 2000) return toast.error("Workflow impact must be under 2000 characters");
    if (areas.length === 0) return toast.error("Select at least one affected area");

    setSubmitting(true);
    try {
      await createRequest({
        request_type: requestType,
        title: t,
        areas,
        description: d,
        workflow_impact: w,
        priority,
      });
      toast.success("Request submitted");
      onCreated();
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="rounded-[3px] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="label-eyebrow text-obsidian/55">◇ Feedback</div>
          <DialogTitle className="display-serif text-2xl text-obsidian">New Feature Request</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-5">
          <div>
            <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
              Request Type *
            </Label>
            <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
              <SelectTrigger className="rounded-[3px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REQUEST_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
              Feature Title *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Batch permit submission for multiple projects"
              className="rounded-[3px]"
            />
          </div>

          <div>
            <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
              Which part of the platform does this affect? *
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PLATFORM_AREAS.map((a) => (
                <label key={a} className="flex items-center gap-2 rounded-[3px] border hairline px-2 py-1.5 text-sm cursor-pointer hover:bg-secondary/40">
                  <Checkbox checked={areas.includes(a)} onCheckedChange={() => toggleArea(a)} />
                  <span className="text-obsidian/80">{a}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
              Describe the request *
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="What would you like to see?"
              className="rounded-[3px]"
            />
          </div>

          <div>
            <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
              How would this improve your workflow? *
            </Label>
            <Textarea
              value={workflowImpact}
              onChange={(e) => setWorkflowImpact(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What problem does this solve or what time does it save?"
              className="rounded-[3px]"
            />
          </div>

          <div>
            <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
              Priority *
            </Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="rounded-[3px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-[3px]">Cancel</Button>
          <Button variant="dark" onClick={onSubmit} disabled={submitting} className="rounded-[3px]">
            {submitting ? "Submitting…" : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Suppress unused import
void STATUSES;
