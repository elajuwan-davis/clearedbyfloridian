import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stamp, Loader2 } from "lucide-react";
import type { Project } from "@/lib/projects-data";
import { createNotaryRequest } from "@/lib/notary-requests";

export function RequestNotaryDialog({
  open,
  onOpenChange,
  project,
  documentName,
  docId,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
  documentName: string;
  docId?: string;
  onSubmitted?: () => void;
}) {
  const [preferredAt, setPreferredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPreferredAt("");
      setNotes("");
    }
  }, [open]);

  function submit() {
    if (!preferredAt) return;
    setBusy(true);
    try {
      const who = (typeof window !== "undefined" && window.localStorage.getItem("cleared_demo_user")) || "Client";
      createNotaryRequest({
        projectId: project.id,
        projectName: project.name,
        docId,
        documentName,
        preferredAt,
        notes: notes.trim() || undefined,
        createdBy: who,
      });
      onSubmitted?.();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">Request Notary</DialogTitle>
        <DialogDescription className="text-sm text-obsidian/70">
          Flōridian's in-house remote notary will schedule a live video session and return the
          notarized document to this project.
        </DialogDescription>


        <div className="mt-4 space-y-4">
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Document</Label>
            <div className="mt-1.5 rounded-[3px] border border-obsidian/12 bg-paper-warm px-3 py-2 text-sm text-obsidian">
              {documentName}
            </div>
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Preferred Date / Time
            </Label>
            <Input
              type="datetime-local"
              value={preferredAt}
              onChange={(e) => setPreferredAt(e.target.value)}
              className="mt-1.5 rounded-[3px]"
            />
          </div>

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Need this notarized before Friday permit submission."
              className="mt-1.5 rounded-[3px]"
            />
          </div>

          <div className="rounded-[3px] border border-obsidian/12 bg-paper-warm px-3 py-2 font-mono text-[10px] leading-relaxed uppercase tracking-[0.12em] text-obsidian/60">
            Remote online notarization performed pursuant to Florida Statute §117.265.
          </div>
        </div>


        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-[3px]" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant="dark" className="rounded-[3px]" onClick={submit} disabled={!preferredAt || busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Stamp className="h-4 w-4 mr-2" />}
            Submit Notary Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
