import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, FileUp } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { getPermit } from "@/lib/permits-api";
import { createHoaSubmittal, checklistForType } from "@/lib/hoa-submittals";
import {
  createHoaTemplate,
  markTemplateUsed,
  type HoaSubmissionMethod,
  type HoaTemplateRequiredDoc,
} from "@/lib/hoa-templates";

type Search = { permitId?: string };

export const Route = createFileRoute("/portal/hoa-submittals/templates/new")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    permitId: typeof s.permitId === "string" ? s.permitId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Add HOA to Repository — Cleard by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewHoaTemplate,
});

const METHODS: { value: HoaSubmissionMethod; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "portal", label: "Online Portal" },
  { value: "in_person", label: "In Person" },
  { value: "mail", label: "Mail" },
];

const DEFAULT_DOCS: HoaTemplateRequiredDoc[] = [
  { key: "lot_survey_drawing", label: "Lot Survey with Project Drawing", required: true },
  { key: "coi", label: "Certificate of Insurance (COI)", required: true },
  { key: "plans", label: "Stamped Plans / Elevations", required: true },
  { key: "deposit_receipt", label: "Deposit Receipt", required: false },
  { key: "color_samples", label: "Color / Material Samples", required: false },
];

function NewHoaTemplate() {
  const navigate = useNavigate();
  const { permitId } = useSearch({ from: "/portal/hoa-submittals/templates/new" });
  const session = useSession();

  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    community_name: "",
    city: "",
    hoa_contact_name: "",
    hoa_contact_email: "",
    hoa_contact_phone: "",
    submission_method: "email" as HoaSubmissionMethod,
    submission_portal_url: "",
    deposit_amount: "",
    deposit_type: "check",
    arc_meeting_notes: "",
  });
  const [docs, setDocs] = useState<HoaTemplateRequiredDoc[]>(DEFAULT_DOCS);
  const [uploadedFormPath, setUploadedFormPath] = useState<string | null>(null);
  const [uploadedFormName, setUploadedFormName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function toggleDoc(idx: number) {
    setDocs((prev) => prev.map((d, i) => (i === idx ? { ...d, required: !d.required } : d)));
  }

  function removeDoc(idx: number) {
    setDocs((prev) => prev.filter((_, i) => i !== idx));
  }

  function addDoc() {
    const label = window.prompt("Document name (e.g. 'Fence color spec')");
    if (!label) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);
    setDocs((prev) => [...prev, { key, label, required: true }]);
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const key = `hoa-templates/${crypto.randomUUID()}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error } = await supabase.storage
        .from("permit-files")
        .upload(key, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      setUploadedFormPath(key);
      setUploadedFormName(file.name);
      toast.success("Form uploaded — mapping applied");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function prefillFromPermit() {
    if (!permitId) return {};
    try {
      const p = await getPermit(permitId);
      if (!p) return {};
      return {
        permit_id: p.id,
        applicant_name: p.owner_name || p.poc || "",
        applicant_email: p.poc_email || "",
        applicant_phone: p.poc_phone || "",
        property_address: p.job_address,
        contractor_name: p.contractor_company,
        contractor_license: p.license_number,
        scope_of_work: p.description ?? "",
        project_description: p.description ?? "",
      };
    } catch {
      return {};
    }
  }

  async function saveAndStart() {
    if (!form.community_name.trim() || !form.city.trim()) {
      toast.error("Community and City are required.");
      return;
    }
    if (form.submission_method === "email" && !form.hoa_contact_email.trim()) {
      toast.error("HOA contact email is required when submission method is Email.");
      return;
    }
    setBusy(true);
    try {
      const depositCents = Math.round(Number(form.deposit_amount || 0) * 100);
      const tpl = await createHoaTemplate({
        community_name: form.community_name.trim(),
        city: form.city.trim(),
        hoa_contact_name: form.hoa_contact_name.trim() || null,
        hoa_contact_email: form.hoa_contact_email.trim() || null,
        hoa_contact_phone: form.hoa_contact_phone.trim() || null,
        submission_method: form.submission_method,
        submission_portal_url: form.submission_portal_url.trim() || null,
        required_documents: docs,
        deposit_amount_cents: depositCents,
        deposit_type: form.deposit_type || null,
        arc_meeting_notes: form.arc_meeting_notes.trim() || null,
        uploaded_form_path: uploadedFormPath,
        form_template: {},
        created_by: session.userId,
        created_by_tenant_id: session.effectiveTenantId,
      });

      const prefill = await prefillFromPermit();
      const row = await createHoaSubmittal({
        source: uploadedFormPath ? "uploaded_form" : "boilerplate",
        status: "draft",
        tenant_id: session.effectiveTenantId,
        created_by: session.userId,
        template_id: tpl.id,
        hoa_name: tpl.community_name,
        community_name: tpl.community_name,
        uploaded_form_path: tpl.uploaded_form_path,
        deposit_amount_cents: tpl.deposit_amount_cents,
        checklist: checklistForType(null),
        documents: [],
        missing_fields: [],
        extracted_fields: { source_template: tpl.id },
        ...prefill,
      } as any);

      markTemplateUsed(tpl.id).catch(() => undefined);
      toast.success(`Added ${tpl.community_name} (${tpl.city}) to the repository`);
      navigate({ to: "/portal/hoa-submittals/$id", params: { id: row.id } });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.toLowerCase().includes("duplicate")) {
        toast.error("A template for this community/city already exists. Search for it instead.");
      } else {
        toast.error(msg);
      }
      setBusy(false);
    }
  }

  return (
    <PortalShell>
      <div className="space-y-8 max-w-4xl">
        <div>
          <Link to="/portal/hoa-submittals/new" className="inline-flex items-center gap-1 text-xs text-obsidian/60 hover:text-obsidian">
            <ArrowLeft className="h-3 w-3" /> Repository
          </Link>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-obsidian">Add HOA to Repository</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Set up this community once. Every future Cleard submittal for the same HOA pre-fills from this template.
          </p>
        </div>

        <Section title="Community">
          <Field label="Community Name">
            <TextInput value={form.community_name} onChange={(v) => setField("community_name", v)} placeholder="Olympia ARC" />
          </Field>
          <Field label="City / Municipality">
            <TextInput value={form.city} onChange={(v) => setField("city", v)} placeholder="Wellington" />
          </Field>
        </Section>

        <Section title="HOA Contact">
          <Field label="Contact Name">
            <TextInput value={form.hoa_contact_name} onChange={(v) => setField("hoa_contact_name", v)} placeholder="ARC Committee Chair" />
          </Field>
          <Field label="Contact Email">
            <TextInput value={form.hoa_contact_email} onChange={(v) => setField("hoa_contact_email", v)} placeholder="arc@community.com" />
          </Field>
          <Field label="Contact Phone">
            <TextInput value={form.hoa_contact_phone} onChange={(v) => setField("hoa_contact_phone", v)} placeholder="(561) 555-0100" />
          </Field>
          <Field label="Submission Method">
            <select
              value={form.submission_method}
              onChange={(e) => setField("submission_method", e.target.value as HoaSubmissionMethod)}
              className="w-full border border-obsidian/20 bg-white px-3 py-2 text-sm rounded-[3px]"
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>
          {form.submission_method === "portal" && (
            <Field label="Portal URL" full>
              <TextInput value={form.submission_portal_url} onChange={(v) => setField("submission_portal_url", v)} placeholder="https://arc.community.com" />
            </Field>
          )}
        </Section>

        <Section title="Deposit">
          <Field label="Deposit Amount ($)">
            <TextInput type="number" value={form.deposit_amount} onChange={(v) => setField("deposit_amount", v)} placeholder="500" />
          </Field>
          <Field label="Deposit Type">
            <select
              value={form.deposit_type}
              onChange={(e) => setField("deposit_type", e.target.value)}
              className="w-full border border-obsidian/20 bg-white px-3 py-2 text-sm rounded-[3px]"
            >
              <option value="check">Check</option>
              <option value="ach">ACH</option>
              <option value="wire">Wire</option>
              <option value="cash">Cash</option>
              <option value="none">None</option>
            </select>
          </Field>
        </Section>

        <Section title="ARC Form (optional)" columns={1}>
          <p className="text-sm text-muted-foreground -mt-2">
            Upload the HOA's own ARC/architectural review PDF. Cleard maps fields against your project data on future submittals.
          </p>
          {uploadedFormPath ? (
            <div className="text-sm text-obsidian/80">
              Uploaded: <span className="font-medium">{uploadedFormName}</span>
            </div>
          ) : (
            <label className="inline-block cursor-pointer">
              <input type="file" accept="application/pdf,image/*" className="hidden" onChange={onFilePicked} disabled={uploading} />
              <span className="inline-flex items-center gap-2 border border-obsidian/20 hover:bg-obsidian/5 px-4 py-2 text-sm rounded-[3px]">
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><FileUp className="h-4 w-4" /> Choose PDF</>}
              </span>
            </label>
          )}
        </Section>

        <Section title="Required Documents" columns={1}>
          <p className="text-sm text-muted-foreground -mt-2">
            Configure what this HOA requires. This checklist appears on every submittal to this community.
          </p>
          <ul className="divide-y divide-obsidian/10 border border-obsidian/10 rounded-[3px]">
            {docs.map((d, i) => (
              <li key={d.key + i} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleDoc(i)}
                  className={`text-xs uppercase tracking-wide px-2 py-1 rounded-[3px] border ${
                    d.required ? "bg-red-50 border-red-200 text-red-700" : "bg-obsidian/5 border-obsidian/10 text-obsidian/60"
                  }`}
                >
                  {d.required ? "Required" : "Optional"}
                </button>
                <span className="text-sm text-obsidian">{d.label}</span>
                <button type="button" onClick={() => removeDoc(i)} className="ml-auto text-xs text-obsidian/50 hover:text-red-700">
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={addDoc} className="text-sm text-obsidian underline underline-offset-4">
            + Add document
          </button>
        </Section>

        <Section title="ARC Meeting Notes" columns={1}>
          <textarea
            value={form.arc_meeting_notes}
            onChange={(e) => setField("arc_meeting_notes", e.target.value)}
            rows={3}
            className="w-full border border-obsidian/20 bg-white px-3 py-2 text-sm rounded-[3px]"
            placeholder="Meets 2nd Tuesday of each month. Submittals due 10 days prior."
          />
        </Section>

        <div className="flex items-center gap-3">
          <Button variant="dark" className="rounded-[3px] gap-2" onClick={saveAndStart} disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save & Start Submittal</>}
          </Button>
          <Link to="/portal/hoa-submittals/new" className="text-sm text-obsidian/60 hover:text-obsidian">
            Cancel
          </Link>
        </div>
      </div>
    </PortalShell>
  );
}

function Section({ title, children, columns = 2 }: { title: string; children: React.ReactNode; columns?: 1 | 2 }) {
  return (
    <section className="border border-obsidian/10 rounded-[3px] bg-white p-6 space-y-4">
      <h2 className="font-display text-2xl text-obsidian">{title}</h2>
      <div className={columns === 1 ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>{children}</div>
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

function TextInput({
  value,
  onChange,
  placeholder,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type ?? "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-obsidian/20 bg-white px-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none"
    />
  );
}
