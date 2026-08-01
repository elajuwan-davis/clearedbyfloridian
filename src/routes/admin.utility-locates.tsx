import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { AdminSubTabs } from "@/components/admin-sub-tabs";
import { VictoriaCallout } from "@/components/victoria-callout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PROJECTS, fullAddress } from "@/lib/projects-data";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/utility-locates")({
  head: () => ({
    meta: [
      { title: "Utility Locates · Admin — Cleard" },
      { name: "description", content: "811 dig safe locate requests submitted and tracked from the project record." },
      { property: "og:title", content: "Utility Locates · Admin — Cleard" },
      { property: "og:description", content: "811 dig safe locate requests submitted and tracked from the project record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UtilityLocatesPage,
});

type LocateStatus = "submitted" | "cleared" | "action_required" | "expired";

const STATUS_META: Record<LocateStatus, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "border-sky-600/30 bg-sky-50 text-sky-800" },
  cleared: { label: "Cleared", className: "border-emerald-600/30 bg-emerald-50 text-emerald-800" },
  action_required: { label: "Action Required", className: "border-red-500/40 bg-red-50 text-red-700" },
  expired: { label: "Expired", className: "border-obsidian/15 bg-obsidian/[0.06] text-obsidian/60" },
};

const EXCAVATION_TYPES = [
  "Pool/Spa Excavation",
  "Foundation",
  "Utilities",
  "Landscaping",
  "Other",
] as const;

type LocateRow = {
  id: string;
  project: string;
  address: string;
  requested: string;
  digStart: string;
  status: LocateStatus;
  ticket: string;
};

// Mock rows — replaced by live tickets once the locate API is wired.
const MOCK_ROWS: LocateRow[] = [
  {
    id: "l1",
    project: "Whitmore Residence",
    address: "1420 Coquina Way, Jupiter, FL",
    requested: "2026-07-27",
    digStart: "2026-08-03",
    status: "submitted",
    ticket: "CLR-8114-207731",
  },
  {
    id: "l2",
    project: "Alders Estate",
    address: "88 Southshore Dr, Palm City, FL",
    requested: "2026-07-14",
    digStart: "2026-07-20",
    status: "cleared",
    ticket: "CLR-8114-204168",
  },
  {
    id: "l3",
    project: "Seabrook Courtyard",
    address: "3305 Marlin Ct, Stuart, FL",
    requested: "2026-07-06",
    digStart: "2026-07-10",
    status: "action_required",
    ticket: "CLR-8114-201942",
  },
  {
    id: "l4",
    project: "Rivera Poolhouse",
    address: "702 Almeria Rd, West Palm Beach, FL",
    requested: "2026-05-28",
    digStart: "2026-06-02",
    status: "expired",
    ticket: "CLR-8114-198520",
  },
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

/** Earliest legal excavation date: 2 full business days out (FL law). */
function minDigDate(): string {
  const d = new Date();
  let added = 0;
  while (added < 2) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d.toISOString().slice(0, 10);
}

function StatusPill({ status }: { status: LocateStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center rounded-[3px] border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${m.className}`}>
      {m.label}
    </span>
  );
}

function UtilityLocatesPage() {
  const [open, setOpen] = useState(false);

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-obsidian/50">Admin</div>
        <AdminSubTabs />

        <header className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-obsidian/50">
            811 Dig Safe Requests
          </div>
          <h1 className="display-serif mt-2 text-4xl text-obsidian">Utility Locates</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-obsidian/65">
            Florida law requires a utility locate request before any excavation. Submit your 811
            request directly from the project and track its status here.
          </p>
        </header>

        <div className="mb-4 flex justify-end">
          <Button variant="dark" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>

        <div className="overflow-x-auto rounded-[3px] border border-obsidian/10 bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="bg-obsidian/[0.03] text-left font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60">
                <th className="px-4 py-3">Project / Address</th>
                <th className="px-4 py-3">Request Date</th>
                <th className="px-4 py-3">Excavation Start</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ticket #</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian/10">
              {MOCK_ROWS.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-obsidian">{r.project}</div>
                    <div className="mt-0.5 text-xs text-obsidian/55">{r.address}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-obsidian/60">{fmtDate(r.requested)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-obsidian/70">{fmtDate(r.digStart)}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-obsidian/70">{r.ticket}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                      New Request
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <VictoriaCallout>
          Victoria automatically prompts a locate request when an excavation permit is filed.
        </VictoriaCallout>
      </div>

      <NewLocateDialog open={open} onOpenChange={setOpen} />
    </PortalShell>
  );
}

function NewLocateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const projects = PROJECTS;
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [digStart, setDigStart] = useState("");
  const [excType, setExcType] = useState<string>(EXCAVATION_TYPES[0]);
  const [digArea, setDigArea] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const project = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projectId, projects]);
  const min = minDigDate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[3px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl">New Locate Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-2 rounded-[3px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} — {p.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Project Address</Label>
            <div className="mt-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-obsidian/45" />
              <Input className="rounded-[3px]" defaultValue={project ? fullAddress(project) : ""} key={`a-${projectId}`} />
            </div>
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Excavation Start Date</Label>
            <Input
              type="date"
              min={min}
              className="mt-2 rounded-[3px]"
              value={digStart}
              onChange={(e) => setDigStart(e.target.value)}
            />
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Excavation Type</Label>
            <Select value={excType} onValueChange={setExcType}>
              <SelectTrigger className="mt-2 rounded-[3px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXCAVATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Approximate Dig Area</Label>
            <Input
              className="mt-2 rounded-[3px]"
              placeholder="e.g. rear yard, 40 ft x 25 ft east of pool deck"
              value={digArea}
              onChange={(e) => setDigArea(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">On-Site Contact</Label>
              <Input className="mt-2 rounded-[3px]" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Contact Phone</Label>
              <Input className="mt-2 rounded-[3px]" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col items-stretch gap-2 sm:flex-col sm:items-stretch">
          <Button
            variant="dark"
            disabled={!digStart}
            onClick={() => {
              toast.success("Locate request submitted. Ticket number will post here once issued.");
              onOpenChange(false);
            }}
          >
            Submit Locate Request
          </Button>
          <p className="text-center text-xs text-obsidian/50">
            Florida law requires 2 full business days notice before excavation. Locates are valid for 30 days.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
