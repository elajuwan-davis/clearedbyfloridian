import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Download,
  AlertTriangle,
  Trash2,
  FileSignature,
  CheckCircle2,
  Circle,
  Upload,
  Loader2,
  Send,
  Mail,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-session";
import {
  getHoaSubmittal,
  updateHoaSubmittal,
  deleteHoaSubmittal,
  uploadHoaFile,
  getHoaFileSignedUrl,
  checklistForType,
  isChecklistComplete,
  HOA_STATUS_LABELS,
  HOA_PROJECT_TYPE_LABELS,
  type HoaSubmittalRow,
  type HoaStatus,
  type HoaProjectType,
  type HoaChecklistItem,
} from "@/lib/hoa-submittals";
import { getHoaTemplate, displayNameFor, type HoaTemplateRow } from "@/lib/hoa-templates";
import { sendHoaSubmittal } from "@/lib/hoa-send";
import { buildAndStoreBoilerplate, buildAndStoreRemovalAgreement } from "@/lib/hoa-pdf";

export const Route = createFileRoute("/portal/hoa-submittals/$id")({
  head: () => ({
    meta: [
      { title: "HOA Submittal — Cleard by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HoaSubmittalEditor,
});

const STATUSES: HoaStatus[] = [
  "draft",
  "submitted_to_hoa",
  "pending_arc_meeting",
  "approved",
  "conditionally_approved",
  "denied",
];

const PROJECT_TYPES: HoaProjectType[] = [
  "pool_spa",
  "screen_enclosure",
  "fence",
  "driveway_patio",
  "roof",
  "paint",
  "landscaping",
  "garage_doors",
  "other",
];

function HoaSubmittalEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const session = useSession();
  const [row, setRow] = useState<HoaSubmittalRow | null>(null);
  const [template, setTemplate] = useState<HoaTemplateRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState<"pdf" | "removal" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getHoaSubmittal(id).then(async (r) => {
      setRow(r);
      if (r?.template_id) {
        try { setTemplate(await getHoaTemplate(r.template_id)); } catch { /* ignore */ }
      }
    }).catch((e) => setErr(String(e?.message ?? e)));
  }, [id]);

  function patch<K extends keyof HoaSubmittalRow>(key: K, value: HoaSubmittalRow[K]) {
    setRow((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const isFence = row?.project_type === "fence";
  const checklistComplete = useMemo(() => isChecklistComplete(row?.checklist), [row?.checklist]);

  function onProjectTypeChange(next: HoaProjectType | "") {
    if (!row) return;
    const nextType = (next || null) as HoaProjectType | null;
    // Only reset the checklist if empty or if the user hasn't customized it.
    const currentUncheckedAll = (row.checklist ?? []).every((i) => !i.checked && !i.document_path);
    const nextChecklist = currentUncheckedAll ? checklistForType(nextType) : row.checklist;
    setRow({ ...row, project_type: nextType, checklist: nextChecklist });
  }

  async function save() {
    if (!row) return;
    setSaving(true);
    try {
      const updated = await updateHoaSubmittal(row.id, {
        permit_id: row.permit_id,
        source: row.source,
        status: row.status,
        applicant_name: row.applicant_name,
        applicant_email: row.applicant_email,
        applicant_phone: row.applicant_phone,
        property_address: row.property_address,
        lot: row.lot,
        block: row.block,
        plat_name: row.plat_name,
        hoa_name: row.hoa_name,
        community_name: row.community_name,
        village_name: row.village_name,
        model_type: row.model_type,
        project_type: row.project_type,
        project_description: row.project_description,
        scope_of_work: row.scope_of_work,
        contractor_name: row.contractor_name,
        contractor_license: row.contractor_license,
        estimated_start_date: row.estimated_start_date,
        deposit_amount_cents: row.deposit_amount_cents,
        coi_attached: row.coi_attached,
        plans_attached: row.plans_attached,
        checklist: row.checklist,
        notes: row.notes,
        homeowner_name: row.homeowner_name,
        homeowner_email: row.homeowner_email,
      } as any);
      setRow(updated);
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(next: HoaStatus) {
    if (!row) return;
    try {
      const updated = await updateHoaSubmittal(row.id, {
        status: next,
        submitted_at: next !== "draft" && !row.submitted_at ? new Date().toISOString() : row.submitted_at,
      });
      setRow(updated);
      toast.success(`Status updated: ${HOA_STATUS_LABELS[next]}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update status");
    }
  }

  async function toggleChecklist(idx: number, checked: boolean) {
    if (!row) return;
    const next = row.checklist.map((it, i) => (i === idx ? { ...it, checked } : it));
    setRow({ ...row, checklist: next });
    try {
      await updateHoaSubmittal(row.id, { checklist: next });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update checklist");
    }
  }

  async function attachChecklistFile(idx: number, file: File) {
    if (!row) return;
    try {
      const up = await uploadHoaFile(row.id, `checklist/${row.checklist[idx].key}`, file);
      const next = row.checklist.map((it, i) =>
        i === idx ? { ...it, checked: true, document_path: up.path, filename: up.filename } : it,
      );
      setRow({ ...row, checklist: next });
      await updateHoaSubmittal(row.id, { checklist: next });
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    }
  }

  async function openStoredFile(path: string) {
    const url = await getHoaFileSignedUrl(path);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Unable to open file");
  }

  async function generatePdf() {
    if (!row) return;
    setGenerating("pdf");
    try {
      const latest = await updateHoaSubmittal(row.id, {}); // touch/read
      const path = await buildAndStoreBoilerplate({ ...latest, ...row });
      const updated = await getHoaSubmittal(row.id);
      if (updated) setRow(updated);
      toast.success("Submittal PDF generated");
      const url = await getHoaFileSignedUrl(path);
      if (url) window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message ?? "PDF generation failed");
    } finally {
      setGenerating(null);
    }
  }

  async function generateRemoval() {
    if (!row) return;
    setGenerating("removal");
    try {
      const path = await buildAndStoreRemovalAgreement(row);
      const updated = await getHoaSubmittal(row.id);
      if (updated) setRow(updated);
      toast.success("Removal Agreement generated");
      const url = await getHoaFileSignedUrl(path);
      if (url) window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setGenerating(null);
    }
  }

  async function onDelete() {
    if (!row) return;
    if (!confirm("Delete this HOA submittal? This cannot be undone.")) return;
    try {
      await deleteHoaSubmittal(row.id);
      toast.success("Deleted");
      navigate({ to: "/portal/hoa-submittals" });
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  }

  async function sendToHoa() {
    if (!row) return;
    if (sending) return;
    if (!template?.hoa_contact_email) {
      toast.error("No HOA contact email on file. Add one to the template first.");
      return;
    }
    if (!checklistComplete) {
      const ok = confirm(
        "Some required documents are still outstanding. Send to HOA anyway?",
      );
      if (!ok) return;
    }
    // Ensure we have a generated PDF to attach.
    if (!row.generated_pdf_path) {
      const generate = confirm(
        "No Submittal PDF has been generated yet. Generate it now and include it in the send?",
      );
      if (generate) {
        await generatePdf();
      }
    }
    setSending(true);
    try {
      const res = await sendHoaSubmittal(row.id, {
        tenantId: session.effectiveTenantId,
        userId: session.userId,
      });
      const updated = await getHoaSubmittal(row.id);
      if (updated) setRow(updated);
      for (const w of res.warnings) toast.warning(w);
      toast.success(
        res.homeownerEmailId
          ? "Queued: ARC package to HOA + deposit notice to homeowner"
          : "Queued: ARC package to HOA",
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  }

  if (err) {
    return (
      <PortalShell>
        <div className="border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3 rounded-[3px] max-w-2xl">{err}</div>
      </PortalShell>
    );
  }
  if (!row) {
    return (
      <PortalShell>
        <div className="text-sm text-muted-foreground">Loading…</div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/portal/hoa-submittals" className="inline-flex items-center gap-1 text-xs text-obsidian/60 hover:text-obsidian">
              <ArrowLeft className="h-3 w-3" /> HOA Submittals
            </Link>
            <h1 className="mt-4 font-display text-4xl tracking-tight text-obsidian">
              {row.property_address || "HOA Submittal"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {row.source === "uploaded_form" ? "From uploaded HOA form" : "Cleard boilerplate template"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={row.status}
              onChange={(e) => changeStatus(e.target.value as HoaStatus)}
              className="border border-obsidian/20 bg-white px-3 py-2 text-sm rounded-[3px]"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{HOA_STATUS_LABELS[s]}</option>
              ))}
            </select>
            <Button variant="dark" className="rounded-[3px] gap-2" onClick={save} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="dark"
              className="rounded-[3px] gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={sendToHoa}
              disabled={sending || Boolean(row.sent_to_hoa_at)}
              title={row.sent_to_hoa_at ? `Sent ${new Date(row.sent_to_hoa_at).toLocaleString()}` : "Send ARC package to HOA and notify homeowner"}
            >
              {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> {row.sent_to_hoa_at ? "Sent" : "Send to HOA"}</>}
            </Button>
            <Button variant="outline" className="rounded-[3px] gap-2 text-red-700 border-red-200 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {template && (
          <div className="border border-obsidian/10 bg-white rounded-[3px] px-4 py-3 text-sm flex flex-wrap items-center gap-x-6 gap-y-1">
            <div className="text-xs uppercase tracking-wide text-obsidian/50">Template</div>
            <div className="font-medium text-obsidian">{displayNameFor(template)}</div>
            {template.hoa_contact_name && (
              <div className="text-obsidian/70">{template.hoa_contact_name}</div>
            )}
            {template.hoa_contact_email && (
              <div className="text-obsidian/60 inline-flex items-center gap-1">
                <Mail className="h-3 w-3" /> {template.hoa_contact_email}
              </div>
            )}
            {template.deposit_amount_cents > 0 && (
              <div className="text-obsidian/60">Deposit ${(template.deposit_amount_cents / 100).toLocaleString()}</div>
            )}
          </div>
        )}

        {row.sent_to_hoa_at && (
          <div className="border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm px-4 py-3 rounded-[3px]">
            Package sent to HOA {new Date(row.sent_to_hoa_at).toLocaleString()}.
            {row.homeowner_notified_at && ` Homeowner deposit notice sent ${new Date(row.homeowner_notified_at).toLocaleString()}.`}
          </div>
        )}

        {isFence && (
          <div className="border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3 rounded-[3px] flex gap-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-none" />
            <div>
              <div className="font-medium">Fence projects require a notarized Removal Agreement.</div>
              <div>This must be signed and notarized before HOA submittal. Generate and route below.</div>
            </div>
          </div>
        )}

        {row.uploaded_form_path && (
          <div className="border border-obsidian/10 bg-paper-warm rounded-[3px] px-4 py-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium text-obsidian">Uploaded HOA form</div>
              <div className="text-xs text-muted-foreground">Auto-fill applied from your project data.</div>
            </div>
            <Button variant="outline" className="rounded-[3px] gap-2" onClick={() => openStoredFile(row.uploaded_form_path!)}>
              <Download className="h-4 w-4" /> View
            </Button>
          </div>
        )}

        <Section title="Applicant & Property">
          <Field label="Applicant Name(s)"><Input value={row.applicant_name ?? ""} onChange={(v) => patch("applicant_name", v)} /></Field>
          <Field label="Email"><Input value={row.applicant_email ?? ""} onChange={(v) => patch("applicant_email", v)} /></Field>
          <Field label="Phone"><Input value={row.applicant_phone ?? ""} onChange={(v) => patch("applicant_phone", v)} /></Field>
          <Field label="Property Address"><Input value={row.property_address ?? ""} onChange={(v) => patch("property_address", v)} /></Field>
          <Field label="Lot"><Input value={row.lot ?? ""} onChange={(v) => patch("lot", v)} /></Field>
          <Field label="Block"><Input value={row.block ?? ""} onChange={(v) => patch("block", v)} /></Field>
          <Field label="Plat Name"><Input value={row.plat_name ?? ""} onChange={(v) => patch("plat_name", v)} /></Field>
        </Section>

        <Section title="HOA / Community">
          <Field label="HOA / Association Name"><Input value={row.hoa_name ?? ""} onChange={(v) => patch("hoa_name", v)} /></Field>
          <Field label="Community"><Input value={row.community_name ?? ""} onChange={(v) => patch("community_name", v)} /></Field>
          <Field label="Village"><Input value={row.village_name ?? ""} onChange={(v) => patch("village_name", v)} /></Field>
          <Field label="Model Type"><Input value={row.model_type ?? ""} onChange={(v) => patch("model_type", v)} /></Field>
        </Section>

        <Section title="Project">
          <Field label="Project Type">
            <select
              value={row.project_type ?? ""}
              onChange={(e) => onProjectTypeChange(e.target.value as HoaProjectType | "")}
              className="w-full border border-obsidian/20 bg-white px-3 py-2 text-sm rounded-[3px]"
            >
              <option value="">Select type…</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>{HOA_PROJECT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </Field>
          <Field label="Estimated Start Date">
            <Input type="date" value={row.estimated_start_date ?? ""} onChange={(v) => patch("estimated_start_date", v || null)} />
          </Field>
          <Field label="Contractor Name"><Input value={row.contractor_name ?? ""} onChange={(v) => patch("contractor_name", v)} /></Field>
          <Field label="Contractor License #"><Input value={row.contractor_license ?? ""} onChange={(v) => patch("contractor_license", v)} /></Field>
          <Field label="Deposit Amount ($)">
            <Input
              type="number"
              value={String(row.deposit_amount_cents / 100)}
              onChange={(v) => patch("deposit_amount_cents", Math.round(Number(v || 0) * 100))}
            />
          </Field>
          <Field label="Scope / Description" full>
            <textarea
              value={row.scope_of_work ?? ""}
              onChange={(e) => patch("scope_of_work", e.target.value)}
              rows={4}
              className="w-full border border-obsidian/20 bg-white px-3 py-2 text-sm rounded-[3px]"
              placeholder="Describe the work…"
            />
          </Field>
          <Field label="COI attached">
            <Toggle checked={row.coi_attached} onChange={(v) => patch("coi_attached", v)} />
          </Field>
          <Field label="Plans attached">
            <Toggle checked={row.plans_attached} onChange={(v) => patch("plans_attached", v)} />
          </Field>
        </Section>

        {/* Checklist */}
        <Section title="Document Checklist" columns={1}>
          <div className="text-xs text-muted-foreground -mt-2 mb-2">
            {row.project_type
              ? `Required for ${HOA_PROJECT_TYPE_LABELS[row.project_type]} projects.`
              : "Choose a project type to load the required documents for that type."}
          </div>
          <ChecklistBlock items={row.checklist} onToggle={toggleChecklist} onAttach={attachChecklistFile} onOpen={openStoredFile} />
          <div className="mt-3 text-xs">
            {checklistComplete ? (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> All required items complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Some required items are outstanding — submittal is not complete.
              </span>
            )}
          </div>
        </Section>

        {/* Generation actions */}
        <Section title="Generate & Route" columns={1}>
          <div className="flex flex-wrap gap-3">
            <Button variant="dark" className="rounded-[3px] gap-2" onClick={generatePdf} disabled={generating !== null}>
              {generating === "pdf" ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Download className="h-4 w-4" /> Generate Submittal PDF</>}
            </Button>
            {isFence && (
              <Button variant="outline" className="rounded-[3px] gap-2" onClick={generateRemoval} disabled={generating !== null}>
                {generating === "removal" ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><FileSignature className="h-4 w-4" /> Generate Removal Agreement</>}
              </Button>
            )}
            {row.generated_pdf_path && (
              <Button variant="outline" className="rounded-[3px] gap-2" onClick={() => openStoredFile(row.generated_pdf_path!)}>
                <Download className="h-4 w-4" /> Open latest PDF
              </Button>
            )}
            {row.removal_agreement_path && (
              <Button variant="outline" className="rounded-[3px] gap-2" onClick={() => openStoredFile(row.removal_agreement_path!)}>
                <Download className="h-4 w-4" /> Open Removal Agreement
              </Button>
            )}
          </div>
        </Section>

        <Section title="Notes" columns={1}>
          <textarea
            value={row.notes ?? ""}
            onChange={(e) => patch("notes", e.target.value)}
            rows={3}
            className="w-full border border-obsidian/20 bg-white px-3 py-2 text-sm rounded-[3px]"
            placeholder="Internal notes on ARC review, meeting date, comments…"
          />
        </Section>
      </div>
    </PortalShell>
  );
}

function Section({ title, children, columns = 2 }: { title: string; children: React.ReactNode; columns?: 1 | 2 }) {
  return (
    <section className="border border-obsidian/10 rounded-[3px] bg-white p-6 space-y-4">
      <h2 className="font-display text-2xl text-obsidian">{title}</h2>
      <div className={columns === 1 ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {children}
      </div>
    </section>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs uppercase tracking-wide text-obsidian/60">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input({ value, onChange, type }: { value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input
      type={type ?? "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-obsidian/20 bg-white px-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none"
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 border px-3 py-1.5 text-sm rounded-[3px] ${
        checked ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-obsidian/20 text-obsidian/70"
      }`}
    >
      {checked ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      {checked ? "Yes" : "No"}
    </button>
  );
}

function ChecklistBlock({
  items,
  onToggle,
  onAttach,
  onOpen,
}: {
  items: HoaChecklistItem[];
  onToggle: (idx: number, checked: boolean) => void;
  onAttach: (idx: number, file: File) => void;
  onOpen: (path: string) => void;
}) {
  if (!items || items.length === 0) {
    return <div className="text-sm text-muted-foreground">No checklist items yet.</div>;
  }
  return (
    <ul className="divide-y divide-obsidian/10 border border-obsidian/10 rounded-[3px]">
      {items.map((it, idx) => (
        <li key={it.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => onToggle(idx, !it.checked)}
            className={`inline-flex items-center gap-2 text-sm ${it.checked ? "text-emerald-700" : "text-obsidian/70"}`}
          >
            {it.checked ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            <span>{it.label}</span>
            {it.required && <span className="text-[10px] uppercase tracking-wide text-red-600">Required</span>}
          </button>
          <div className="ml-auto flex items-center gap-2">
            {it.document_path && (
              <button
                type="button"
                onClick={() => onOpen(it.document_path!)}
                className="text-xs text-obsidian underline underline-offset-4"
              >
                {it.filename ?? "View"}
              </button>
            )}
            <label className="cursor-pointer inline-flex items-center gap-1 text-xs border border-obsidian/20 hover:bg-obsidian/5 px-2 py-1 rounded-[3px]">
              <Upload className="h-3 w-3" /> Attach
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onAttach(idx, f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </li>
      ))}
    </ul>
  );
}
