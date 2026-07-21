import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Save, AlertTriangle, FileText, Pencil, X, Lock, Plus } from "lucide-react";

import { getPermit, updatePermit, deletePermit, permitCompleteness, getEffectiveDocs, type PermitRow, type PermitStatus, type PermitDoc } from "@/lib/permits-api";
import { PermitDocUploader } from "@/components/permit-doc-uploader";
import { deletePermitFile } from "@/lib/permit-storage";

export const Route = createFileRoute("/portal/permits/$id")({
  head: () => ({
    meta: [
      { title: "Permit — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PermitDetailPage,
});

const STATUSES: PermitStatus[] = [
  "submitted", "in_review", "corrections_required", "approved", "permit_issued", "on_hold", "outsourced_permitting", "cancelled",
];

function PermitDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<PermitRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<Partial<PermitRow>>({});


  useEffect(() => {
    getPermit(id)
      .then((r) => { if (!r) throw notFound(); setRow(r); setEdit(r); })
      .catch(() => toast.error("Could not load permit"))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!row) return;
    setSaving(true);
    try {
      const updated = await updatePermit(row.id, edit);
      setRow(updated);
      setEdit(updated);
      setEditing(false);
      toast.success("Saved");
    } catch (e) {
      toast.error("Save failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (row) setEdit(row);
    setEditing(false);
  }


  async function remove() {
    if (!row) return;
    if (!confirm(`Delete permit "${row.project_name}"? This cannot be undone.`)) return;
    try {
      await deletePermit(row.id);
      toast.success("Deleted");
      navigate({ to: "/my-permits" });
    } catch (e) {
      toast.error("Delete failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-6 py-12 text-obsidian/60">Loading…</div>;
  if (!row) return <div className="mx-auto max-w-5xl px-6 py-12 text-obsidian/60">Permit not found.</div>;

  const c = permitCompleteness(row);
  const missingFieldKeys = new Set(c.missingFields.map((f) => f.key));
  const barColor = c.percent === 100 ? "#16a34a" : c.percent >= 60 ? "#153157" : c.percent >= 30 ? "#d97706" : "#dc2626";
  const inputBase = "block w-full border bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:outline-none";
  const inputCls = (k: string) => `${inputBase} ${missingFieldKeys.has(k) ? "border-red-500/60 focus:border-red-600" : "border-obsidian/15 focus:border-obsidian/40"}`;
  const labelCls = (k: string) => `flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] mb-1.5 ${missingFieldKeys.has(k) ? "text-red-700" : "text-obsidian/60"}`;
  const flag = (k: string) => missingFieldKeys.has(k) ? <AlertTriangle className="h-3 w-3 text-red-600" /> : null;

  function set<K extends keyof PermitRow>(k: K, v: PermitRow[K]) { setEdit((p) => ({ ...p, [k]: v })); }
  const e = edit as PermitRow;
  const docs = getEffectiveDocs(row);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link to="/my-permits" className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-obsidian/60 hover:text-obsidian">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Permits
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-6">
        <div>
          <div className="eyebrow text-obsidian/50">Permit</div>
          <h1 className="display-serif mt-2 text-4xl text-obsidian">{row.project_name}</h1>
          <div className="mt-2 text-sm text-obsidian/60">{row.job_address}</div>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
                <Lock className="h-3 w-3" /> Read only
              </span>
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={remove} className="inline-flex items-center gap-2 border border-red-600/30 text-red-700 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={cancelEdit} disabled={saving} className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] disabled:opacity-60">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px] disabled:opacity-60">
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={remove} className="inline-flex items-center gap-2 border border-red-600/30 text-red-700 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
        </div>

      </div>

      {/* Completeness panel */}
      <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Permit Completeness</div>
            <div className="mt-1 text-sm text-obsidian/70">
              <span className="font-medium text-obsidian">{c.done}/{c.total}</span> items complete — {c.percent}%
            </div>
          </div>
          <div className="flex gap-4 text-[11px] font-mono uppercase tracking-[0.12em] text-obsidian/60">
            <span>Fields: <span className="text-obsidian font-medium tabular-nums">{c.fieldsDone}/{c.fieldsTotal}</span></span>
            <span>Docs: <span className="text-obsidian font-medium tabular-nums">{c.docsDone}/{c.docsTotal}</span></span>
          </div>
        </div>
        <div className="mt-4 h-2 bg-obsidian/10 rounded-full overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${c.percent}%`, background: barColor }} />
        </div>

        {(c.missingFields.length > 0 || c.missingDocs.length > 0) && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {c.missingFields.length > 0 && (
              <div className="border border-red-500/30 bg-red-50 rounded-[3px] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                  <AlertTriangle className="h-4 w-4" /> {c.missingFields.length} missing field{c.missingFields.length === 1 ? "" : "s"}
                </div>
                <ul className="mt-2 text-[12px] text-red-900/80 space-y-1">
                  {c.missingFields.map((f) => (
                    <li key={f.key}>• {f.label}</li>
                  ))}
                </ul>
              </div>
            )}
            {c.missingDocs.length > 0 && (
              <div className="border border-amber-500/40 bg-amber-50 rounded-[3px] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                  <FileText className="h-4 w-4" /> {c.missingDocs.length} missing document{c.missingDocs.length === 1 ? "" : "s"}
                </div>
                <ul className="mt-2 text-[12px] text-amber-900/80 space-y-1">
                  {c.missingDocs.map((d) => (
                    <li key={d.key} className="flex items-center justify-between gap-2">
                      <span>• {d.label}{d.required && <span className="ml-1.5 text-[10px] font-mono uppercase text-red-700">Required</span>}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`doc-${d.key}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-800 hover:underline"
                      >
                        Upload →
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <fieldset disabled={!editing} className="mt-6 grid gap-6 md:grid-cols-2 disabled:opacity-90">
        <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Project</div>
          <div><label className={labelCls("project_name")}>Project Name {flag("project_name")}</label><input className={inputCls("project_name")} value={e.project_name ?? ""} onChange={(ev) => set("project_name", ev.target.value)} /></div>
          <div><label className={labelCls("job_address")}>Address {flag("job_address")}</label><input className={inputCls("job_address")} value={e.job_address ?? ""} onChange={(ev) => set("job_address", ev.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls("city")}>City {flag("city")}</label><input className={inputCls("city")} value={e.city ?? ""} onChange={(ev) => set("city", ev.target.value)} /></div>
            <div><label className={labelCls("county")}>County {flag("county")}</label><input className={inputCls("county")} value={e.county ?? ""} onChange={(ev) => set("county", ev.target.value)} /></div>
          </div>
          <div><label className={labelCls("municipality")}>Municipality {flag("municipality")}</label><input className={inputCls("municipality")} value={e.municipality ?? ""} onChange={(ev) => set("municipality", ev.target.value)} /></div>
          <div><label className={labelCls("permit_type")}>Permit Type {flag("permit_type")}</label><input className={inputCls("permit_type")} value={e.permit_type ?? ""} onChange={(ev) => set("permit_type", ev.target.value)} /></div>
          <div><label className={labelCls("permit_number")}>Permit # {flag("permit_number")}</label><input className={inputCls("permit_number")} value={e.permit_number ?? ""} onChange={(ev) => set("permit_number", ev.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls("construction_value_cents")}>Construction Value (USD) {flag("construction_value_cents")}</label>
              <input type="number" className={inputCls("construction_value_cents")} value={e.construction_value_cents ? Math.round(e.construction_value_cents / 100) : ""} onChange={(ev) => set("construction_value_cents", ev.target.value ? Math.round(Number(ev.target.value) * 100) : 0)} />
            </div>
            <div><label className={labelCls("pcn")}>PCN {flag("pcn")}</label><input className={inputCls("pcn")} value={e.pcn ?? ""} onChange={(ev) => set("pcn", ev.target.value)} /></div>
          </div>
          <div><label className={labelCls("submitted_date")}>Submitted Date {flag("submitted_date")}</label><input type="date" className={inputCls("submitted_date")} value={e.submitted_date ?? ""} onChange={(ev) => set("submitted_date", ev.target.value)} /></div>
          <div>
            <label className={labelCls("status")}>Status</label>
            <select className={inputCls("status")} value={e.status ?? "submitted"} onChange={(ev) => set("status", ev.target.value as PermitStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div><label className={labelCls("description")}>Description {flag("description")}</label><textarea rows={3} className={inputCls("description")} value={e.description ?? ""} onChange={(ev) => set("description", ev.target.value)} /></div>
        </div>

        <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Contractor & Owner</div>
          <div><label className={labelCls("contractor_company")}>Contractor Company {flag("contractor_company")}</label><input className={inputCls("contractor_company")} value={e.contractor_company ?? ""} onChange={(ev) => set("contractor_company", ev.target.value)} /></div>
          <div><label className={labelCls("contractor_qualifier")}>Qualifier {flag("contractor_qualifier")}</label><input className={inputCls("contractor_qualifier")} value={e.contractor_qualifier ?? ""} onChange={(ev) => set("contractor_qualifier", ev.target.value)} /></div>
          <div><label className={labelCls("company_address")}>Company Address {flag("company_address")}</label><input className={inputCls("company_address")} value={e.company_address ?? ""} onChange={(ev) => set("company_address", ev.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls("poc")}>POC {flag("poc")}</label><input className={inputCls("poc")} value={e.poc ?? ""} onChange={(ev) => set("poc", ev.target.value)} /></div>
            <div><label className={labelCls("poc_phone")}>POC Phone {flag("poc_phone")}</label><input className={inputCls("poc_phone")} value={e.poc_phone ?? ""} onChange={(ev) => set("poc_phone", ev.target.value)} /></div>
          </div>
          <div><label className={labelCls("poc_email")}>POC Email {flag("poc_email")}</label><input className={inputCls("poc_email")} value={e.poc_email ?? ""} onChange={(ev) => set("poc_email", ev.target.value)} /></div>
          <div><label className={labelCls("license_number")}>License # {flag("license_number")}</label><input className={inputCls("license_number")} value={e.license_number ?? ""} onChange={(ev) => set("license_number", ev.target.value)} /></div>
          <div className="pt-2 border-t border-obsidian/10">
            <label className={labelCls("owner_name")}>Owner Name {flag("owner_name")}</label><input className={inputCls("owner_name")} value={e.owner_name ?? ""} onChange={(ev) => set("owner_name", ev.target.value)} />
          </div>
          <div><label className={labelCls("owner_entity")}>Owner Entity</label><input className={inputBase + " border-obsidian/15 focus:border-obsidian/40"} value={e.owner_entity ?? ""} onChange={(ev) => set("owner_entity", ev.target.value)} /></div>
        </div>
      </fieldset>


      <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Documents</div>
          <span className="font-mono text-[11px] tabular-nums text-obsidian/60">{c.docsDone}/{c.docsTotal} complete</span>
        </div>
        <div className="text-[12px] text-obsidian/55 mb-2">
          Files upload to secure cloud storage. Google Drive & OneDrive import requires the App User Connector to be enabled in workspace settings.
        </div>
        <div>
          {docs.map((d) => (
            <div key={d.key} id={`doc-${d.key}`}>
              <PermitDocUploader permit={row} doc={d} readOnly={!editing} onChange={(u) => { setRow(u); setEdit(u); }} />
            </div>
          ))}
        </div>
      </div>

      {row.subs && row.subs.length > 0 && (
        <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75 mb-4">Subcontractors on this Permit</div>
          <ul className="divide-y divide-obsidian/10">
            {row.subs.map((s, i) => (
              <li key={i} className="py-3 text-sm">
                <div className="text-obsidian font-medium">{s.companyName} <span className="text-obsidian/50 text-[12px] font-normal">— {s.trade}</span></div>
                <div className="text-[12px] text-obsidian/60">{s.qualifierName} · Lic {s.licenseNumber} · {s.contactEmail}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 text-[11px] font-mono text-obsidian/45">
        Created {new Date(row.created_at).toLocaleString()} · Updated {new Date(row.updated_at).toLocaleString()}
      </div>
    </div>
  );
}
