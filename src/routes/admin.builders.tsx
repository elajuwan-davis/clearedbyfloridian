import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HardHat,
  ShieldCheck,
  FileCheck2,
  PenLine,
  Mail,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/builders")({
  head: () => ({
    meta: [
      { title: "Admin · Builders — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuildersPage,
});

type VStatus = "verified" | "pending" | "expired" | "missing";
type Builder = {
  id: string;
  firm: string;
  principal: string;
  email: string;
  city: string;
  activeProjects: number;
  license: { status: VStatus; number: string; expires: string };
  coi: { status: VStatus; carrier: string; expires: string };
  lpoa: { status: "signed" | "sent" | "not_sent"; signedOn?: string };
  invited: boolean;
};

const BUILDERS: Builder[] = [
  {
    id: "b1",
    firm: "Coastline Builders Group",
    principal: "Marcus Reyes",
    email: "mreyes@coastlinebg.com",
    city: "Palm Beach",
    activeProjects: 4,
    license: { status: "verified", number: "CGC1521884", expires: "2027-08-31" },
    coi: { status: "verified", carrier: "Travelers", expires: "2026-11-04" },
    lpoa: { status: "signed", signedOn: "2026-04-12" },
    invited: true,
  },
  {
    id: "b2",
    firm: "Atelier Marin Construction",
    principal: "Eloise Marin",
    email: "eloise@ateliermarin.com",
    city: "Jupiter Island",
    activeProjects: 2,
    license: { status: "verified", number: "CGC1518902", expires: "2027-02-28" },
    coi: { status: "pending", carrier: "Chubb", expires: "2026-06-30" },
    lpoa: { status: "signed", signedOn: "2026-05-03" },
    invited: true,
  },
  {
    id: "b3",
    firm: "Hawthorne & Vale Custom Homes",
    principal: "Daniel Hawthorne",
    email: "dh@hawthornevale.com",
    city: "Vero Beach",
    activeProjects: 3,
    license: { status: "verified", number: "CGC1509441", expires: "2028-01-15" },
    coi: { status: "verified", carrier: "AIG Private Client", expires: "2027-01-20" },
    lpoa: { status: "sent" },
    invited: true,
  },
  {
    id: "b4",
    firm: "Banyan Ridge Construction",
    principal: "Priya Patel",
    email: "ppatel@banyanridge.com",
    city: "Stuart",
    activeProjects: 1,
    license: { status: "expired", number: "CGC1502233", expires: "2026-03-01" },
    coi: { status: "verified", carrier: "Cincinnati", expires: "2027-04-10" },
    lpoa: { status: "not_sent" },
    invited: true,
  },
  {
    id: "b5",
    firm: "Old Cypress Builders",
    principal: "Jonathan Reeve",
    email: "jreeve@oldcypress.com",
    city: "Hobe Sound",
    activeProjects: 0,
    license: { status: "verified", number: "CGC1531208", expires: "2027-09-09" },
    coi: { status: "missing", carrier: "—", expires: "—" },
    lpoa: { status: "not_sent" },
    invited: false,
  },
  {
    id: "b6",
    firm: "Seacrest Estates Group",
    principal: "Ana Mendes",
    email: "ana@seacrestestates.com",
    city: "Palm Beach Gardens",
    activeProjects: 2,
    license: { status: "verified", number: "CGC1527760", expires: "2027-12-01" },
    coi: { status: "verified", carrier: "Liberty Mutual", expires: "2026-12-12" },
    lpoa: { status: "signed", signedOn: "2026-02-22" },
    invited: true,
  },
];

const tone = {
  ok: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
  warn: "bg-oxblood/10 text-oxblood border-oxblood/30",
  amber: "bg-amber-500/10 text-amber-700 border-amber-600/30",
  neutral: "bg-paper-warm text-obsidian/70 border-obsidian/15",
} as const;

function VBadge({ status, label }: { status: VStatus | "signed" | "sent" | "not_sent"; label: string }) {
  const map: Record<string, { cls: string; Icon: typeof CheckCircle2 }> = {
    verified: { cls: tone.ok, Icon: CheckCircle2 },
    signed: { cls: tone.ok, Icon: CheckCircle2 },
    pending: { cls: tone.amber, Icon: Clock },
    sent: { cls: tone.amber, Icon: Clock },
    expired: { cls: tone.warn, Icon: XCircle },
    missing: { cls: tone.warn, Icon: XCircle },
    not_sent: { cls: tone.neutral, Icon: XCircle },
  };
  const { cls, Icon } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-0.5 text-[11px] uppercase tracking-[0.08em] ${cls}`}
    >
      <Icon className="size-3" strokeWidth={1.75} />
      {label}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-sky/20 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-sky/90">
      {children}
    </th>
  );
}

function BuildersPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "incomplete" | "uninvited">("all");
  const [verifying, setVerifying] = useState<Builder | null>(null);
  const [inviting, setInviting] = useState<Builder | null>(null);

  const stats = useMemo(() => {
    const total = BUILDERS.length;
    const verified = BUILDERS.filter(
      (b) => b.license.status === "verified" && b.coi.status === "verified" && b.lpoa.status === "signed",
    ).length;
    const incomplete = total - verified;
    const lpoaPending = BUILDERS.filter((b) => b.lpoa.status !== "signed").length;
    return { total, verified, incomplete, lpoaPending };
  }, []);

  const rows = useMemo(() => {
    return BUILDERS.filter((b) => {
      if (q) {
        const hay = `${b.firm} ${b.principal} ${b.email} ${b.license.number}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (filter === "verified")
        return b.license.status === "verified" && b.coi.status === "verified" && b.lpoa.status === "signed";
      if (filter === "incomplete")
        return !(b.license.status === "verified" && b.coi.status === "verified" && b.lpoa.status === "signed");
      if (filter === "uninvited") return !b.invited;
      return true;
    });
  }, [q, filter]);

  return (
    <PortalShell>
      <div className="space-y-10">
        <header className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-obsidian/55">
            Admin · Network
          </p>
          <h1 className="display-serif text-5xl text-obsidian">
            Builders <em className="italic text-oxblood">on file</em>
          </h1>
          <p className="max-w-2xl text-obsidian/65">
            Every general contractor admitted to Cleared. Verify state license, current COI, and executed
            LPOA before a firm submits a project for private-provider review.
          </p>
        </header>

        {/* stat cards */}
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Firms on file", val: stats.total },
            { label: "Fully verified", val: stats.verified, accent: "sky" },
            { label: "Incomplete", val: stats.incomplete, accent: "oxblood" },
            { label: "LPOA pending", val: stats.lpoaPending, accent: "oxblood" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[3px] border border-obsidian/90 bg-obsidian p-6 text-paper-warm"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-warm/60">
                {s.label}
              </p>
              <p
                className={`display-serif mt-3 text-5xl ${
                  s.accent === "sky" ? "text-sky" : s.accent === "oxblood" ? "text-oxblood" : ""
                }`}
              >
                {s.val}
              </p>
            </div>
          ))}
        </section>

        {/* filters */}
        <section className="flex flex-wrap items-center gap-3 border-y border-obsidian/15 py-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-obsidian/40"
              strokeWidth={1.75}
            />
            <Input
              placeholder="Search firm, principal, license #"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 rounded-[3px] border-obsidian/20 bg-paper-warm pl-9 text-sm"
            />
          </div>
          <div className="flex gap-1">
            {(
              [
                ["all", "All"],
                ["verified", "Fully verified"],
                ["incomplete", "Incomplete"],
                ["uninvited", "Not invited"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-[3px] border px-3 py-2 text-xs uppercase tracking-[0.12em] transition ${
                  filter === k
                    ? "border-obsidian bg-obsidian text-paper-warm"
                    : "border-obsidian/20 bg-transparent text-obsidian/70 hover:bg-paper-warm"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </section>

        {/* table */}
        <section className="overflow-hidden rounded-[3px] border border-obsidian/15">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-obsidian">
              <tr>
                <Th>Firm</Th>
                <Th>License</Th>
                <Th>COI</Th>
                <Th>LPOA</Th>
                <Th>Active</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const allVerified =
                  b.license.status === "verified" &&
                  b.coi.status === "verified" &&
                  b.lpoa.status === "signed";
                return (
                  <tr
                    key={b.id}
                    className="border-b border-obsidian/10 align-top last:border-0 hover:bg-paper-warm/60"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="grid size-9 place-items-center rounded-[3px] border border-obsidian/15 bg-paper-warm">
                          <HardHat className="size-4 text-obsidian/70" strokeWidth={1.75} />
                        </div>
                        <div>
                          <p className="font-medium text-obsidian">{b.firm}</p>
                          <p className="mt-0.5 text-xs text-obsidian/60">
                            {b.principal} · {b.city}
                          </p>
                          <p className="font-mono text-[11px] text-obsidian/45">{b.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <VBadge
                        status={b.license.status}
                        label={b.license.status === "verified" ? "Verified" : b.license.status}
                      />
                      <p className="mt-1.5 font-mono text-[11px] text-obsidian/55">
                        {b.license.number}
                      </p>
                      <p className="font-mono text-[10px] text-obsidian/40">Exp {b.license.expires}</p>
                    </td>
                    <td className="px-4 py-4">
                      <VBadge
                        status={b.coi.status}
                        label={b.coi.status === "verified" ? "Verified" : b.coi.status}
                      />
                      <p className="mt-1.5 text-[11px] text-obsidian/55">{b.coi.carrier}</p>
                      <p className="font-mono text-[10px] text-obsidian/40">Exp {b.coi.expires}</p>
                    </td>
                    <td className="px-4 py-4">
                      <VBadge
                        status={b.lpoa.status}
                        label={
                          b.lpoa.status === "signed"
                            ? "Signed"
                            : b.lpoa.status === "sent"
                              ? "Sent"
                              : "Not sent"
                        }
                      />
                      {b.lpoa.signedOn && (
                        <p className="mt-1.5 font-mono text-[10px] text-obsidian/40">
                          {b.lpoa.signedOn}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="display-serif text-2xl text-obsidian/80">
                        {b.activeProjects}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={allVerified}
                          onClick={() => setVerifying(b)}
                          className="gap-1.5 rounded-[3px] border-obsidian/25 text-xs uppercase tracking-[0.1em]"
                        >
                          <ShieldCheck className="size-3.5" strokeWidth={1.75} />
                          {allVerified ? "All verified" : "Verify"}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setInviting(b)}
                          className="gap-1.5 rounded-[3px] bg-obsidian text-xs uppercase tracking-[0.1em] text-paper-warm hover:bg-obsidian/90"
                        >
                          <Mail className="size-3.5" strokeWidth={1.75} />
                          {b.invited ? "Re-invite" : "Invite"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-obsidian/50">
                    No builders match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {/* Verify dialog */}
      <Dialog open={!!verifying} onOpenChange={(o) => !o && setVerifying(null)}>
        <DialogContent className="rounded-[3px] border-obsidian/20 bg-paper-warm">
          <DialogHeader>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-obsidian/55">
              Compliance · Verification
            </p>
            <DialogTitle className="display-serif text-3xl text-obsidian">
              Verify <em className="italic text-oxblood">{verifying?.firm}</em>
            </DialogTitle>
            <DialogDescription className="text-obsidian/65">
              Confirm Florida DBPR license, current COI naming Flōridian LLC as additional insured, and
              executed Limited Power of Attorney before this firm can submit under FL 553.791.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { Icon: FileCheck2, label: "DBPR license lookup", v: verifying?.license.status },
              { Icon: ShieldCheck, label: "Certificate of Insurance", v: verifying?.coi.status },
              { Icon: PenLine, label: "LPOA on file", v: verifying?.lpoa.status },
            ].map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between rounded-[3px] border border-obsidian/15 bg-paper px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <r.Icon className="size-4 text-obsidian/65" strokeWidth={1.75} />
                  <span className="text-sm text-obsidian">{r.label}</span>
                </div>
                <VBadge status={r.v as VStatus} label={String(r.v)} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifying(null)}
              className="rounded-[3px] border-obsidian/25"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setVerifying(null)}
              className="rounded-[3px] bg-obsidian text-paper-warm hover:bg-obsidian/90"
            >
              Mark verified
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite dialog */}
      <Dialog open={!!inviting} onOpenChange={(o) => !o && setInviting(null)}>
        <DialogContent className="rounded-[3px] border-obsidian/20 bg-paper-warm">
          <DialogHeader>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-obsidian/55">
              By invitation only
            </p>
            <DialogTitle className="display-serif text-3xl text-obsidian">
              Invite <em className="italic text-oxblood">{inviting?.firm}</em>
            </DialogTitle>
            <DialogDescription className="text-obsidian/65">
              Sends a credentialed onboarding link. Restricted to GCs on active Flōridian projects building
              $1M+ custom residential within Palm Beach County or the Treasure Coast.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-[0.12em] text-obsidian/60">Recipient</Label>
              <Input
                defaultValue={inviting?.email}
                className="rounded-[3px] border-obsidian/20 bg-paper"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-[0.12em] text-obsidian/60">
                Personal note (optional)
              </Label>
              <Input
                placeholder="Reference the Flōridian project tying this invitation"
                className="rounded-[3px] border-obsidian/20 bg-paper"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviting(null)}
              className="rounded-[3px] border-obsidian/25"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setInviting(null)}
              className="rounded-[3px] bg-obsidian text-paper-warm hover:bg-obsidian/90"
            >
              Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}
