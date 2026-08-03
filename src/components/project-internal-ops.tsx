import { useEffect, useState } from "react";
import { Flag, ShieldAlert, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CLEARED_STAFF, getOps, setAssignee, setPriority, setEscalated, getStaffById, type Priority,
} from "@/lib/staff-ops";
import { addStaffNote, listStaffNotes, type StaffNote } from "@/lib/staff-notes";
import type { Project } from "@/lib/projects-data";

const PRIORITY_LABEL: Record<Priority, string> = { normal: "Normal", high: "High", urgent: "Urgent" };
const PRIORITY_TONE: Record<Priority, string> = {
  normal: "border-obsidian/15 bg-paper-warm text-obsidian/70",
  high: "border-amber-500/40 bg-amber-50 text-amber-800",
  urgent: "border-red-500/40 bg-red-50 text-red-800",
};

export function ProjectInternalOps({ project }: { project: Project }) {
  const [ops, setOps] = useState(() => getOps(project.id));
  const [notes, setNotes] = useState<StaffNote[]>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    const refresh = () => setOps(getOps(project.id));
    const refreshNotes = () => setNotes(listStaffNotes(project.id));
    refresh();
    refreshNotes();
    window.addEventListener("staff-ops:changed", refresh);
    window.addEventListener("staff-notes:changed", refreshNotes);
    return () => {
      window.removeEventListener("staff-ops:changed", refresh);
      window.removeEventListener("staff-notes:changed", refreshNotes);
    };
  }, [project.id]);

  if (!ops) return null;
  const assignee = getStaffById(ops.assigneeId);

  function postNote() {
    if (!body.trim()) return;
    const author = localStorage.getItem("cleared_demo_user") || "Team";
    addStaffNote(project.id, author, body);
    setBody("");
  }

  return (
    <div className="space-y-6">
      <div className="border border-obsidian/12 bg-white rounded-[3px]">
        <div className="flex items-center gap-2 border-b border-obsidian/10 bg-paper-warm px-4 py-2.5">
          <Lock className="h-3.5 w-3.5 text-obsidian/60" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/70">Internal Ops — Staff Only</span>
        </div>
        <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-3">
          <div>
            <div className="label-eyebrow text-obsidian/50">Assigned To</div>
            <Select
              value={ops.assigneeId}
              onValueChange={(v) => setAssignee(project.id, v, project.name)}
            >
              <SelectTrigger className="mt-1.5 h-11 rounded-[3px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLEARED_STAFF.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignee && <div className="mt-1 text-[11px] text-obsidian/50">{assignee.email}</div>}
          </div>

          <div>
            <div className="label-eyebrow text-obsidian/50">Priority</div>
            <Select
              value={ops.priority}
              onValueChange={(v) => setPriority(project.id, v as Priority, project.name)}
            >
              <SelectTrigger className="mt-1.5 h-11 rounded-[3px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <span className={`mt-1.5 inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] rounded-[3px] ${PRIORITY_TONE[ops.priority]}`}>
              {PRIORITY_LABEL[ops.priority]}
            </span>
          </div>

          <div>
            <div className="label-eyebrow text-obsidian/50">Escalation</div>
            <div className="mt-2 flex min-h-11 items-center gap-3">
              <Switch
                checked={ops.escalated}
                onCheckedChange={(checked) => {
                  setEscalated(project.id, checked, project.name);
                  if (checked) toast.success("Senior staff notified", { description: `${project.name} flagged as escalated.` });
                }}
              />
              {ops.escalated ? (
                <span className="inline-flex items-center gap-1.5 border border-red-500/40 bg-red-50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-red-800 rounded-[3px]">
                  <Flag className="h-3 w-3" /> Escalated
                </span>
              ) : (
                <span className="text-xs text-obsidian/45">Not escalated</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-obsidian/12 bg-white rounded-[3px]">
        <div className="flex items-center gap-2 border-b border-obsidian/10 bg-paper-warm px-4 py-2.5">
          <ShieldAlert className="h-3.5 w-3.5 text-obsidian/60" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/70">Internal Notes — Not Visible To The GC</span>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add an internal note for the ops team…"
              className="min-h-[44px] rounded-[3px]"
            />
            <Button onClick={postNote} className="h-11 shrink-0 rounded-[3px]" variant="dark">
              <Send className="mr-1.5 h-3.5 w-3.5" /> Post
            </Button>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-obsidian/45">No internal notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="border border-obsidian/10 bg-paper-warm/50 p-3 rounded-[3px]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-obsidian">{n.author}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-obsidian/45">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-obsidian/80 whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
