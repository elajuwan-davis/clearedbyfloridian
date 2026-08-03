import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { AdminOnly } from "@/components/admin-only";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Download, FileText, GitBranch, Plus, Scale, Stamp } from "lucide-react";
import { toast } from "sonner";
import {
  LEGAL_EVT, LEGAL_STATUS_META, addLegalDoc, downloadLegalDoc, listLegalDocs,
  newLegalVersion, type LegalDoc, type LegalDocStatus, type LegalDocType,
} from "@/lib/legal-docs";

export const Route = createFileRoute("/legal/")({
  head: () => ({
    meta: [
      { title: "Legal Library — Cléared" },
      { name: "description", content: "Permit agent authorizations, NTBO templates, and platform legal documents." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <LegalLibraryPage />
    </AdminOnly>
  ),
});

const TYPES: LegalDocType[] = [
  "Permit Agent Authorization",
  "Signed PAA",
  "NTBO Template",
  "Terms of Service",
  "Privacy Policy",
  "Indemnification Agreement",
  "Contractor Authorization Letter",
];

function LegalLibraryPage() {
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [filter, setFilter] = useState<"all" | LegalDocType>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [versionDoc, setVersionDoc] = useState<LegalDoc | null>(null);

  useEffect(() => {
    const refresh = () => setDocs(listLegalDocs());
    refresh();
    window.addEventListener(LEGAL_EVT, refresh);
    return () => window.removeEventListener(LEGAL_EVT, refresh);
  }, []);

  const rows = useMemo(() => (filter === "all" ? docs : docs.filter((d) => d.type === filter)), [docs, filter]);
  const pending = docs.filter((d) => d.status === "pending_review").length;

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-8">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Internal · Legal</div>
            <h1 className="display-serif mt-2 text-4xl text-obsidian">Legal Document Library</h1>
            <p className="mt-2 text-sm text-obsidian/60">
              Permit Agent Authorizations, NTBO templates per municipality, and platform agreements.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-[3px] gap-1.5">
              <Link to="/legal/notary-queue"><Stamp className="h-3.5 w-3.5" /> Remote Notary Queue</Link>
            </Button>
            <Button size="sm" variant="dark" className="rounded-[3px] gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Upload Document
            </Button>
          </div>
        </div>

        {pending > 0 && (
          <div className="mt-6 flex items-start gap-2 border border-amber-600/30 bg-amber-50 px-4 py-3 rounded-[3px]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-800">
              DRAFT — PENDING ATTORNEY REVIEW · {pending} document{pending === 1 ? "" : "s"} awaiting counsel sign-off
            </div>
          </div>
        )}

        {/* Type filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip active={filter === "all"} onClick={() => setFilter("all")} label={`All (${docs.length})`} />
          {TYPES.map((t) => {
            const n = docs.filter((d) => d.type === t).length;
            if (!n) return null;
            return <Chip key={t} active={filter === t} onClick={() => setFilter(t)} label={`${t} (${n})`} />;
          })}
        </div>

        <div className="mt-6 overflow-x-auto border border-obsidian/12 bg-white rounded-[3px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-obsidian/10 bg-paper-warm text-left">
                <Th>Document</Th><Th>Type</Th><Th>Version</Th><Th>Last Updated</Th><Th>Status</Th><Th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-obsidian/55">No documents in this category.</td></tr>
              )}
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-obsidian/8 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-obsidian/40" />
                      <div className="min-w-0">
                        <div className="text-obsidian">{d.name}</div>
                        {d.gcName && (
                          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/55">
                            {d.gcName} · signed {d.signedAt}
                          </div>
                        )}
                        {d.notes && <div className="mt-1 text-xs text-obsidian/60">{d.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-obsidian/70">{d.type}</td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-obsidian/80">{d.version}</td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-obsidian/70">{d.updatedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] rounded-[3px] ${LEGAL_STATUS_META[d.status].className}`}>
                      {LEGAL_STATUS_META[d.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="rounded-[3px] gap-1.5" onClick={() => downloadLegalDoc(d)}>
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-[3px] gap-1.5" onClick={() => setVersionDoc(d)}>
                        <GitBranch className="h-3.5 w-3.5" /> New Version
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">
          <Scale className="h-3 w-3" /> Placeholder language — not legal advice until counsel review completes.
        </div>
      </div>

      <UploadDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <VersionDialog doc={versionDoc} onClose={() => setVersionDoc(null)} />
    </PortalShell>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] rounded-[3px] ${
        active ? "border-[#153157] bg-[#153157] text-white" : "border-obsidian/15 bg-white text-obsidian/70 hover:bg-paper-warm"
      }`}
    >
      {label}
    </button>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-obsidian/55">{children}</th>;
}

function UploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<LegalDocType>("NTBO Template");
  const [version, setVersion] = useState("v1.0");
  const [status, setStatus] = useState<LegalDocStatus>("pending_review");
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-[3px]">
        <DialogHeader><DialogTitle className="display-serif text-2xl text-obsidian">Upload Legal Document</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Document name</Label>
            <Input className="mt-1.5 rounded-[3px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="NTBO Template — Village of Tequesta" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as LegalDocType)}>
                <SelectTrigger className="mt-1.5 rounded-[3px]"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Version</Label>
              <Input className="mt-1.5 rounded-[3px]" value={version} onChange={(e) => setVersion(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LegalDocStatus)}>
              <SelectTrigger className="mt-1.5 rounded-[3px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea rows={3} className="mt-1.5 rounded-[3px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Recording requirements, counsel comments…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-[3px]" onClick={onClose}>Cancel</Button>
          <Button
            variant="dark"
            className="rounded-[3px]"
            onClick={() => {
              if (!name.trim()) return toast.error("Document name is required");
              addLegalDoc({ name: name.trim(), type, version, status, notes: notes.trim() || undefined, updatedAt: new Date().toISOString().slice(0, 10) });
              toast.success("Document added to the library");
              setName(""); setNotes("");
              onClose();
            }}
          >
            Add Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VersionDialog({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (doc) {
      const m = doc.version.match(/v(\d+)\.(\d+)/);
      setVersion(m ? `v${m[1]}.${Number(m[2]) + 1}` : doc.version);
      setNotes("");
    }
  }, [doc]);

  return (
    <Dialog open={doc !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-[3px]">
        <DialogHeader><DialogTitle className="display-serif text-2xl text-obsidian">New Version</DialogTitle></DialogHeader>
        <p className="text-sm text-obsidian/65">{doc?.name}</p>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">New version number</Label>
            <Input className="mt-1.5 rounded-[3px]" value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Change summary</Label>
            <Textarea rows={3} className="mt-1.5 rounded-[3px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What changed in this revision?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-[3px]" onClick={onClose}>Cancel</Button>
          <Button
            variant="dark"
            className="rounded-[3px]"
            onClick={() => {
              if (!doc) return;
              newLegalVersion(doc.id, version.trim() || doc.version, notes.trim() || undefined);
              toast.success(`${doc.name} bumped to ${version} — pending review`);
              onClose();
            }}
          >
            Save Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
