import { useMemo, useState } from "react";
import { VictoriaCallout } from "@/components/victoria-callout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { FilePlus2 } from "lucide-react";
import { toast } from "sonner";

const NOTICE_TYPES = [
  "Notice to Owner",
  "Mechanic's Lien",
  "Lien Release",
  "Bond Claim",
] as const;

type NoticeStatus = "filed" | "pending" | "overdue" | "not_required";

const STATUS_META: Record<NoticeStatus, { label: string; className: string }> = {
  filed: { label: "Filed", className: "border-emerald-600/30 bg-emerald-50 text-emerald-800" },
  pending: { label: "Pending", className: "border-amber-500/40 bg-amber-50 text-amber-800" },
  overdue: { label: "Overdue", className: "border-red-500/40 bg-red-50 text-red-700" },
  not_required: { label: "Not Required", className: "border-obsidian/15 bg-obsidian/[0.06] text-obsidian/60" },
};

type NoticeRow = {
  id: string;
  project: string;
  type: string;
  filed: string | null;
  deadline: string;
  status: NoticeStatus;
};

// Mock rows — replaced by live filings once the notice API is wired.
const MOCK_ROWS: NoticeRow[] = [
  {
    id: "n1",
    project: "Whitmore Residence",
    type: "Notice to Owner",
    filed: "2026-07-09",
    deadline: "2026-08-28",
    status: "filed",
  },
  {
    id: "n2",
    project: "Alders Estate",
    type: "Mechanic's Lien",
    filed: null,
    deadline: "2026-08-05",
    status: "pending",
  },
  {
    id: "n3",
    project: "Seabrook Courtyard",
    type: "Bond Claim",
    filed: null,
    deadline: "2026-07-18",
    status: "overdue",
  },
  {
    id: "n4",
    project: "Rivera Poolhouse",
    type: "Lien Release",
    filed: null,
    deadline: "2026-09-30",
    status: "not_required",
  },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function deadlineClass(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "text-obsidian/70";
  const days = Math.ceil((t - Date.now()) / 86_400_000);
  if (days < 0) return "text-red-700";
  if (days <= 7) return "text-amber-700";
  return "text-obsidian/70";
}

function StatusPill({ status }: { status: NoticeStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center rounded-[3px] border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${m.className}`}>
      {m.label}
    </span>
  );
}

/** Preliminary notices & lien rights view (Admin › Protection). */
export function AdminProtectionView() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <p className="max-w-2xl text-sm leading-relaxed text-obsidian/65">
        Protect your right to payment on every project. File notices to owner and mechanic's
        liens directly from your project record.
      </p>

      <div className="mb-4 mt-4 flex justify-end">
        <Button variant="dark" onClick={() => setOpen(true)}>
          <FilePlus2 className="mr-2 h-4 w-4" />
          File Notice
        </Button>
      </div>

      <div className="overflow-x-auto rounded-[3px] border border-obsidian/10 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-obsidian/[0.03] text-left font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Notice Type</th>
              <th className="px-4 py-3">Filed</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian/10">
            {MOCK_ROWS.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-obsidian">{r.project}</td>
                <td className="px-4 py-3 text-obsidian/70">{r.type}</td>
                <td className="px-4 py-3 font-mono text-xs text-obsidian/60">{fmtDate(r.filed)}</td>
                <td className={`px-4 py-3 font-mono text-xs ${deadlineClass(r.deadline)}`}>
                  {fmtDate(r.deadline)}
                </td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                    File Notice
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <VictoriaCallout>
        Victoria tracks notice deadlines and alerts you before your lien rights expire.
      </VictoriaCallout>

      <FileNoticeDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function FileNoticeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const projects = PROJECTS;
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [type, setType] = useState<string>(NOTICE_TYPES[0]);
  const [description, setDescription] = useState("");

  const project = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projectId, projects]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[3px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl">File Notice</DialogTitle>
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
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Notice Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-2 rounded-[3px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {NOTICE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Property Owner</Label>
            <Input className="mt-2 rounded-[3px]" defaultValue={project?.client ?? ""} key={`o-${projectId}`} />
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Contractor of Record</Label>
            <Input className="mt-2 rounded-[3px]" defaultValue="Coastline Builders Group" />
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Project Address</Label>
            <Input className="mt-2 rounded-[3px]" defaultValue={project ? fullAddress(project) : ""} key={`a-${projectId}`} />
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">Description of Work</Label>
            <Textarea
              className="mt-2 rounded-[3px]"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope of labor, services or materials furnished."
            />
          </div>
        </div>

        <DialogFooter className="flex-col items-stretch gap-2 sm:flex-col sm:items-stretch">
          <Button
            variant="dark"
            onClick={() => {
              toast.success("Notice submitted for filing.");
              onOpenChange(false);
            }}
          >
            Submit for Filing
          </Button>
          <p className="text-center text-xs text-obsidian/50">
            Notices are reviewed and filed within 1 business day.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
