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
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  PageShell,
  MetricRow,
  StatTile,
  Segmented,
  SearchInput,
  TableShell,
  StatusChip,
  EmptyState,
} from "@/components/ui-kit";
import type { MetricTone } from "@/components/ui-kit";

export const Route = createFileRoute("/admin/builders")({
  head: () => ({
    meta: [
      { title: "Admin · Builders — Cleard" },
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

const vTone: Record<string, MetricTone> = {
  verified: "success",
  signed: "success",
  pending: "warning",
  sent: "warning",
  expired: "danger",
  missing: "danger",
  not_sent: "neutral",
};

const vIcon: Record<string, typeof CheckCircle2> = {
  verified: CheckCircle2,
  signed: CheckCircle2,
  pending: Clock,
  sent: Clock,
  expired: XCircle,
  missing: XCircle,
  not_sent: XCircle,
};

function VBadge({ status, label }: { status: string; label: string }) {
  const Icon = vIcon[status];
  return (
    <StatusChip tone={vTone[status]}>
      <Icon className="size-3" strokeWidth={1.75} />
      {label}
    </StatusChip>
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
      <PageShell
        crumbs={[{ label: "Admin" }]}
        title="Builders"
        meta="General contractors admitted to Cleard"
        toolbar={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search firm, principal, license #" className="w-64" />
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All" },
                { value: "verified", label: "Fully verified" },
                { value: "incomplete", label: "Incomplete" },
                { value: "uninvited", label: "Not invited" },
              ]}
            />
            <span className="ml-auto hidden text-[11.5px] text-muted-foreground sm:inline">{rows.length} shown</span>
          </>
        }
      >
        <MetricRow className="mb-3 sm:grid-cols-4 lg:grid-cols-4">
          <StatTile label="Firms on file" value={stats.total} />
          <StatTile label="Fully verified" value={stats.verified} tone="success" />
          <StatTile label="Incomplete" value={stats.incomplete} tone="danger" />
          <StatTile label="LPOA pending" value={stats.lpoaPending} tone="warning" />
        </MetricRow>

        {rows.length === 0 ? (
          <EmptyState title="No builders match" />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th>Firm</th>
                <th>License</th>
                <th>COI</th>
                <th>LPOA</th>
                <th>Active</th>
                <th className="w-[1%]" />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const allVerified =
                  b.license.status === "verified" &&
                  b.coi.status === "verified" &&
                  b.lpoa.status === "signed";
                return (
                  <tr key={b.id}>
                    <td className="min-w-0">
                      <div className="flex items-start gap-2.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/[0.06] text-muted-foreground">
                          <HardHat className="size-3.5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[12.5px] font-medium">{b.firm}</div>
                          <div className="truncate text-[11.5px] text-muted-foreground">
                            {b.principal} · {b.city}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">{b.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <VBadge status={b.license.status} label={b.license.status === "verified" ? "Verified" : b.license.status} />
                      <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">{b.license.number}</div>
                      <div className="text-[10.5px] text-muted-foreground/70">Exp {b.license.expires}</div>
                    </td>
                    <td>
                      <VBadge status={b.coi.status} label={b.coi.status === "verified" ? "Verified" : b.coi.status} />
                      <div className="mt-1 text-[11px] text-muted-foreground">{b.coi.carrier}</div>
                      <div className="text-[10.5px] text-muted-foreground/70">Exp {b.coi.expires}</div>
                    </td>
                    <td>
                      <VBadge
                        status={b.lpoa.status}
                        label={b.lpoa.status === "signed" ? "Signed" : b.lpoa.status === "sent" ? "Sent" : "Not sent"}
                      />
                      {b.lpoa.signedOn && (
                        <div className="mt-1 text-[10.5px] text-muted-foreground/70">{b.lpoa.signedOn}</div>
                      )}
                    </td>
                    <td className="text-[13px] font-medium tabular-nums">{b.activeProjects}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={allVerified}
                          onClick={() => setVerifying(b)}
                          className="p-btn p-btn-ghost p-btn-sm"
                        >
                          <ShieldCheck className="size-3.5" strokeWidth={1.75} />
                          {allVerified ? "All verified" : "Verify"}
                        </button>
                        <button type="button" onClick={() => setInviting(b)} className="p-btn p-btn-primary p-btn-sm">
                          <Mail className="size-3.5" strokeWidth={1.75} />
                          {b.invited ? "Re-invite" : "Invite"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </PageShell>

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
              Confirm Florida DBPR license, current COI, and executed Limited Power of Attorney
              before this firm can submit under FL 553.791.
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
              Onboarding
            </p>
            <DialogTitle className="display-serif text-3xl text-obsidian">
              Invite <em className="italic text-oxblood">{inviting?.firm}</em>
            </DialogTitle>
            <DialogDescription className="text-obsidian/65">
              Sends a credentialed onboarding link so this firm can verify their license, upload
              their COI, and sign an LPOA before filing under FL 553.791.
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
                placeholder="Reference the project tied to this invitation"
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
