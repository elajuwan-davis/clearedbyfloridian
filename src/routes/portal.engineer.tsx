import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Camera, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageShell, Segmented } from "@/components/ui-kit";
import {
  ENGINEER_REQUESTS,
  loadBids,
  saveBids,
  outcomeChipClass,
  outcomeLabel,
  statusChipClass,
  statusLabel,
  type EngineerBid,
  type EngineerRequest,
  type EngineerRequestStatus,
} from "@/lib/engineer-queue";

export const Route = createFileRoute("/portal/engineer")({
  head: () => ({
    meta: [
      { title: "Engineer Portal — Cleared" },
      {
        name: "description",
        content: "Blind queue of Engineer's Letter requests, with fee submission and bid history.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EngineerPortalPage,
});

const COPPER = "#9C6B3F";

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-[3px] border px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.14em] ${className}`}
    >
      {children}
    </span>
  );
}

function EngineerPortalPage() {
  const [tab, setTab] = useState<"queue" | "bids">("queue");
  const [openId, setOpenId] = useState<string | null>(null);
  const [bids, setBids] = useState<EngineerBid[]>([]);

  useEffect(() => {
    setBids(loadBids());
  }, []);

  const requests = useMemo(
    () =>
      ENGINEER_REQUESTS.map((r) => ({
        ...r,
        status: (bids.some((b) => b.requestId === r.id) && r.status === "open"
          ? "bid_submitted"
          : r.status) as EngineerRequestStatus,
      })),
    [bids],
  );

  const active = openId ? requests.find((r) => r.id === openId) : null;

  function submitBid(bid: EngineerBid) {
    const next = [bid, ...bids.filter((b) => b.requestId !== bid.requestId)];
    setBids(next);
    saveBids(next);
  }

  if (active) {
    return (
      <RequestDetail
        request={active}
        bid={bids.find((b) => b.requestId === active.id) ?? null}
        onBack={() => setOpenId(null)}
        onSubmit={submitBid}
      />
    );
  }

  return (
    <PageShell
      title="Engineer Portal"
      meta={
        <span className="text-xs text-black/55">
          {requests.filter((r) => r.status === "open").length} open requests
        </span>
      }
      toolbar={
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "queue", label: "Open Requests", count: requests.length },
            { value: "bids", label: "My Bids", count: bids.length },
          ]}
        />
      }
    >
      {tab === "queue" ? (
        <div className="rounded-[3px] border border-black/12 bg-white">
          <div className="border-b border-black/10 px-5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
              Blind request queue — party names and contact details are withheld
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-[10px] uppercase tracking-[0.14em] text-black/45">
                  <th className="px-5 py-3 font-semibold">Request</th>
                  <th className="px-5 py-3 font-semibold">Inspections needed</th>
                  <th className="px-5 py-3 font-semibold">Trade / permit</th>
                  <th className="px-5 py-3 font-semibold">Jurisdiction</th>
                  <th className="px-5 py-3 font-semibold">Photos</th>
                  <th className="px-5 py-3 font-semibold">Submitted</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-black/8 ${i % 2 ? "bg-black/[0.015]" : ""}`}
                  >
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-black">{r.id}</td>
                    <td className="px-5 py-4 text-black/80">{r.inspections.join(", ")}</td>
                    <td className="px-5 py-4 text-black/70">
                      {r.trade}
                      <span className="block text-xs text-black/45">{r.permitType}</span>
                    </td>
                    <td className="px-5 py-4 text-black/70">
                      {r.county} County
                      <span className="block text-xs text-black/45">{r.city}</span>
                    </td>
                    <td className="px-5 py-4 text-black/70">
                      <span className="inline-flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5" style={{ color: COPPER }} />
                        {r.photoCount}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-black/60">{r.submittedAt}</td>
                    <td className="px-5 py-4">
                      <Chip className={statusChipClass(r.status)}>{statusLabel(r.status)}</Chip>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => setOpenId(r.id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-[3px] border border-black/12 bg-white">
          {bids.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-black/55">
              You haven't submitted any bids yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-[10px] uppercase tracking-[0.14em] text-black/45">
                    <th className="px-5 py-3 font-semibold">Request</th>
                    <th className="px-5 py-3 font-semibold">Fee</th>
                    <th className="px-5 py-3 font-semibold">Turnaround</th>
                    <th className="px-5 py-3 font-semibold">Submitted</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b, i) => (
                    <tr
                      key={b.requestId}
                      className={`border-b border-black/8 ${i % 2 ? "bg-black/[0.015]" : ""}`}
                    >
                      <td className="px-5 py-4 font-mono text-xs font-semibold">{b.requestId}</td>
                      <td className="px-5 py-4 text-black/80">${b.fee.toLocaleString()}</td>
                      <td className="px-5 py-4 text-black/70">{b.turnaround || "—"}</td>
                      <td className="px-5 py-4 text-black/60">{b.submittedAt}</td>
                      <td className="px-5 py-4">
                        <Chip className={outcomeChipClass(b.outcome)}>
                          {outcomeLabel(b.outcome)}
                        </Chip>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenId(b.requestId)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

function RequestDetail({
  request,
  bid,
  onBack,
  onSubmit,
}: {
  request: EngineerRequest;
  bid: EngineerBid | null;
  onBack: () => void;
  onSubmit: (bid: EngineerBid) => void;
}) {
  const [fee, setFee] = useState("");
  const [turnaround, setTurnaround] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = Boolean(bid);

  async function handleSubmit() {
    const amount = Number(fee.replace(/[^0-9.]/g, ""));
    if (!amount || amount <= 0) {
      toast.error("Enter your fee amount.");
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    onSubmit({
      requestId: request.id,
      fee: amount,
      turnaround: turnaround.trim(),
      notes: notes.trim(),
      submittedAt: new Date().toISOString().slice(0, 10),
      outcome: "pending",
    });
    setBusy(false);
    toast.success("Bid submitted.");
  }

  return (
    <PageShell
      title={`Request ${request.id}`}
      meta={<Chip className={statusChipClass(locked ? "bid_submitted" : request.status)}>
        {statusLabel(locked ? "bid_submitted" : request.status)}
      </Chip>}
      actions={
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to queue
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-[3px] border border-black/12 bg-white p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
              Scope of work
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-black/80">{request.scope}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/45">
                  Trade
                </p>
                <p className="mt-1 text-black/80">{request.trade}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/45">
                  Permit type
                </p>
                <p className="mt-1 text-black/80">{request.permitType}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/45">
                  Jurisdiction
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-black/80">
                  <MapPin className="h-3.5 w-3.5" style={{ color: COPPER }} />
                  {request.city}, {request.county} County
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[3px] border border-black/12 bg-white p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
              Inspections to cover
            </h2>
            <ul className="mt-3 space-y-2">
              {request.inspections.map((i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-black/80">
                  <CheckCircle2 className="h-4 w-4" style={{ color: COPPER }} />
                  {i}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[3px] border border-black/12 bg-white p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
              Inspection photos ({request.photoCount})
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: request.photoCount }).map((_, i) => (
                <div
                  key={i}
                  className="flex aspect-[4/3] items-center justify-center rounded-[3px] border border-black/10 bg-black/[0.04]"
                >
                  <Camera className="h-4 w-4 text-black/25" />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-black/45">
              Photo set is redacted of any address or party identifiers.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 h-fit rounded-[3px] border border-black/12 bg-white p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/45">
            Submit my fee
          </h2>
          {locked ? (
            <div className="mt-4 space-y-3">
              <Chip className={outcomeChipClass(bid!.outcome)}>{outcomeLabel(bid!.outcome)}</Chip>
              <p className="text-sm text-black/80">
                Your bid has been received. Cleared will be in touch.
              </p>
              <dl className="space-y-2 border-t border-black/10 pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-black/55">Fee</dt>
                  <dd className="font-semibold">${bid!.fee.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-black/55">Turnaround</dt>
                  <dd>{bid!.turnaround || "—"}</dd>
                </div>
                {bid!.notes ? <p className="text-black/70">{bid!.notes}</p> : null}
              </dl>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="eng-fee">Fee amount ($)</Label>
                <Input
                  id="eng-fee"
                  inputMode="decimal"
                  placeholder="1,250"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="eng-turn">Availability / turnaround (optional)</Label>
                <Input
                  id="eng-turn"
                  placeholder="Site visit within 3 business days"
                  value={turnaround}
                  onChange={(e) => setTurnaround(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="eng-notes">Notes (optional)</Label>
                <Textarea
                  id="eng-notes"
                  rows={4}
                  placeholder="Assumptions, exclusions, or additional documentation needed."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button
                className="w-full text-white"
                style={{ backgroundColor: COPPER }}
                disabled={busy}
                onClick={handleSubmit}
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Bid
              </Button>
            </div>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
