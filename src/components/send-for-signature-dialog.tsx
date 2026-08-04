import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@/lib/projects-data";
import {
  sendForSignature,
  type RecipientRole,
  type SignatureRequest,
} from "@/lib/signature-requests";
import { EmbeddedSigningDialog } from "@/components/embedded-signing-dialog";

const ROLES: RecipientRole[] = ["Homeowner", "General Contractor", "Subcontractor", "Other"];

export function SendForSignatureDialog({
  open,
  onOpenChange,
  project,
  documentName,
  documentKey,
  documentPath,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Live permit record — project.id is the permit UUID for live permits. */
  project: Project;
  documentName: string;
  /** Logical permit document key (e.g. 'signed_application'). */
  documentKey?: string;
  /** Storage path of an uploaded file, when the caller picked a specific document. */
  documentPath?: string;
  onSent?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RecipientRole>("Homeowner");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [signing, setSigning] = useState<SignatureRequest | null>(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("Homeowner");
      setMessage("");
    }
  }, [open]);

  // Auto-suggested contacts from project client name
  const suggestions = [
    { label: `Homeowner — ${project.client}`, email: "", role: "Homeowner" as const },
    { label: `GC — ${project.client}`, email: "", role: "General Contractor" as const },
  ];

  async function submit() {
    if (!email.trim()) return;
    setBusy(true);
    try {
      const req = await sendForSignature({
        permitId: project.id,
        documentKey,
        documentPath,
        documentName,
        recipientEmail: email.trim(),
        recipientRole: role,
        message: message.trim() || undefined,
      });
      onSent?.();
      onOpenChange(false);
      // Embedded signing: keep the signer inside the portal.
      if (req.embeddedSigningUrl) setSigning(req);
      else toast.success(`Sent to ${req.recipientEmail} via SignWell.`);
    } catch (e) {
      toast.error("Could not send for signature: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {signing && (
        <EmbeddedSigningDialog
          open={!!signing}
          onOpenChange={(v) => !v && setSigning(null)}
          request={signing}
          onCompleted={() => onSent?.()}
        />
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg rounded-[3px]">
          <DialogTitle className="display-serif text-2xl text-obsidian">
            Send for Signature
          </DialogTitle>
          <DialogDescription className="text-sm text-obsidian/70">
            Sent via SignWell with embedded signing — the document opens for signature inside this
            portal. Completion is recorded only when SignWell confirms it.
          </DialogDescription>

          <div className="mt-4 space-y-4">
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                Document
              </Label>
              <div className="mt-1.5 rounded-[3px] border border-obsidian/12 bg-paper-warm px-3 py-2 text-sm text-obsidian">
                {documentName}
              </div>
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                Recipient Role
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as RecipientRole)}>
                <SelectTrigger className="mt-1.5 rounded-[3px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                Recipient Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1.5 rounded-[3px]"
              />
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setRole(s.role)}
                      className="font-mono text-[10px] uppercase tracking-[0.12em] px-2 py-1 rounded-[3px] border border-obsidian/15 text-obsidian/70 hover:border-obsidian"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                Message (optional)
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please review and sign at your convenience."
                rows={3}
                className="mt-1.5 rounded-[3px]"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-[3px]"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="dark"
              className="rounded-[3px]"
              onClick={submit}
              disabled={!email.trim() || busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send via SignWell
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
