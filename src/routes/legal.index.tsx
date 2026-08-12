import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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
import {
  AlertTriangle, Download, FileText, GitBranch, History, Loader2, Plus, Scale, Stamp, Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  LEGAL_EVT, LEGAL_STATUS_META, addLegalDoc, getCurrentVersionFilePath, listLegalDocs,
  listLegalDocVersions, newLegalVersion,
  type LegalDoc, type LegalDocStatus, type LegalDocType, type LegalDocVersion,
} from "@/lib/legal-docs";
import {
  createLegalDocUploadUrlFn,
  getLegalDocDownloadUrlFn,
} from "@/lib/legal-docs.functions";

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

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function putFile(signedUrl: string, file: File) {
  const put = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/pdf" },
    body: file,
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);
}

function LegalLibraryPage() {
  const getDownloadUrl = useServerFn(getLegalDocDownloadUrlFn);
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | LegalDocType>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [versionDoc, setVersionDoc] = useState<LegalDoc | null>(null);
  const [historyDoc, setHistoryDoc] = useState<LegalDoc | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      void listLegalDocs()
        .then(setDocs)
        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load legal docs"))
        .finally(() => setLoading(false));
    };
    refresh();
    window.addEventListener(LEGAL_EVT, refresh);
    return () => window.removeEventListener(LEGAL_EVT, refresh);
  }, []);

  const rows = useMemo(() => (filter === "all" ? docs : docs.filter((d) => d.type === filter)), [docs, filter]);
  const pending = docs.filter((d) => d.status === "pending_review").length;

  async function downloadCurrent(doc: LegalDoc) {
    setDownloadingId(doc.id);
    try {
      const path = await getCurrentVersionFilePath(doc);
      if (!path) throw new Error("No file on file for this document");
      const { url } = await getDownloadUrl({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

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
              <Link to="/portal/notary-queue"><Stamp className="h-3.5 w-3.5" /> Remote Notary Queue</Link>
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
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-obsidian/55">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading library…
                    </span>
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
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
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-[3px] gap-1.5"
                        disabled={downloadingId === d.id}
                        onClick={() => void downloadCurrent(d)}
                      >
                        {downloadingId === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        Download
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-[3px] gap-1.5" onClick={() => setHistoryDoc(d)}>
                        <History className="h-3.5 w-3.5" /> History
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
      <HistoryDialog doc={historyDoc} onClose={() => setHistoryDoc(null)} />
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
  const createUpload = useServerFn(createLegalDocUploadUrlFn);
  const [name, setName] = useState("");
  const [type, setType] = useState<LegalDocType>("NTBO Template");
  const [version, setVersion] = useState("v1.0");
  const [status, setStatus] = useState<LegalDocStatus>("pending_review");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setNotes("");
      setFile(null);
      setVersion("v1.0");
      setType("NTBO Template");
      setStatus("pending_review");
    }
  }, [open]);

  async function submit() {
    if (!name.trim()) return toast.error("Document name is required");
    if (!file) return toast.error("A real file is required");
    setSaving(true);
    try {
      const id = newId();
      const signed = await createUpload({
        data: { documentId: id, filename: file.name },
      });
      await putFile(signed.signedUrl, file);
      await addLegalDoc({
        id,
        name: name.trim(),
        type,
        version: version.trim() || "v1.0",
        status,
        notes: notes.trim() || undefined,
        filePath: signed.path,
        fileName: file.name,
      });
      toast.success("Document uploaded to the library");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

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
            <Label className="text-xs">File *</Label>
            <label className="mt-1.5 flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[3px] border border-obsidian/20 px-3 text-sm hover:bg-obsidian/5">
              <Upload className="h-4 w-4" />
              <span className="truncate">{file ? file.name : "Choose PDF or document…"}</span>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,.doc,.docx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea rows={3} className="mt-1.5 rounded-[3px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Recording requirements, counsel comments…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-[3px]" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="dark" className="rounded-[3px]" onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VersionDialog({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const createUpload = useServerFn(createLegalDocUploadUrlFn);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (doc) {
      const m = doc.version.match(/v(\d+)\.(\d+)/);
      setVersion(m ? `v${m[1]}.${Number(m[2]) + 1}` : doc.version);
      setNotes("");
      setFile(null);
    }
  }, [doc]);

  async function submit() {
    if (!doc) return;
    if (!file) return toast.error("A real file is required for the new version");
    setSaving(true);
    try {
      const signed = await createUpload({
        data: { documentId: doc.id, filename: file.name },
      });
      await putFile(signed.signedUrl, file);
      await newLegalVersion({
        documentId: doc.id,
        version: version.trim() || doc.version,
        notes: notes.trim() || undefined,
        filePath: signed.path,
        fileName: file.name,
      });
      toast.success(`${doc.name} bumped to ${version} — pending review`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

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
            <Label className="text-xs">File *</Label>
            <label className="mt-1.5 flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[3px] border border-obsidian/20 px-3 text-sm hover:bg-obsidian/5">
              <Upload className="h-4 w-4" />
              <span className="truncate">{file ? file.name : "Choose PDF or document…"}</span>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,.doc,.docx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div>
            <Label className="text-xs">Change summary</Label>
            <Textarea rows={3} className="mt-1.5 rounded-[3px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What changed in this revision?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-[3px]" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="dark" className="rounded-[3px]" onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const getDownloadUrl = useServerFn(getLegalDocDownloadUrlFn);
  const [versions, setVersions] = useState<LegalDocVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!doc) {
      setVersions([]);
      return;
    }
    setLoading(true);
    void listLegalDocVersions(doc.id)
      .then(setVersions)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load versions"))
      .finally(() => setLoading(false));
  }, [doc]);

  async function downloadVersion(v: LegalDocVersion) {
    setDownloadingId(v.id);
    try {
      const { url } = await getDownloadUrl({ data: { path: v.filePath } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Dialog open={doc !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-[3px]">
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl text-obsidian">Version History</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-obsidian/65">{doc?.name}</p>
        {loading ? (
          <div className="py-8 text-sm text-obsidian/50 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading versions…
          </div>
        ) : versions.length === 0 ? (
          <div className="py-8 text-sm text-obsidian/50">No versions on file.</div>
        ) : (
          <ul className="divide-y divide-obsidian/10 border border-obsidian/10 rounded-[3px]">
            {versions.map((v) => (
              <li key={v.id} className="flex items-start justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-obsidian">
                    {v.versionLabel}
                    {doc?.version === v.versionLabel && (
                      <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-emerald-700">Current</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-obsidian/55 truncate">
                    {v.fileName ?? v.filePath.split("/").pop()}
                  </div>
                  {v.changeNotes && <div className="mt-1 text-xs text-obsidian/60">{v.changeNotes}</div>}
                  <div className="mt-1 font-mono text-[10px] text-obsidian/40">
                    {v.createdAt.slice(0, 10)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-[3px] gap-1.5 shrink-0"
                  disabled={downloadingId === v.id}
                  onClick={() => void downloadVersion(v)}
                >
                  {downloadingId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Download
                </Button>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="outline" className="rounded-[3px]" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
