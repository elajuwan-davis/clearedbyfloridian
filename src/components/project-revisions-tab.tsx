import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, RotateCcw, Upload, FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { addDocFile, getDocDownloadUrl } from "@/lib/project-documents";
import { triggerNotification } from "@/lib/notifications-api";
import type { Project } from "@/lib/projects-data";
import {
  REVISION_EVT,
  REVISION_STATUS_META,
  REVISION_TONE_CLASS,
  addRevision,
  attachRevisionFile,
  deleteRevision,
  listRevisions,
  markResubmitted,
  nextRound,
  type RevisionRound,
} from "@/lib/project-revisions";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ProjectRevisionsTab({ project, internal }: { project: Project; internal: boolean }) {
  const [rows, setRows] = useState<RevisionRound[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setRows(listRevisions(project.id));
    refresh();
    window.addEventListener(REVISION_EVT, refresh);
    return () => window.removeEventListener(REVISION_EVT, refresh);
  }, [project.id]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm text-obsidian/60">
            {rows.length === 0
              ? "No correction rounds logged for this project."
              : `${rows.length} correction round${rows.length === 1 ? "" : "s"} · currently ${REVISION_STATUS_META[rows[0]!.status].label}`}
          </div>
          <p className="mt-1 text-xs text-obsidian/45">
            Cleard logs corrections returned by the building department. Upload revised plans here — we handle the
            resubmittal and re-review cycle.
          </p>
        </div>
        {internal && (
          <Button variant="dark" size="sm" className="rounded-[3px]" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Log Correction Round
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-obsidian/15 bg-white rounded-[3px] p-10 text-center text-sm text-obsidian/55">
          Nothing to revise. If the department returns corrections, the round will appear here.
        </div>
      ) : (
        <ol className="relative space-y-4 border-l border-obsidian/12 pl-5">
          {rows.map((r) => (
            <RoundCard key={r.id} row={r} project={project} internal={internal} />
          ))}
        </ol>
      )}

      <LogRoundDialog project={project} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function RoundCard({ row, project, internal }: { row: RevisionRound; project: Project; internal: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const meta = REVISION_STATUS_META[row.status];

  async function upload(file: File) {
    setBusy(true);
    try {
      const doc = await addDocFile({
        projectId: project.id,
        type: "Stamped Construction Plans",
        file,
        uploadedBy: "GC",
      });
      attachRevisionFile(row.id, { name: file.name, path: doc.path, uploadedAt: new Date().toISOString() });
      toast.success("Revised plans uploaded — Cleard has been notified.");
      void triggerNotification({
        kind: "submission_received",
        title: `Revised plans uploaded — ${project.name}`,
        body: `Round ${row.round} revisions received for ${project.address}.`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function download(path: string | null, name: string) {
    if (!path) return;
    try {
      const url = await getDocDownloadUrl(path, name);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
    } catch {
      toast.error("Could not download file");
    }
  }

  return (
    <li className="relative">
      <span className="absolute -left-[26px] top-3 h-2.5 w-2.5 rounded-full border border-obsidian/25 bg-white" />
      <div className="border border-obsidian/12 bg-white rounded-[3px]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian/10 bg-paper-warm px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian/70">
              Round {row.round}
            </span>
            <span
              className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] rounded-[3px] ${REVISION_TONE_CLASS[meta.tone]}`}
            >
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
            <span>Received {row.dateReceived}</span>
            {row.resubmittedAt && <span>Resubmitted {new Date(row.resubmittedAt).toLocaleDateString()}</span>}
            {internal && (
              <button
                type="button"
                onClick={() => deleteRevision(row.id)}
                className="text-obsidian/40 hover:text-red-600"
                aria-label="Delete round"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Department</div>
            <div className="mt-1 text-sm text-obsidian">{row.department || "—"}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
              Required Corrections
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-obsidian/80">{row.corrections || "—"}</div>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Revised Plans</div>
            {row.files.length === 0 ? (
              <div className="mt-1 text-sm text-obsidian/45">No revised plans uploaded yet.</div>
            ) : (
              <ul className="mt-2 divide-y divide-obsidian/10 border border-obsidian/10 rounded-[3px]">
                {row.files.map((f) => (
                  <li key={f.path ?? f.name} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-obsidian">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-obsidian/50" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => download(f.path, f.name)}
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/60 hover:text-obsidian"
                    >
                      <Download className="h-3 w-3" /> Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-obsidian/10 pt-3">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.dwg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-[3px]"
              disabled={busy || row.status === "resubmitted"}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-3.5 w-3.5" />
              )}
              Upload Revised Plans
            </Button>
            {internal && row.status !== "resubmitted" && (
              <Button
                variant="dark"
                size="sm"
                className="rounded-[3px]"
                onClick={() => {
                  markResubmitted(row.id);
                  toast.success(`Round ${row.round} marked resubmitted.`);
                  void triggerNotification({
                    kind: "submission_received",
                    title: `Resubmitted — ${project.name}`,
                    body: `Round ${row.round} resubmitted to ${row.department || "the building department"}.`,
                  });
                }}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Mark Resubmitted
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function LogRoundDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [dateReceived, setDateReceived] = useState(today());
  const [department, setDepartment] = useState("");
  const [corrections, setCorrections] = useState("");

  useEffect(() => {
    if (!open) return;
    setDateReceived(today());
    setDepartment(`${project.city} Building Department`);
    setCorrections("");
  }, [open, project.city]);

  function save() {
    if (!corrections.trim()) {
      toast.error("Add the required corrections");
      return;
    }
    const row = addRevision({ projectId: project.id, dateReceived, department, corrections });
    toast.success(`Round ${row.round} logged — GC notified.`);
    void triggerNotification({
      kind: "action_required",
      title: `Corrections requested — ${project.name}`,
      body: `${department || "Building department"} returned corrections (round ${row.round}).`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">Log Correction Round</DialogTitle>
        <p className="mt-1 text-xs text-obsidian/55">
          Round {nextRound(project.id)} for {project.name}. The GC is notified to upload revised plans.
        </p>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow text-obsidian/55">Date Received</Label>
              <Input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="mt-2 rounded-[3px]"
              />
            </div>
            <div>
              <Label className="eyebrow text-obsidian/55">Department</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Palm Beach County Building Division"
                className="mt-2 rounded-[3px]"
              />
            </div>
          </div>
          <div>
            <Label className="eyebrow text-obsidian/55">Required Corrections</Label>
            <textarea
              value={corrections}
              onChange={(e) => setCorrections(e.target.value)}
              rows={6}
              placeholder={"1. Provide truss engineering signed and sealed\n2. Clarify pool barrier detail on sheet A-3"}
              className="mt-2 block w-full resize-none border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-[3px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="dark" className="rounded-[3px]" onClick={save}>
            Log round
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
