import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VictoriaCallout } from "@/components/victoria-callout";
import { PROJECTS } from "@/lib/projects-data";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance — Cleard" },
      { name: "description", content: "Certificate of Insurance tracking for every subcontractor on your project." },
      { property: "og:title", content: "Compliance — Cleard" },
      { property: "og:description", content: "Certificate of Insurance tracking for every subcontractor on your project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompliancePage,
});

type CoiStatus = "active" | "expiring" | "expired" | "missing";

type SubRow = {
  id: string;
  name: string;
  trade: string;
  status: CoiStatus;
  expiration: string | null;
  coverage: string;
  updated: string;
};

const STATUS_META: Record<CoiStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "p-chip p-chip-success" },
  expiring: { label: "Expiring Soon", className: "p-chip p-chip-warning" },
  expired: { label: "Expired", className: "p-chip p-chip-danger" },
  missing: { label: "Missing", className: "p-chip p-chip-neutral" },
};

// Mock roster — replaced by live data when the compliance API is wired.
const MOCK_ROSTER: SubRow[] = [
  {
    id: "s1",
    name: "Atlantic Shell & Gunite",
    trade: "Shell / Gunite",
    status: "active",
    expiration: "2027-03-14",
    coverage: "General Liability",
    updated: "2026-07-12",
  },
  {
    id: "s2",
    name: "Coastal Electric Co.",
    trade: "Electrical",
    status: "expiring",
    expiration: "2026-08-19",
    coverage: "General Liability · Worker's Comp",
    updated: "2026-07-28",
  },
  {
    id: "s3",
    name: "Meridian Plumbing Group",
    trade: "Plumbing",
    status: "expired",
    expiration: "2026-06-30",
    coverage: "Worker's Comp",
    updated: "2026-06-02",
  },
  {
    id: "s4",
    name: "Palm Coast Pavers",
    trade: "Hardscape / Deck",
    status: "missing",
    expiration: null,
    coverage: "—",
    updated: "2026-07-05",
  },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function StatusPill({ status }: { status: CoiStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={m.className}
    >
      {m.label}
    </span>
  );
}

function CompliancePage() {
  const projects = PROJECTS;
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const [uploadFor, setUploadFor] = useState<SubRow | null>(null);

  // Mocked: the first two projects have a roster, the rest are empty.
  const roster = useMemo<SubRow[]>(() => {
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === 0) return MOCK_ROSTER;
    if (idx === 1) return MOCK_ROSTER.slice(0, 3);
    return [];
  }, [projectId, projects]);

  const counts = useMemo(() => {
    const c: Record<CoiStatus, number> = { active: 0, expiring: 0, expired: 0, missing: 0 };
    for (const r of roster) c[r.status] += 1;
    return c;
  }, [roster]);

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-obsidian/50">
            Certificate of Insurance Tracking
          </div>
          <h1 className="display-serif mt-2 text-4xl text-obsidian">Compliance</h1>
        </header>

        {/* Project selector */}
        <div className="mb-6 max-w-md">
          <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">
            Project
          </Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="mt-2 rounded-[3px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {p.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-obsidian/10 bg-obsidian/10 sm:grid-cols-4">
          {(["active", "expiring", "expired", "missing"] as CoiStatus[]).map((k) => (
            <div key={k} className="bg-white px-4 py-4">
              <div className="display-serif text-3xl text-obsidian">{counts[k]}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/50">
                {STATUS_META[k].label}
              </div>
            </div>
          ))}
        </div>

        {/* Roster */}
        <div className="mt-6 overflow-x-auto rounded-[3px] border border-obsidian/10 bg-white">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="bg-obsidian/[0.03] text-left font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60">
                <th className="px-4 py-3">Subcontractor</th>
                <th className="px-4 py-3">Trade / Scope</th>
                <th className="px-4 py-3">COI Status</th>
                <th className="px-4 py-3">Policy Expiration</th>
                <th className="px-4 py-3">Coverage Type</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian/10">
              {roster.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-obsidian">{r.name}</td>
                  <td className="px-4 py-3 text-obsidian/70">{r.trade}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-obsidian/70">{fmtDate(r.expiration)}</td>
                  <td className="px-4 py-3 text-obsidian/70">{r.coverage}</td>
                  <td className="px-4 py-3 font-mono text-xs text-obsidian/60">{fmtDate(r.updated)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => setUploadFor(r)}>
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Upload COI
                    </Button>
                  </td>
                </tr>
              ))}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-obsidian/45">
                    No subcontractors added to this project yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <VictoriaCallout>
          Victoria monitors expiration dates and alerts you 30 days before any COI lapses.
        </VictoriaCallout>
      </div>

      <UploadCoiDialog sub={uploadFor} onClose={() => setUploadFor(null)} />
    </PortalShell>
  );
}

function UploadCoiDialog({ sub, onClose }: { sub: SubRow | null; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function close() {
    setFile(null);
    onClose();
  }

  return (
    <Dialog open={Boolean(sub)} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="rounded-[3px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl">Upload COI</DialogTitle>
          <DialogDescription>
            {sub ? `Certificate of Insurance for ${sub.name}.` : ""} PDF, JPG or PNG.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-[3px] border border-dashed border-obsidian/20 bg-obsidian/[0.02] px-4 py-6 text-left hover:bg-obsidian/[0.05]"
          >
            <FileText className="h-5 w-5 text-obsidian/50" />
            <span className="text-sm text-obsidian/70">
              {file ? file.name : "Choose a file to upload"}
            </span>
          </button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            variant="dark"
            disabled={!file}
            onClick={() => {
              toast.success("COI received. Cleard will review and log the policy.");
              close();
            }}
          >
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
